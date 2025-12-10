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
import { normalizePhoneNumber } from '@/lib/validations/common';
import type {
  ApiResponse,
  PaginatedResponse,
  TreatmentRecord,
  Organization,
  TreatmentItemSummary,
} from '@/types/api.types';
import type { TreatmentCreateData, TreatmentHistoryQueryData } from '@/lib/validations/treatment';

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
 */
function generateCertificationMessage(params: {
  treatmentDate: string;
  hospitalName: string;
  itemSummary: { productName: string; manufacturerName: string; quantity: number }[];
}): string {
  const { treatmentDate, hospitalName, itemSummary } = params;
  const formattedDate = treatmentDate;

  const productLines = itemSummary
    .map((item) => `- 제품: ${item.productName} ${item.quantity}개`)
    .join('\n');

  // 제조사는 첫 번째 제품의 제조사로 표시 (단일 제조사 가정)
  const manufacturerName = itemSummary[0]?.manufacturerName || '';

  return `[네오인증서] 정품 인증 완료

안녕하세요.
${formattedDate}에 ${hospitalName}에서 시술받으신
제품의 정품 인증이 완료되었습니다.

■ 시술 정보
${productLines}
- 제조사: ${manufacturerName}
- 시술일: ${formattedDate}
- 시술 병원: ${hospitalName}

본 제품은 정품임이 확인되었습니다.`;
}

/**
 * 회수 알림 메시지 생성
 */
function generateRecallMessage(params: {
  hospitalName: string;
  reason: string;
  itemSummary: { productName: string; quantity: number }[];
}): string {
  const { hospitalName, reason, itemSummary } = params;

  const productLines = itemSummary
    .map((item) => `- 회수 제품: ${item.productName} ${item.quantity}개`)
    .join('\n');

  return `[네오인증서] 정품 인증 회수 안내

안녕하세요.
${hospitalName}에서 발급한 정품 인증이
회수되었음을 안내드립니다.

■ 회수 정보
- 병원: ${hospitalName}
- 회수 사유: ${reason}
${productLines}

문의사항은 해당 병원으로 연락해주세요.`;
}

// ============================================================================
// 시술 생성
// ============================================================================

/**
 * 시술 생성
 * FIFO 기반으로 가상 코드를 자동 할당하고 소유권을 환자에게 이전합니다.
 *
 * @param hospitalId 병원 조직 ID
 * @param data 시술 데이터
 * @returns 생성된 시술 기록
 */
