/**
 * 출고 서비스
 * 출고 생성, 조회, 회수 관련 비즈니스 로직
 *
 * 핵심 기능:
 * - FIFO 기반 가상 코드 자동 할당
 * - 제조사 전용 Lot 선택 옵션
 * - 즉시 소유권 이전
 * - 24시간 내 회수 가능
 */

import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type {
  ApiResponse,
  PaginatedResponse,
  ShipmentBatch,
  Organization,
  OrganizationType,
} from '@/types/api.types';
import type { ShipmentCreateData, ShipmentHistoryQueryData } from '@/lib/validations/shipment';
import {
  createErrorResponse,
  createSuccessResponse,
  parseRpcArray,
  parseRpcSingle,
} from './common.service';
import {
  ShipmentAtomicResultSchema,
  RecallShipmentResultSchema,
  ShipmentBatchSummaryRowSchema,
} from '@/lib/validations/rpc-schemas';

// 캐시 TTL 상수 (초)
const TARGET_ORGS_CACHE_TTL = 600; // 10분 (조직 목록은 자주 변경되지 않음)

/**
 * 출고 뭉치 + 요약 정보 타입
 */
export interface ShipmentBatchSummary extends ShipmentBatch {
  fromOrganization: Pick<Organization, 'id' | 'name' | 'type'>;
  toOrganization: Pick<Organization, 'id' | 'name' | 'type'>;
  itemSummary: {
    productId: string;
    productName: string;
    quantity: number;
  }[];
  totalQuantity: number;
}

/**
 * 출고 대상 조직 목록 조회
 *
 * @param organizationType 현재 조직 유형
 * @param excludeOrganizationId 제외할 조직 ID (자기 자신)
 * @returns 출고 가능한 조직 목록
 */
export async function getShipmentTargetOrganizations(
  organizationType: OrganizationType,
  excludeOrganizationId?: string
): Promise<ApiResponse<Pick<Organization, 'id' | 'name' | 'type'>[]>> {
  const supabase = await createClient();

  // 출고 가능 대상 유형 결정
  // 제조사: 유통사, 병원
  // 유통사: 유통사, 병원
  // 병원: 없음 (시술만 가능)
  let targetTypes: OrganizationType[] = [];

  if (organizationType === 'MANUFACTURER') {
    targetTypes = ['DISTRIBUTOR', 'HOSPITAL'];
  } else if (organizationType === 'DISTRIBUTOR') {
    targetTypes = ['DISTRIBUTOR', 'HOSPITAL'];
  } else {
    return createSuccessResponse([]);
  }

  let query = supabase
    .from('organizations')
    .select('id, name, type')
    .in('type', targetTypes)
    .eq('status', 'ACTIVE');

  // 자기 자신 제외
  if (excludeOrganizationId) {
    query = query.neq('id', excludeOrganizationId);
  }

  const { data, error } = await query.order('name');

  if (error) {
    console.error('출고 대상 조직 조회 실패:', error);
    return createErrorResponse('QUERY_ERROR', '출고 대상 조직 조회에 실패했습니다.');
  }

  return createSuccessResponse(data || []);
}

/**
 * 출고 대상 조직 목록 조회 (Admin 클라이언트 사용)
 * unstable_cache 내에서 호출되므로 cookies()를 사용하지 않는 Admin 클라이언트 필요
 */
async function getShipmentTargetOrganizationsWithAdmin(
  organizationType: OrganizationType,
  excludeOrganizationId?: string
): Promise<ApiResponse<Pick<Organization, 'id' | 'name' | 'type'>[]>> {
  const supabase = createAdminClient();

  // 출고 가능 대상 유형 결정
  let targetTypes: OrganizationType[] = [];

  if (organizationType === 'MANUFACTURER') {
    targetTypes = ['DISTRIBUTOR', 'HOSPITAL'];
  } else if (organizationType === 'DISTRIBUTOR') {
    targetTypes = ['DISTRIBUTOR', 'HOSPITAL'];
  } else {
    return createSuccessResponse([]);
  }

  let query = supabase
    .from('organizations')
    .select('id, name, type')
    .in('type', targetTypes)
    .eq('status', 'ACTIVE');

  if (excludeOrganizationId) {
    query = query.neq('id', excludeOrganizationId);
  }

  const { data, error } = await query.order('name');

  if (error) {
    console.error('출고 대상 조직 조회 실패:', error);
    return createErrorResponse('QUERY_ERROR', '출고 대상 조직 조회에 실패했습니다.');
  }

  return createSuccessResponse(data || []);
}

