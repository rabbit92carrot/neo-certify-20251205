/**
 * 시술 서비스
 * 시술 등록, 조회, 회수 관련 비즈니스 로직
 *
 * 핵심 기능:
 * - FIFO 기반 가상 코드 자동 할당
 * - 환자 자동 생성 (전화번호 기반)
 * - 정품 인증 알림 메시지 기록
 * - 24시간 내 회수 가능
 */

import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import { getHoursDifference } from '@/lib/utils';
import { normalizePhoneNumber } from '@/lib/validations/common';
import type {
  ApiResponse,
  PaginatedResponse,
  TreatmentRecord,
  Organization,
  TreatmentItemSummary,
} from '@/types/api.types';
import type { TreatmentCreateData, TreatmentHistoryQueryData } from '@/lib/validations/treatment';
import {
  createErrorResponse,
  createSuccessResponse,
  parseRpcArray,
  parseRpcSingle,
} from './common.service';
import {
  TreatmentAtomicResultSchema,
  RecallTreatmentResultSchema,
  TreatmentSummaryRowSchema,
  HospitalPatientRowSchema,
} from '@/lib/validations/rpc-schemas';

const logger = createLogger('treatment.service');

// ============================================================================
// 타입 정의
// ============================================================================

/**
 * 시술 기록 + 요약 정보 타입
 */
export interface TreatmentRecordSummary extends TreatmentRecord {
  hospital: Pick<Organization, 'id' | 'name' | 'type'>;
  itemSummary: TreatmentItemSummary[];
  totalQuantity: number;
  isRecallable: boolean;
}

// ============================================================================
// 알림 메시지 생성
// ============================================================================

/**
 * 정품 인증 알림 메시지 생성
 * 환자가 여러 제품을 시술해도 하나의 이벤트에 메시지 하나가 전송됨
 */
function generateCertificationMessage(params: {
  treatmentDate: string;
  hospitalName: string;
  itemSummary: { productName: string; manufacturerName: string; quantity: number }[];
}): string {
  const { treatmentDate, hospitalName, itemSummary } = params;

  const productLines = itemSummary
    .map((item) => `- ${item.productName} ${item.quantity}개`)
    .join('\n');

  return `[네오인증서] 정품 인증 완료

안녕하세요.
${treatmentDate}에 ${hospitalName}에서 시술받으신
제품의 정품 인증이 완료되었습니다.

■ 시술 정보
${productLines}
- 시술일: ${treatmentDate}
- 시술 병원: ${hospitalName}

본 제품은 정품임이 확인되었습니다.

아래 버튼을 눌러 개별 인증코드를 확인하세요.`;
}

/**
 * 회수 알림 메시지 생성
 * 병원 연락처와 고객센터 문의 버튼 안내 포함
 */
function generateRecallMessage(params: {
  hospitalName: string;
  hospitalContact: string;
  reason: string;
  itemSummary: { productName: string; quantity: number }[];
}): string {
  const { hospitalName, hospitalContact, reason, itemSummary } = params;

  const productLines = itemSummary
    .map((item) => `- 회수 제품: ${item.productName} ${item.quantity}개`)
    .join('\n');

  return `[네오인증서] 정품 인증 회수 안내

안녕하세요.
${hospitalName}에서 발급한 정품 인증이
회수되었음을 안내드립니다.

■ 회수 정보
- 병원: ${hospitalName}
- 병원 연락처: ${hospitalContact}
- 회수 사유: ${reason}
${productLines}

문의사항은 병원으로 연락해주세요.
병원과 연락이 어려운 경우 아래 버튼을 통해 고객센터로 문의해주세요.`;
}

// ============================================================================
// 시술 생성
// ============================================================================

/**
 * 시술 생성 (원자적 DB 함수 사용)
 * FIFO 기반으로 가상 코드를 자동 할당하고 소유권을 환자에게 이전합니다.
 * 모든 작업이 단일 트랜잭션에서 실행되어 원자성을 보장합니다.
 * 환자 생성도 ON CONFLICT로 원자적으로 처리됩니다.
 * 병원 ID는 DB 함수 내에서 auth.uid()로부터 도출됩니다.
 *
 * @param data 시술 데이터
 * @returns 생성된 시술 기록
 */