export async function createTreatment(
  hospitalId: string,
  data: TreatmentCreateData
): Promise<ApiResponse<{ treatmentId: string; totalQuantity: number }>> {
  const supabase = await createClient();
  const normalizedPhone = normalizePhoneNumber(data.patientPhone);

  // 1. 병원 정보 조회
  const { data: hospital, error: hospitalError } = await supabase
    .from('organizations')
    .select('id, name, type')
    .eq('id', hospitalId)
    .eq('type', 'HOSPITAL')
    .single();

  if (hospitalError || !hospital) {
    return {
      success: false,
      error: {
        code: 'HOSPITAL_NOT_FOUND',
        message: '병원 정보를 찾을 수 없습니다.',
      },
    };
  }

  // 2. 환자 존재 확인 → 없으면 생성
  const { data: existingPatient } = await supabase
    .from('patients')
    .select('phone_number')
    .eq('phone_number', normalizedPhone)
    .single();

  if (!existingPatient) {
    const { error: patientError } = await supabase.from('patients').insert({
      phone_number: normalizedPhone,
    });

    if (patientError) {
      console.error('환자 생성 실패:', patientError);
      return {
        success: false,
        error: {
          code: 'PATIENT_CREATE_FAILED',
          message: '환자 정보 생성에 실패했습니다.',
        },
      };
    }
  }

  // 3. 시술 기록 생성
  const { data: treatmentRecord, error: treatmentError } = await supabase
    .from('treatment_records')
    .insert({
      hospital_id: hospitalId,
      patient_phone: normalizedPhone,
      treatment_date: data.treatmentDate,
    })
    .select()
    .single();

  if (treatmentError || !treatmentRecord) {
    console.error('시술 기록 생성 실패:', treatmentError);
    return {
      success: false,
      error: {
        code: 'TREATMENT_CREATE_FAILED',
        message: '시술 기록 생성에 실패했습니다.',
      },
    };
  }

  // 4. 각 아이템별로 FIFO 선택 및 소유권 이전
  let totalQuantity = 0;
  const allSelectedCodes: string[] = [];
  const itemSummaryForMessage: { productName: string; manufacturerName: string; quantity: number }[] = [];

  for (const item of data.items) {
    // FIFO 선택 (DB 함수 호출)
    const { data: selectedCodes, error: selectError } = await supabase.rpc('select_fifo_codes', {
      p_product_id: item.productId,
      p_owner_id: hospitalId,
      p_quantity: item.quantity,
    });

    if (selectError) {
      console.error('FIFO 선택 실패:', selectError);
      // 롤백: 시술 기록 삭제
      await supabase.from('treatment_records').delete().eq('id', treatmentRecord.id);
      return {
        success: false,
        error: {
          code: 'FIFO_SELECT_FAILED',
          message: 'FIFO 코드 선택에 실패했습니다.',
        },
      };
    }

    if (!selectedCodes || selectedCodes.length < item.quantity) {
      // 롤백
      await supabase.from('treatment_records').delete().eq('id', treatmentRecord.id);
      return {
        success: false,
        error: {
          code: 'INSUFFICIENT_STOCK',
          message: `재고가 부족합니다. 요청: ${item.quantity}개, 가능: ${selectedCodes?.length || 0}개`,
        },
      };
    }

    const codeIds = selectedCodes.map((c) => c.virtual_code_id);
    allSelectedCodes.push(...codeIds);
    totalQuantity += codeIds.length;

    // 시술 상세 기록
    const detailInserts = codeIds.map((virtualCodeId) => ({
      treatment_id: treatmentRecord.id,
      virtual_code_id: virtualCodeId,
    }));

    const { error: detailError } = await supabase.from('treatment_details').insert(detailInserts);

    if (detailError) {
      console.error('시술 상세 기록 실패:', detailError);
      // 롤백
      await supabase.from('treatment_details').delete().eq('treatment_id', treatmentRecord.id);
      await supabase.from('treatment_records').delete().eq('id', treatmentRecord.id);
      return {
        success: false,
        error: {
          code: 'DETAIL_CREATE_FAILED',
          message: '시술 상세 기록에 실패했습니다.',
        },
      };
    }

    // 소유권 이전 (가상 코드 업데이트) - 상태를 USED로, 소유자를 환자로
    const { error: updateError } = await supabase
      .from('virtual_codes')
      .update({
        owner_id: normalizedPhone,
        owner_type: 'PATIENT',
        status: 'USED',
      })
      .in('id', codeIds);

    if (updateError) {
      console.error('소유권 이전 실패:', updateError);
      // 롤백
      await supabase.from('treatment_details').delete().eq('treatment_id', treatmentRecord.id);
      await supabase.from('treatment_records').delete().eq('id', treatmentRecord.id);
      return {
        success: false,
        error: {
          code: 'OWNERSHIP_TRANSFER_FAILED',
          message: '소유권 이전에 실패했습니다.',
        },
      };
    }

    // 이력 기록
    const historyInserts = codeIds.map((virtualCodeId) => ({
      virtual_code_id: virtualCodeId,
      action_type: 'TREATED' as const,
      from_owner_type: 'ORGANIZATION' as const,
      from_owner_id: hospitalId,
      to_owner_type: 'PATIENT' as const,
      to_owner_id: normalizedPhone,
      is_recall: false,
    }));

    const { error: historyError } = await supabase.from('histories').insert(historyInserts);

    if (historyError) {
      console.error('이력 기록 실패:', historyError);
      // 이력 기록 실패는 치명적이지 않으므로 계속 진행
    }

    // 제품 정보 조회 (알림 메시지용)
    const { data: productInfo } = await supabase
      .from('products')
      .select('name, organization:organizations!inner(name)')
      .eq('id', item.productId)
      .single();

    if (productInfo) {
      itemSummaryForMessage.push({
        productName: productInfo.name,
        manufacturerName: (productInfo.organization as { name: string }).name,
        quantity: item.quantity,
      });
    }
  }

  // 5. 정품 인증 알림 메시지 기록
  const certificationMessage = generateCertificationMessage({
    treatmentDate: data.treatmentDate,
    hospitalName: hospital.name,
    itemSummary: itemSummaryForMessage,
  });

  const { error: notificationError } = await supabase.from('notification_messages').insert({
    type: 'CERTIFICATION',
    patient_phone: normalizedPhone,
    content: certificationMessage,
    is_sent: false,
  });

  if (notificationError) {
    console.error('알림 메시지 기록 실패:', notificationError);
    // 알림 기록 실패는 치명적이지 않으므로 계속 진행
  }

  return {
    success: true,
    data: {
      treatmentId: treatmentRecord.id,
      totalQuantity,
    },
  };
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
    console.error('시술 이력 조회 실패:', error);
    return {
      success: false,
      error: {
        code: 'QUERY_ERROR',
        message: error.message,
      },
    };
  }

  // 각 시술별 아이템 요약 조회
  const treatmentSummaries: TreatmentRecordSummary[] = [];
  const now = new Date();

  for (const treatment of treatments || []) {
    const summary = await getTreatmentSummary(treatment.id);
    const treatmentCreatedAt = new Date(treatment.created_at);
    const hoursDiff = (now.getTime() - treatmentCreatedAt.getTime()) / (1000 * 60 * 60);

    treatmentSummaries.push({
      ...treatment,
      hospital: treatment.hospital as Pick<Organization, 'id' | 'name' | 'type'>,
      itemSummary: summary.itemSummary,
      totalQuantity: summary.totalQuantity,
      isRecallable: hoursDiff <= 24,
    });
  }

  const total = count || 0;

  return {
    success: true,
    data: {
      items: treatmentSummaries,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: offset + pageSize < total,
      },
    },
  };
}

