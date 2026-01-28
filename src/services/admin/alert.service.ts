/**
 * 관리자 알림 서비스
 * 비활성 제품 사용 로그 관리 비즈니스 로직
 */

import { createClient } from '@/lib/supabase/server';
import {
  createErrorResponse,
  createSuccessResponse,
} from '../common.service';
import type {
  ApiResponse,
  PaginatedResponse,
  InactiveProductUsageLog,
  ProductDeactivationReason,
} from '@/types/api.types';

// ============================================================================
// 비활성 제품 사용 로그
// ============================================================================

/**
 * 비활성 제품 사용 로그 조회
 *
 * @param options 조회 옵션
 * @returns 페이지네이션된 사용 로그
 */
export async function getInactiveProductUsageLogs(
  options: {
    page?: number;
    pageSize?: number;
    acknowledged?: boolean;
    manufacturerOrgId?: string;
  } = {}
): Promise<ApiResponse<PaginatedResponse<InactiveProductUsageLog>>> {
  const supabase = await createClient();
  const { page = 1, pageSize = 20, acknowledged, manufacturerOrgId } = options;
  const offset = (page - 1) * pageSize;

  let queryBuilder = supabase
    .from('inactive_product_usage_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  // 확인 여부 필터
  if (acknowledged !== undefined) {
    if (acknowledged) {
      queryBuilder = queryBuilder.not('acknowledged_at', 'is', null);
    } else {
      queryBuilder = queryBuilder.is('acknowledged_at', null);
    }
  }

  // 제조사 필터 (제조사 페이지용)
  if (manufacturerOrgId) {
    queryBuilder = queryBuilder.eq('manufacturer_org_id', manufacturerOrgId);
  }

  const { data, count, error } = await queryBuilder.range(offset, offset + pageSize - 1);

  if (error) {
    return createErrorResponse('QUERY_ERROR', '사용 로그 조회에 실패했습니다.');
  }

  const total = count ?? 0;

  const logs: InactiveProductUsageLog[] = (data ?? []).map((row) => ({
    id: row.id,
    usageType: row.usage_type as 'SHIPMENT' | 'TREATMENT',
    usageId: row.usage_id,
    productId: row.product_id,
    productName: row.product_name,
    deactivationReason: row.deactivation_reason as ProductDeactivationReason,
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    manufacturerOrgId: row.manufacturer_org_id,
    quantity: row.quantity,
    createdAt: row.created_at,
    acknowledgedAt: row.acknowledged_at ?? undefined,
    acknowledgedBy: row.acknowledged_by ?? undefined,
  }));

  return createSuccessResponse({
    items: logs,
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
 * 비활성 제품 사용 로그 확인 처리
 *
 * @param logId 로그 ID
 * @param adminOrgId 확인 처리하는 관리자 조직 ID
 * @returns 성공 여부
 */
export async function acknowledgeUsageLog(
  logId: string,
  adminOrgId: string
): Promise<ApiResponse<void>> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('inactive_product_usage_logs')
    .update({
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: adminOrgId,
    })
    .eq('id', logId)
    .is('acknowledged_at', null); // 아직 확인 안된 것만

  if (error) {
    return createErrorResponse('UPDATE_FAILED', '확인 처리에 실패했습니다.');
  }

  return createSuccessResponse(undefined);
}

/**
 * 여러 비활성 제품 사용 로그 일괄 확인 처리
 *
 * @param logIds 로그 ID 배열
 * @param adminOrgId 확인 처리하는 관리자 조직 ID
 * @returns 성공 여부
 */
export async function acknowledgeUsageLogs(
  logIds: string[],
  adminOrgId: string
): Promise<ApiResponse<void>> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('inactive_product_usage_logs')
    .update({
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: adminOrgId,
    })
    .in('id', logIds)
    .is('acknowledged_at', null);

  if (error) {
    return createErrorResponse('UPDATE_FAILED', '확인 처리에 실패했습니다.');
  }

  return createSuccessResponse(undefined);
}

/**
 * 미확인 비활성 제품 사용 로그 카운트
 *
 * @returns 미확인 로그 개수
 */
export async function getUnacknowledgedUsageLogCount(): Promise<ApiResponse<number>> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('inactive_product_usage_logs')
    .select('id', { count: 'exact', head: true })
    .is('acknowledged_at', null);

  if (error) {
    return createErrorResponse('QUERY_ERROR', '카운트 조회에 실패했습니다.');
  }

  return createSuccessResponse(count ?? 0);
}