export async function createTreatment(
  data: TreatmentCreateData
): Promise<ApiResponse<{ treatmentId: string; totalQuantity: number }>> {
  const supabase = await createClient();
  const normalizedPhone = normalizePhoneNumber(data.patientPhone);

  // 1. 아이템 데이터 준비 (JSONB 형식)
  const items = data.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
  }));

  // 2. 원자적 시술 생성 DB 함수 호출 (환자 생성 포함)
  // 병원 ID는 DB 함수 내에서 get_user_organization_id()로 도출됨
  const { data: result, error } = await supabase.rpc('create_treatment_atomic', {
    p_patient_phone: normalizedPhone,
    p_treatment_date: data.treatmentDate,
    p_items: items,
  });

  if (error) {
    logger.error('원자적 시술 생성 실패', error);
    return createErrorResponse('TREATMENT_CREATE_FAILED', '시술 생성에 실패했습니다.');
  }

  // Zod 검증으로 결과 파싱
  const parsed = parseRpcSingle(TreatmentAtomicResultSchema, result, 'create_treatment_atomic');
  if (!parsed.success) {
    logger.error('create_treatment_atomic 검증 실패', { error: parsed.error });
    return createErrorResponse('VALIDATION_ERROR', parsed.error);
  }

  const row = parsed.data;

  if (row?.error_code) {
    return createErrorResponse(row.error_code, row.error_message ?? '시술 생성에 실패했습니다.');
  }

  const treatmentId = row?.treatment_id ?? '';
  const totalQuantity = row?.total_quantity ?? 0;

  // 3. 정품 인증 알림 메시지 기록 (트랜잭션 외부, 실패해도 시술은 유지)
  try {
    // 시술 기록에서 병원 정보 조회 (알림 메시지용)
    const { data: treatmentRecord } = await supabase
      .from('treatment_records')
      .select('hospital:organizations!treatment_records_hospital_id_fkey(name)')
      .eq('id', treatmentId)
      .single();

    const hospitalName = (treatmentRecord?.hospital as { name: string } | null)?.name ?? '병원';

    // 제품 정보 조회 (알림 메시지용) - 벌크 쿼리로 N+1 최적화
    const itemSummaryForMessage: { productName: string; manufacturerName: string; quantity: number }[] = [];
    const productIds = data.items.map(item => item.productId);
    const { data: productsInfo } = await supabase
      .from('products')
      .select('id, name, organization:organizations!inner(name)')
      .in('id', productIds);

    if (productsInfo) {
      const productMap = new Map(productsInfo.map(p => [p.id, p]));
      for (const item of data.items) {
        const productInfo = productMap.get(item.productId);
        if (productInfo) {
          itemSummaryForMessage.push({
            productName: productInfo.name,
            manufacturerName: (productInfo.organization as { name: string }).name,
            quantity: item.quantity,
          });
        }
      }
    }

    const certificationMessage = generateCertificationMessage({
      treatmentDate: data.treatmentDate,
      hospitalName,
      itemSummary: itemSummaryForMessage,
    });

    await supabase.from('notification_messages').insert({
      type: 'CERTIFICATION',
      patient_phone: normalizedPhone,
      content: certificationMessage,
      treatment_id: treatmentId,
      metadata: {
        buttons: [
          { name: '인증코드 확인하기', url: `/verify/${treatmentId}` }
        ]
      },
      is_sent: false,
    });
  } catch (notificationError) {
    logger.error('알림 메시지 기록 실패', notificationError);
    // 알림 기록 실패는 치명적이지 않으므로 계속 진행
  }

  return createSuccessResponse({
    treatmentId,
    totalQuantity,
  });
}

// ============================================================================
// 시술 이력 조회
// ============================================================================

/**
 * 시술 이력 조회
 *
 * @param hospitalId 병원 ID
 * @param query 조회 옵션
 * @returns 페이지네이션된 시술 기록 목록
 */