/**
 * 시술 아이템 요약 조회 (내부용)
 */
async function getTreatmentSummary(
  treatmentId: string
): Promise<{ itemSummary: TreatmentItemSummary[]; totalQuantity: number }> {
  const supabase = await createClient();

  const { data: details } = await supabase
    .from('treatment_details')
    .select(
      `
      virtual_code:virtual_codes!inner(
        lot:lots!inner(
          product:products!inner(
            id,
            name
          )
        )
      )
    `
    )
    .eq('treatment_id', treatmentId);

  if (!details || details.length === 0) {
    return { itemSummary: [], totalQuantity: 0 };
  }

  // 제품별 그룹화
  const productMap = new Map<string, { name: string; quantity: number }>();

  for (const detail of details) {
    const product = (detail.virtual_code as { lot: { product: { id: string; name: string } } }).lot.product;
    const existing = productMap.get(product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      productMap.set(product.id, { name: product.name, quantity: 1 });
    }
  }

  const itemSummary = Array.from(productMap.entries()).map(([productId, { name, quantity }]) => ({
    productId,
    productName: name,
    quantity,
  }));

  return {
    itemSummary,
    totalQuantity: details.length,
  };
}

// ============================================================================
// 시술 회수
// ============================================================================

/**
 * 시술 회수
 * 병원만 24시간 이내 회수 가능
 *
 * @param hospitalId 현재 병원 ID
 * @param treatmentId 시술 기록 ID
 * @param reason 회수 사유
 * @returns 회수 결과
 */