/**
 * 캐싱된 출고 대상 조직 목록 조회
 * unstable_cache를 사용하여 10분간 캐싱
 * 조직 승인/비활성화 시 revalidateTag('organizations')로 무효화
 *
 * 주의: unstable_cache 내에서 cookies()를 사용할 수 없으므로
 * Admin 클라이언트를 사용하는 내부 함수 호출
 *
 * @param organizationType 현재 조직 유형
 * @param excludeOrganizationId 제외할 조직 ID (자기 자신)
 * @returns 출고 가능한 조직 목록
 */
export const getCachedShipmentTargetOrganizations = (
  organizationType: OrganizationType,
  excludeOrganizationId?: string
) =>
  unstable_cache(
    async () => {
      return getShipmentTargetOrganizationsWithAdmin(organizationType, excludeOrganizationId);
    },
    [`target-orgs-${organizationType}-${excludeOrganizationId ?? 'all'}`],
    {
      tags: ['organizations', `target-orgs-${organizationType}`],
      revalidate: TARGET_ORGS_CACHE_TTL,
    }
  )();

/**
 * 출고 대상 조직 검색 (Lazy Load용)
 * 검색어 기반으로 출고 가능한 조직을 검색합니다.
 * 페이지 로드 시 전체 조직 조회 대신, 사용자가 검색할 때만 조회합니다.
 *
 * @param query 검색어 (조직명)
 * @param organizationType 현재 조직 유형
 * @param excludeOrganizationId 제외할 조직 ID (자기 자신)
 * @param limit 최대 결과 수 (기본 20)
 * @returns 검색된 조직 목록
 */
export async function searchShipmentTargetOrganizations(
  query: string,
  organizationType: OrganizationType,
  excludeOrganizationId?: string,
  limit: number = 20
): Promise<ApiResponse<Pick<Organization, 'id' | 'name' | 'type'>[]>> {
  const supabase = await createClient();

  // 출고 가능 대상 유형 결정
  let targetTypes: OrganizationType[] = [];

  if (organizationType === 'MANUFACTURER' || organizationType === 'DISTRIBUTOR') {
    targetTypes = ['DISTRIBUTOR', 'HOSPITAL'];
  } else {
    return createSuccessResponse([]);
  }

  let queryBuilder = supabase
    .from('organizations')
    .select('id, name, type')
    .in('type', targetTypes)
    .eq('status', 'ACTIVE')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(limit);

  if (excludeOrganizationId) {
    queryBuilder = queryBuilder.neq('id', excludeOrganizationId);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error('출고 대상 조직 검색 실패:', error);
    return createErrorResponse('QUERY_ERROR', '출고 대상 조직 검색에 실패했습니다.');
  }

  return createSuccessResponse(data || []);
}

/**
 * 출고 생성 (원자적 DB 함수 사용)
 * FIFO 기반으로 가상 코드를 자동 할당하고 소유권을 즉시 이전합니다.
 * 모든 작업이 단일 트랜잭션에서 실행되어 원자성을 보장합니다.
 * 발송 조직 ID는 DB 함수 내에서 auth.uid()로부터 도출됩니다.
 *
 * @param data 출고 데이터
 * @returns 생성된 출고 뭉치
 */