export async function getTreatmentHistory(
  hospitalId: string,
  query: TreatmentHistoryQueryData
): Promise<ApiResponse<PaginatedResponse<TreatmentRecordSummary>>> {
  const supabase = await createClient();
  const { page = 1, pageSize = 20, startDate, endDate, patientPhone } = query;
  const offset = (page - 1) * pageSize;

  // 기본 쿼리
  let queryBuilder = supabase
    .from('treatment_records')
    .select(
      `
      *,
      hospital:organizations!treatment_records_hospital_id_fkey(id, name, type)
    `,
      { count: 'exact' }
    )
    .eq('hospital_id', hospitalId)
    .order('treatment_date', { ascending: false })
    .order('created_at', { ascending: false });

  // 필터 적용
  if (startDate) {
    queryBuilder = queryBuilder.gte('treatment_date', startDate);
  }
  if (endDate) {
    queryBuilder = queryBuilder.lte('treatment_date', endDate);
  }
  if (patientPhone) {
    const normalizedPhone = normalizePhoneNumber(patientPhone);
    queryBuilder = queryBuilder.eq('patient_phone', normalizedPhone);
  }

  const { data: treatments, count, error } = await queryBuilder.range(offset, offset + pageSize - 1);

  if (error) {
    logger.error('시술 이력 조회 실패', error);
    return createErrorResponse('QUERY_ERROR', error.message);
  }

  // 모든 시술의 요약 정보를 한 번에 조회 (N+1 최적화)
  const treatmentIds = (treatments ?? []).map((t) => t.id);
  const summariesMap = await getTreatmentSummariesBulk(treatmentIds);

  const treatmentSummaries: TreatmentRecordSummary[] = (treatments ?? []).map((treatment) => {
    const summary = summariesMap.get(treatment.id) ?? { itemSummary: [], totalQuantity: 0 };
    const hoursDiff = getHoursDifference(treatment.created_at);

    return {
      ...treatment,
      hospital: treatment.hospital as Pick<Organization, 'id' | 'name' | 'type'>,
      itemSummary: summary.itemSummary,
      totalQuantity: summary.totalQuantity,
      isRecallable: hoursDiff <= 24,
    };
  });

  const total = count ?? 0;

  return createSuccessResponse({
    items: treatmentSummaries,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasMore: offset + pageSize < total,
    },
  });
}

/**
 * 여러 시술의 아이템 요약을 한 번에 조회 (N+1 최적화)
 * DB 함수 get_treatment_summaries 사용
 */
async function getTreatmentSummariesBulk(
  treatmentIds: string[]
): Promise<Map<string, { itemSummary: TreatmentItemSummary[]; totalQuantity: number }>> {
  const result = new Map<string, { itemSummary: TreatmentItemSummary[]; totalQuantity: number }>();

  if (treatmentIds.length === 0) {
    return result;
  }

  const supabase = await createClient();

  // DB 함수 호출로 모든 시술의 요약을 한 번에 조회
  const { data, error } = await supabase.rpc('get_treatment_summaries', {
    p_treatment_ids: treatmentIds,
  });

  if (error || !data) {
    logger.error('시술 요약 bulk 조회 실패', error);
    // 에러 시 빈 결과 반환
    return result;
  }

  // Zod 검증으로 결과 파싱
  const parsed = parseRpcArray(TreatmentSummaryRowSchema, data, 'get_treatment_summaries');
  if (!parsed.success) {
    logger.error('get_treatment_summaries 검증 실패', { error: parsed.error });
    return result;
  }

  const rows = parsed.data;

  // 시술별로 그룹화
  const treatmentMap = new Map<string, Map<string, { name: string; quantity: number }>>();

  for (const row of rows) {
    if (!treatmentMap.has(row.treatment_id)) {
      treatmentMap.set(row.treatment_id, new Map());
    }
    const productMap = treatmentMap.get(row.treatment_id)!;

    // 같은 제품의 수량 합산
    const existing = productMap.get(row.product_id);
    if (existing) {
      existing.quantity += Number(row.quantity);
    } else {
      productMap.set(row.product_id, { name: row.product_name, quantity: Number(row.quantity) });
    }
  }

  // 결과 변환
  for (const treatmentId of treatmentIds) {
    const productMap = treatmentMap.get(treatmentId);
    if (productMap) {
      const itemSummary = Array.from(productMap.entries()).map(([productId, { name, quantity }]) => ({
        productId,
        productName: name,
        quantity,
      }));
      const totalQuantity = itemSummary.reduce((sum, item) => sum + item.quantity, 0);
      result.set(treatmentId, { itemSummary, totalQuantity });
    } else {
      result.set(treatmentId, { itemSummary: [], totalQuantity: 0 });
    }
  }

  return result;
}