export async function recallTreatment(
  hospitalId: string,
  treatmentId: string,
  reason: string
): Promise<ApiResponse<void>> {
  const supabase = await createClient();

  // 1. 시술 기록 조회 및 권한 확인
  const { data: treatment, error: treatmentError } = await supabase
    .from('treatment_records')
    .select('*, hospital:organizations!treatment_records_hospital_id_fkey(id, name)')
    .eq('id', treatmentId)
    .single();

  if (treatmentError || !treatment) {
    return {
      success: false,
      error: {
        code: 'TREATMENT_NOT_FOUND',
        message: '시술 기록을 찾을 수 없습니다.',
      },
    };
  }

  // 병원 권한 확인
  if (treatment.hospital_id !== hospitalId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '해당 병원에서만 회수할 수 있습니다.',
      },
    };
  }

  // 2. 24시간 제한 확인
  const createdAt = new Date(treatment.created_at);
  const now = new Date();
  const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

  if (hoursDiff > 24) {
    return {
      success: false,
      error: {
        code: 'RECALL_TIME_EXCEEDED',
        message: '24시간 경과하여 처리할 수 없습니다. 관리자에게 연락해주세요.',
      },
    };
  }

  // 3. 시술 상세에서 가상 코드 ID 조회
  const { data: details, error: detailError } = await supabase
    .from('treatment_details')
    .select('virtual_code_id')
    .eq('treatment_id', treatmentId);

  if (detailError || !details || details.length === 0) {
    return {
      success: false,
      error: {
        code: 'NO_DETAILS',
        message: '회수할 제품이 없습니다.',
      },
    };
  }

  const codeIds = details.map((d) => d.virtual_code_id);

  // 4. 소유권 복귀 (병원에게) 및 상태 변경 (USED → IN_STOCK)
  const { error: updateError } = await supabase
    .from('virtual_codes')
    .update({
      owner_id: hospitalId,
      owner_type: 'ORGANIZATION',
      status: 'IN_STOCK',
    })
    .in('id', codeIds);

  if (updateError) {
    console.error('소유권 복귀 실패:', updateError);
    return {
      success: false,
      error: {
        code: 'OWNERSHIP_REVERT_FAILED',
        message: '소유권 복귀에 실패했습니다.',
      },
    };
  }

  // 5. 시술 상세 삭제
  const { error: deleteDetailError } = await supabase
    .from('treatment_details')
    .delete()
    .eq('treatment_id', treatmentId);

  if (deleteDetailError) {
    console.error('시술 상세 삭제 실패:', deleteDetailError);
    // 롤백: 소유권 다시 환자에게
    await supabase
      .from('virtual_codes')
      .update({
        owner_id: treatment.patient_phone,
        owner_type: 'PATIENT',
        status: 'USED',
      })
      .in('id', codeIds);

    return {
      success: false,
      error: {
        code: 'DETAIL_DELETE_FAILED',
        message: '시술 상세 삭제에 실패했습니다.',
      },
    };
  }

  // 6. 시술 기록 삭제
  const { error: deleteTreatmentError } = await supabase
    .from('treatment_records')
    .delete()
    .eq('id', treatmentId);

  if (deleteTreatmentError) {
    console.error('시술 기록 삭제 실패:', deleteTreatmentError);
    // 이미 시술 상세가 삭제되었으므로 복구가 어려움
  }

  // 7. 회수 이력 기록
  const historyInserts = codeIds.map((virtualCodeId) => ({
    virtual_code_id: virtualCodeId,
    action_type: 'RECALLED' as const,
    from_owner_type: 'PATIENT' as const,
    from_owner_id: treatment.patient_phone,
    to_owner_type: 'ORGANIZATION' as const,
    to_owner_id: hospitalId,
    is_recall: true,
    recall_reason: reason,
  }));

  const { error: historyError } = await supabase.from('histories').insert(historyInserts);

  if (historyError) {
    console.error('회수 이력 기록 실패:', historyError);
    // 이력 기록 실패는 치명적이지 않으므로 계속 진행
  }

  // 8. 환자에게 회수 알림 메시지 기록
  const summary = await getTreatmentSummaryFromCodes(codeIds);
  const hospitalInfo = treatment.hospital as { name: string };

  const recallMessage = generateRecallMessage({
    hospitalName: hospitalInfo.name,
    reason,
    itemSummary: summary,
  });

  const { error: notificationError } = await supabase.from('notification_messages').insert({
    type: 'RECALL',
    patient_phone: treatment.patient_phone,
    content: recallMessage,
    is_sent: false,
  });

  if (notificationError) {
    console.error('회수 알림 기록 실패:', notificationError);
    // 알림 기록 실패는 치명적이지 않으므로 계속 진행
  }

  return { success: true };
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
    productMap.set(productName, (productMap.get(productName) || 0) + 1);
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
    return {
      success: false,
      error: {
        code: 'TREATMENT_NOT_FOUND',
        message: '시술 기록을 찾을 수 없습니다.',
      },
    };
  }

  if (treatment.hospital_id !== hospitalId) {
    return {
      success: true,
      data: { allowed: false, reason: '해당 병원에서만 회수할 수 있습니다.' },
    };
  }

  const createdAt = new Date(treatment.created_at);
  const now = new Date();
  const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

  if (hoursDiff > 24) {
    return {
      success: true,
      data: { allowed: false, reason: '24시간 경과하여 처리할 수 없습니다.' },
    };
  }

  return { success: true, data: { allowed: true } };
}