export async function createShipment(
  data: ShipmentCreateData
): Promise<ApiResponse<{ shipmentBatchId: string; totalQuantity: number }>> {
  const supabase = await createClient();

  // 1. 수신 조직 유형 조회 (원자적 함수 호출을 위해 필요)
  const { data: toOrg, error: toOrgError } = await supabase
    .from('organizations')
    .select('type')
    .eq('id', data.toOrganizationId)
    .single();

  if (toOrgError || !toOrg) {
    return createErrorResponse('ORGANIZATION_NOT_FOUND', '수신 조직을 찾을 수 없습니다.');
  }

  // 2. 아이템 데이터 준비 (JSONB 형식)
  const items = data.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    lotId: item.lotId ?? null,
  }));

  // 3. 원자적 출고 생성 DB 함수 호출
  // 발송 조직 ID는 DB 함수 내에서 get_user_organization_id()로 도출됨
  const { data: result, error } = await supabase.rpc('create_shipment_atomic', {
    p_to_org_id: data.toOrganizationId,
    p_to_org_type: toOrg.type,
    p_items: items,
  });

  if (error) {
    console.error('원자적 출고 생성 실패:', error);
    return createErrorResponse('SHIPMENT_CREATE_FAILED', '출고 생성에 실패했습니다.');
  }

  // Zod 검증으로 결과 파싱
  const parsed = parseRpcSingle(ShipmentAtomicResultSchema, result, 'create_shipment_atomic');
  if (!parsed.success) {
    console.error('create_shipment_atomic 검증 실패:', parsed.error);
    return createErrorResponse('VALIDATION_ERROR', parsed.error);
  }

  const row = parsed.data;

  if (row?.error_code) {
    return createErrorResponse(row.error_code, row.error_message || '출고 생성에 실패했습니다.');
  }

  return createSuccessResponse({
    shipmentBatchId: row?.shipment_batch_id || '',
    totalQuantity: row?.total_quantity || 0,
  });
}

/**
 * 출고 이력 조회 (뭉치 단위)
 *
 * @param organizationId 조직 ID
 * @param query 조회 옵션
 * @returns 페이지네이션된 출고 뭉치 목록
 */