// ============================================================================
// 시술 회수
// ============================================================================

/**
 * 시술 회수 (원자적 DB 함수 사용)
 * 병원만 24시간 이내 회수 가능
 * 모든 작업이 단일 트랜잭션에서 실행되어 원자성을 보장합니다.
 * 병원 검증은 DB 함수 내에서 auth.uid()로부터 수행됩니다.
 *
 * @param treatmentId 시술 기록 ID
 * @param reason 회수 사유
 * @returns 회수 결과
 */
export async function recallTreatment(
  treatmentId: string,
  reason: string
): Promise<ApiResponse<void>> {
  const supabase = await createClient();

  // 1. 시술 기록 조회 (알림 메시지용 - 회수 전에 조회해야 함)
  const { data: treatment, error: treatmentError } = await supabase
    .from('treatment_records')
    .select('patient_phone, hospital:organizations!treatment_records_hospital_id_fkey(name, representative_contact)')
    .eq('id', treatmentId)
    .single();

  if (treatmentError || !treatment) {
    return createErrorResponse('TREATMENT_NOT_FOUND', '시술 기록을 찾을 수 없습니다.');
  }

  // 2. 알림 메시지용 제품 요약 조회 (회수 전에 조회해야 함)
  const { data: details } = await supabase
    .from('treatment_details')
    .select('virtual_code_id')
    .eq('treatment_id', treatmentId);

  const codeIds = details?.map((d) => d.virtual_code_id) ?? [];
  const summary = codeIds.length > 0 ? await getTreatmentSummaryFromCodes(codeIds) : [];

  // 3. 원자적 회수 DB 함수 호출
  // 병원 검증은 DB 함수 내에서 get_user_organization_id()로 수행됨
  const { data: result, error } = await supabase.rpc('recall_treatment_atomic', {
    p_treatment_id: treatmentId,
    p_reason: reason,
  });

  if (error) {
    logger.error('원자적 시술 회수 실패', error);
    return createErrorResponse('RECALL_FAILED', '시술 회수에 실패했습니다.');
  }

  // Zod 검증으로 결과 파싱
  const parsed = parseRpcSingle(RecallTreatmentResultSchema, result, 'recall_treatment_atomic');
  if (!parsed.success) {
    logger.error('recall_treatment_atomic 검증 실패', { error: parsed.error });
    return createErrorResponse('VALIDATION_ERROR', parsed.error);
  }

  const row = parsed.data;

  if (!row?.success) {
    return createErrorResponse(
      row?.error_code ?? 'RECALL_FAILED',
      row?.error_message ?? '시술 회수에 실패했습니다.'
    );
  }

  // 4. 환자에게 회수 알림 메시지 기록 (트랜잭션 외부)
  try {
    const hospitalInfo = treatment.hospital as { name: string; representative_contact: string };
    const hospitalContact = hospitalInfo.representative_contact ?? '연락처 정보 없음';

    const recallMessage = generateRecallMessage({
      hospitalName: hospitalInfo.name,
      hospitalContact,
      reason,
      itemSummary: summary,
    });

    await supabase.from('notification_messages').insert({
      type: 'RECALL',
      patient_phone: treatment.patient_phone,
      content: recallMessage,
      treatment_id: treatmentId, // 회수된 시술 ID 저장 (인증 페이지에서 회수 여부 판단용)
      metadata: {
        hospitalContact,
        buttons: [
          { name: '고객센터 문의', url: '/inquiry' }
        ]
      },
      is_sent: false,
    });
  } catch (notificationError) {
    logger.error('회수 알림 기록 실패', notificationError);
    // 알림 기록 실패는 치명적이지 않으므로 계속 진행
  }

  return createSuccessResponse(undefined);
}