export async function getShipmentHistory(
  organizationId: string,
  query: ShipmentHistoryQueryData
): Promise<ApiResponse<PaginatedResponse<ShipmentBatchSummary>>> {
  const supabase = await createClient();
  const { page = 1, pageSize = 20, startDate, endDate, toOrganizationId, isRecalled } = query;
  const offset = (page - 1) * pageSize;

  // 기본 쿼리: 발송한 출고 뭉치
  let queryBuilder = supabase
    .from('shipment_batches')
    .select(
      `
      *,
      fromOrganization:organizations!shipment_batches_from_organization_id_fkey(id, name, type),
      toOrganization:organizations!shipment_batches_to_organization_id_fkey(id, name, type)
    `,
      { count: 'exact' }
    )
    .eq('from_organization_id', organizationId)
    .order('shipment_date', { ascending: false });

  // 필터 적용
  if (startDate) {
    queryBuilder = queryBuilder.gte('shipment_date', `${startDate}T00:00:00`);
  }
  if (endDate) {
    queryBuilder = queryBuilder.lte('shipment_date', `${endDate}T23:59:59`);
  }
  if (toOrganizationId) {
    queryBuilder = queryBuilder.eq('to_organization_id', toOrganizationId);
  }
  if (typeof isRecalled === 'boolean') {
    queryBuilder = queryBuilder.eq('is_recalled', isRecalled);
  }

  const { data: batches, count, error } = await queryBuilder.range(offset, offset + pageSize - 1);

  if (error) {
    console.error('출고 이력 조회 실패:', error);
    return createErrorResponse('QUERY_ERROR', error.message);
  }

  // 모든 뭉치의 요약 정보를 한 번에 조회 (N+1 최적화)
  const batchIds = (batches || []).map((b) => b.id);
  const summariesMap = await getShipmentBatchSummariesBulk(batchIds);

  const batchSummaries: ShipmentBatchSummary[] = (batches || []).map((batch) => {
    const summary = summariesMap.get(batch.id) || { itemSummary: [], totalQuantity: 0 };
    return {
      ...batch,
      fromOrganization: batch.fromOrganization as Pick<Organization, 'id' | 'name' | 'type'>,
      toOrganization: batch.toOrganization as Pick<Organization, 'id' | 'name' | 'type'>,
      itemSummary: summary.itemSummary,
      totalQuantity: summary.totalQuantity,
    };
  });

  const total = count || 0;

  return createSuccessResponse({
    items: batchSummaries,
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
 * 수신 출고 이력 조회 (입고 이력)
 *
 * @param organizationId 조직 ID
 * @param query 조회 옵션
 * @returns 페이지네이션된 수신 출고 뭉치 목록
 */
export async function getReceivedShipmentHistory(
  organizationId: string,
  query: ShipmentHistoryQueryData
): Promise<ApiResponse<PaginatedResponse<ShipmentBatchSummary>>> {
  const supabase = await createClient();
  const { page = 1, pageSize = 20, startDate, endDate, isRecalled } = query;
  const offset = (page - 1) * pageSize;

  // 수신한 출고 뭉치
  let queryBuilder = supabase
    .from('shipment_batches')
    .select(
      `
      *,
      fromOrganization:organizations!shipment_batches_from_organization_id_fkey(id, name, type),
      toOrganization:organizations!shipment_batches_to_organization_id_fkey(id, name, type)
    `,
      { count: 'exact' }
    )
    .eq('to_organization_id', organizationId)
    .order('shipment_date', { ascending: false });

  if (startDate) {
    queryBuilder = queryBuilder.gte('shipment_date', `${startDate}T00:00:00`);
  }
  if (endDate) {
    queryBuilder = queryBuilder.lte('shipment_date', `${endDate}T23:59:59`);
  }
  if (typeof isRecalled === 'boolean') {
    queryBuilder = queryBuilder.eq('is_recalled', isRecalled);
  }

  const { data: batches, count, error } = await queryBuilder.range(offset, offset + pageSize - 1);

  if (error) {
    console.error('수신 출고 이력 조회 실패:', error);
    return createErrorResponse('QUERY_ERROR', error.message);
  }

  // 모든 뭉치의 요약 정보를 한 번에 조회 (N+1 최적화)
  const receivedBatchIds = (batches || []).map((b) => b.id);
  const receivedSummariesMap = await getShipmentBatchSummariesBulk(receivedBatchIds);

  const batchSummaries: ShipmentBatchSummary[] = (batches || []).map((batch) => {
    const summary = receivedSummariesMap.get(batch.id) || { itemSummary: [], totalQuantity: 0 };
    return {
      ...batch,
      fromOrganization: batch.fromOrganization as Pick<Organization, 'id' | 'name' | 'type'>,
      toOrganization: batch.toOrganization as Pick<Organization, 'id' | 'name' | 'type'>,
      itemSummary: summary.itemSummary,
      totalQuantity: summary.totalQuantity,
    };
  });

  const total = count || 0;

  return createSuccessResponse({
    items: batchSummaries,
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
 * 여러 출고 뭉치의 아이템 요약을 한 번에 조회 (N+1 최적화)
 * DB 함수 get_shipment_batch_summaries 사용
 */
async function getShipmentBatchSummariesBulk(
  batchIds: string[]
): Promise<Map<string, { itemSummary: { productId: string; productName: string; quantity: number }[]; totalQuantity: number }>> {
  const result = new Map<string, { itemSummary: { productId: string; productName: string; quantity: number }[]; totalQuantity: number }>();

  if (batchIds.length === 0) {
    return result;
  }

  const supabase = await createClient();

  // DB 함수 호출로 모든 뭉치의 요약을 한 번에 조회
  const { data, error } = await supabase.rpc('get_shipment_batch_summaries', {
    p_batch_ids: batchIds,
  });

  if (error || !data) {
    console.error('출고 뭉치 요약 bulk 조회 실패:', error);
    // 에러 시 빈 결과 반환 (각 뭉치는 빈 요약을 갖게 됨)
    return result;
  }

  // Zod 검증으로 결과 파싱
  const parsed = parseRpcArray(ShipmentBatchSummaryRowSchema, data, 'get_shipment_batch_summaries');
  if (!parsed.success) {
    console.error('get_shipment_batch_summaries 검증 실패:', parsed.error);
    return result;
  }

  const rows = parsed.data;

  // 뭉치별로 그룹화
  const batchMap = new Map<string, Map<string, { name: string; quantity: number }>>();

  for (const row of rows) {
    if (!batchMap.has(row.batch_id)) {
      batchMap.set(row.batch_id, new Map());
    }
    const productMap = batchMap.get(row.batch_id)!;

    // 같은 제품의 수량 합산
    const existing = productMap.get(row.product_id);
    if (existing) {
      existing.quantity += Number(row.quantity);
    } else {
      productMap.set(row.product_id, { name: row.product_name, quantity: Number(row.quantity) });
    }
  }

  // 결과 변환
  for (const batchId of batchIds) {
    const productMap = batchMap.get(batchId);
    if (productMap) {
      const itemSummary = Array.from(productMap.entries()).map(([productId, { name, quantity }]) => ({
        productId,
        productName: name,
        quantity,
      }));
      const totalQuantity = itemSummary.reduce((sum, item) => sum + item.quantity, 0);
      result.set(batchId, { itemSummary, totalQuantity });
    } else {
      result.set(batchId, { itemSummary: [], totalQuantity: 0 });
    }
  }

  return result;
}

/**
 * 출고 회수 (원자적 DB 함수 사용)
 * 발송자만 24시간 이내 회수 가능
 * 모든 작업이 단일 트랜잭션에서 실행되어 원자성을 보장합니다.
 * 발송자 검증은 DB 함수 내에서 auth.uid()로부터 수행됩니다.
 *
 * @param shipmentBatchId 출고 뭉치 ID
 * @param reason 회수 사유
 * @returns 회수 결과
 */
export async function recallShipment(
  shipmentBatchId: string,
  reason: string
): Promise<ApiResponse<void>> {
  const supabase = await createClient();

  // 원자적 회수 DB 함수 호출
  // 발송자 검증은 DB 함수 내에서 get_user_organization_id()로 수행됨
  const { data: result, error } = await supabase.rpc('recall_shipment_atomic', {
    p_shipment_batch_id: shipmentBatchId,
    p_reason: reason,
  });

  if (error) {
    console.error('원자적 출고 회수 실패:', error);
    return createErrorResponse('RECALL_FAILED', '출고 회수에 실패했습니다.');
  }

  // Zod 검증으로 결과 파싱
  const parsed = parseRpcSingle(RecallShipmentResultSchema, result, 'recall_shipment_atomic');
  if (!parsed.success) {
    console.error('recall_shipment_atomic 검증 실패:', parsed.error);
    return createErrorResponse('VALIDATION_ERROR', parsed.error);
  }

  const row = parsed.data;

  if (!row?.success) {
    return createErrorResponse(
      row?.error_code || 'RECALL_FAILED',
      row?.error_message || '출고 회수에 실패했습니다.'
    );
  }

  return createSuccessResponse(undefined);
}

/**
 * 회수 가능 여부 확인
 *
 * @param organizationId 현재 조직 ID
 * @param shipmentBatchId 출고 뭉치 ID
 * @returns 회수 가능 여부
 */
export async function checkRecallAllowed(
  organizationId: string,
  shipmentBatchId: string
): Promise<ApiResponse<{ allowed: boolean; reason?: string }>> {
  const supabase = await createClient();

  const { data: batch, error: batchError } = await supabase
    .from('shipment_batches')
    .select('from_organization_id, is_recalled')
    .eq('id', shipmentBatchId)
    .single();

  if (batchError || !batch) {
    return createErrorResponse('BATCH_NOT_FOUND', '출고 뭉치를 찾을 수 없습니다.');
  }

  if (batch.from_organization_id !== organizationId) {
    return createSuccessResponse({ allowed: false, reason: '발송자만 회수할 수 있습니다.' });
  }

  if (batch.is_recalled) {
    return createSuccessResponse({ allowed: false, reason: '이미 회수된 출고 뭉치입니다.' });
  }

  const { data: isAllowed, error: checkError } = await supabase.rpc('is_recall_allowed', {
    p_shipment_batch_id: shipmentBatchId,
  });

  if (checkError) {
    return createErrorResponse('CHECK_ERROR', '회수 가능 여부 확인에 실패했습니다.');
  }

  if (!isAllowed) {
    return createSuccessResponse({ allowed: false, reason: '24시간 경과하여 처리할 수 없습니다.' });
  }

  return createSuccessResponse({ allowed: true });
}