/**
 * 가상 코드 ID 배열에서 제품 요약 조회 (회수 알림용)
 */
async function getTreatmentSummaryFromCodes(
  codeIds: string[]
): Promise<{ productName: string; quantity: number }[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('virtual_codes')
    .select(
      `
      lot:lots!inner(
        product:products!inner(name)
      )
    `
    )
    .in('id', codeIds);

  if (!data || data.length === 0) {
    return [];
  }

  const productMap = new Map<string, number>();

  for (const code of data) {
    const productName = (code.lot as { product: { name: string } }).product.name;
    productMap.set(productName, (productMap.get(productName) ?? 0) + 1);
  }

  return Array.from(productMap.entries()).map(([productName, quantity]) => ({
    productName,
    quantity,
  }));
}

// ============================================================================
// 회수 가능 여부 확인
// ============================================================================

/**
 * 회수 가능 여부 확인
 *
 * @param hospitalId 현재 병원 ID
 * @param treatmentId 시술 기록 ID
 * @returns 회수 가능 여부
 */
export async function checkTreatmentRecallAllowed(
  hospitalId: string,
  treatmentId: string
): Promise<ApiResponse<{ allowed: boolean; reason?: string }>> {
  const supabase = await createClient();

  const { data: treatment, error: treatmentError } = await supabase
    .from('treatment_records')
    .select('hospital_id, created_at')
    .eq('id', treatmentId)
    .single();

  if (treatmentError || !treatment) {
    return createErrorResponse('TREATMENT_NOT_FOUND', '시술 기록을 찾을 수 없습니다.');
  }

  if (treatment.hospital_id !== hospitalId) {
    return createSuccessResponse({ allowed: false, reason: '해당 병원에서만 회수할 수 있습니다.' });
  }

  const hoursDiff = getHoursDifference(treatment.created_at);

  if (hoursDiff > 24) {
    return createSuccessResponse({ allowed: false, reason: '24시간 경과하여 처리할 수 없습니다.' });
  }

  return createSuccessResponse({ allowed: true });
}

// ============================================================================
// 병원 환자 검색
// ============================================================================

/**
 * 병원의 기존 환자 전화번호 검색
 * 시술 이력이 있는 환자만 반환합니다.
 *
 * @param hospitalId 병원 ID
 * @param searchTerm 검색어 (전화번호 일부)
 * @param limit 결과 제한 (기본 10개)
 * @returns 환자 전화번호 목록
 */
export async function getHospitalPatients(
  hospitalId: string,
  searchTerm?: string,
  limit: number = 10
): Promise<ApiResponse<string[]>> {
  const supabase = await createClient();

  // 검색어 정규화 (숫자만 추출)
  const normalizedSearch = searchTerm ? normalizePhoneNumber(searchTerm) : undefined;

  const { data, error } = await supabase.rpc('get_hospital_patients', {
    p_hospital_id: hospitalId,
    p_search_term: normalizedSearch,
    p_limit: limit,
  });

  if (error) {
    logger.error('병원 환자 검색 실패', error);
    return createErrorResponse('QUERY_ERROR', error.message);
  }

  // Zod 검증으로 결과 파싱
  const parsed = parseRpcArray(HospitalPatientRowSchema, data, 'get_hospital_patients');
  if (!parsed.success) {
    logger.error('get_hospital_patients 검증 실패', { error: parsed.error });
    return createErrorResponse('VALIDATION_ERROR', parsed.error);
  }

  // 결과에서 전화번호만 추출
  const phoneNumbers = parsed.data.map((row) => row.phone_number);

  return createSuccessResponse(phoneNumbers);
}
