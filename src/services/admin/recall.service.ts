/**
 * 관리자 서비스 - 회수 관리
 * 출고/시술 회수 이력 조회 및 모니터링
 */

import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import { toEndOfDayKST, toStartOfDayKST } from '@/lib/utils/date';
import {
  maskPhoneNumber,
  parseRpcArray,
  createErrorResponse,
  createSuccessResponse,
} from '../common.service';
import type {
  ApiResponse,
  PaginatedResponse,
  RecallHistoryItem,
  OrganizationType,
  CursorPaginatedResponse,
} from '@/types/api.types';
import type { AdminRecallQueryData } from '@/lib/validations/admin';
import { CONFIG } from '@/constants/config';
import {
  AllRecallsRowSchema,
  AllRecallsCursorRowSchema,
} from '@/lib/validations/rpc-schemas';

const logger = createLogger('admin.recall.service');

// ============================================================================
// 상수
// ============================================================================

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = CONFIG.PAGINATION.DEFAULT_PAGE_SIZE;

// ============================================================================
// 회수 모니터링
// ============================================================================

/**
 * 회수 이력 조회
 *
 * @param query 조회 옵션
 * @returns 페이지네이션된 회수 이력
 */
export async function getRecallHistory(
  query: AdminRecallQueryData
): Promise<ApiResponse<PaginatedResponse<RecallHistoryItem>>> {
  const supabase = await createClient();
  const { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE, startDate, endDate, type = 'all' } =
    query;
  const offset = (page - DEFAULT_PAGE) * pageSize;

  const recallItems: RecallHistoryItem[] = [];

  // 1. 출고 회수 조회
  if (type === 'all' || type === 'shipment') {
    let shipmentQuery = supabase
      .from('shipment_batches')
      .select(
        `
        id,
        recall_date,
        recall_reason,
        from_org:organizations!shipment_batches_from_organization_id_fkey(id, name, type),
        to_org:organizations!shipment_batches_to_organization_id_fkey(id, name, type)
      `
      )
      .eq('is_recalled', true)
      .order('recall_date', { ascending: false });

    // KST 기준으로 날짜 범위 변환하여 종료일 포함
    if (startDate) {
      shipmentQuery = shipmentQuery.gte('recall_date', startDate);
    }
    if (endDate) {
      shipmentQuery = shipmentQuery.lte('recall_date', toEndOfDayKST(endDate));
    }

    const { data: shipments } = await shipmentQuery;

    // N+1 최적화: 모든 출고 뭉치의 상세 정보를 한 번에 조회
    const shipmentBatchIds = (shipments ?? []).map((s) => s.id);
    const { data: allShipmentDetails } = await supabase
      .from('shipment_details')
      .select(
        `
        shipment_batch_id,
        virtual_code:virtual_codes!inner(
          lot:lots!inner(
            product:products!inner(name)
          )
        )
      `
      )
      .in('shipment_batch_id', shipmentBatchIds);

    // 출고 뭉치별 상세 그룹화
    const detailsByBatchId = new Map<string, typeof allShipmentDetails>();
    for (const detail of allShipmentDetails ?? []) {
      const existing = detailsByBatchId.get(detail.shipment_batch_id) ?? [];
      existing.push(detail);
      detailsByBatchId.set(detail.shipment_batch_id, existing);
    }

    // 각 출고 회수 처리 (DB 쿼리 없이 메모리에서)
    for (const shipment of shipments ?? []) {
      const details = detailsByBatchId.get(shipment.id) ?? [];

      // 제품별 수량 집계
      const productCounts = new Map<string, number>();
      for (const detail of details) {
        const productName = (
          detail.virtual_code as {
            lot: { product: { name: string } };
          }
        ).lot.product.name;
        productCounts.set(productName, (productCounts.get(productName) ?? 0) + 1);
      }

      const fromOrg = shipment.from_org as { id: string; name: string; type: OrganizationType };
      const toOrg = shipment.to_org as { id: string; name: string; type: OrganizationType };

      recallItems.push({
        id: shipment.id,
        type: 'shipment',
        recallDate: shipment.recall_date ?? '',
        recallReason: shipment.recall_reason ?? '',
        quantity: details.length,
        fromOrganization: {
          id: fromOrg.id,
          name: fromOrg.name,
          type: fromOrg.type,
        },
        toTarget: toOrg
          ? {
              id: toOrg.id,
              name: toOrg.name,
              type: toOrg.type,
            }
          : null,
        items: Array.from(productCounts.entries()).map(([productName, quantity]) => ({
          productName,
          quantity,
        })),
      });
    }
  }

  // 2. 시술 회수 조회 (treatment_records는 현재 회수 기능이 없으므로 histories에서 조회)
  if (type === 'all' || type === 'treatment') {
    let treatmentRecallQuery = supabase
      .from('histories')
      .select(
        `
        id,
        created_at,
        recall_reason,
        from_owner_id,
        to_owner_id,
        virtual_code:virtual_codes!inner(
          id,
          lot:lots!inner(
            product:products!inner(name)
          )
        )
      `
      )
      .eq('action_type', 'RECALLED')
      .eq('from_owner_type', 'PATIENT')
      .order('created_at', { ascending: false });

    // KST 기준으로 날짜 범위 변환하여 종료일 포함
    if (startDate) {
      treatmentRecallQuery = treatmentRecallQuery.gte('created_at', startDate);
    }
    if (endDate) {
      treatmentRecallQuery = treatmentRecallQuery.lte('created_at', toEndOfDayKST(endDate));
    }

    const { data: treatmentRecalls } = await treatmentRecallQuery;

    // 같은 시간대에 발생한 회수를 그룹화
    const groupedRecalls = new Map<
      string,
      {
        id: string;
        recallDate: string;
        recallReason: string;
        fromOrganizationId: string;
        patientPhone: string;
        productCounts: Map<string, number>;
      }
    >();

    for (const recall of treatmentRecalls ?? []) {
      const key = `${recall.created_at.slice(0, 16)}_${recall.to_owner_id}_${recall.from_owner_id}`;
      const productName = (
        recall.virtual_code as {
          lot: { product: { name: string } };
        }
      ).lot.product.name;

      if (groupedRecalls.has(key)) {
        const existing = groupedRecalls.get(key)!;
        existing.productCounts.set(
          productName,
          (existing.productCounts.get(productName) ?? 0) + 1
        );
      } else {
        const productCounts = new Map<string, number>();
        productCounts.set(productName, 1);
        groupedRecalls.set(key, {
          id: recall.id,
          recallDate: recall.created_at,
          recallReason: recall.recall_reason ?? '',
          fromOrganizationId: recall.to_owner_id ?? '',
          patientPhone: recall.from_owner_id ?? '',
          productCounts,
        });
      }
    }

    // N+1 최적화: 조직 정보 배치 조회
    const orgIds = [...new Set(Array.from(groupedRecalls.values()).map((g) => g.fromOrganizationId))];
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name, type')
      .in('id', orgIds);

    const orgMap = new Map<string, { id: string; name: string; type: string }>();
    for (const org of orgs ?? []) {
      orgMap.set(org.id, org);
    }

    // 결과 추가 (DB 쿼리 없이 메모리에서)
    for (const [, group] of groupedRecalls) {
      const fromOrg = orgMap.get(group.fromOrganizationId);

      if (fromOrg) {
        recallItems.push({
          id: group.id,
          type: 'treatment',
          recallDate: group.recallDate,
          recallReason: group.recallReason,
          quantity: Array.from(group.productCounts.values()).reduce((a, b) => a + b, 0),
          fromOrganization: {
            id: fromOrg.id,
            name: fromOrg.name,
            type: fromOrg.type as OrganizationType,
          },
          toTarget: {
            id: group.patientPhone,
            name: maskPhoneNumber(group.patientPhone),
            type: 'PATIENT',
          },
          items: Array.from(group.productCounts.entries()).map(([productName, quantity]) => ({
            productName,
            quantity,
          })),
        });
      }
    }
  }

  // 날짜순 정렬
  recallItems.sort((a, b) => new Date(b.recallDate).getTime() - new Date(a.recallDate).getTime());

  // 페이지네이션
  const paginatedItems = recallItems.slice(offset, offset + pageSize);
  const total = recallItems.length;

  return createSuccessResponse({
    items: paginatedItems,
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
 * 회수 이력 조회 (최적화 버전 - Phase 17)
 * DB 함수를 사용하여 정렬/페이지네이션을 DB에서 처리
 *
 * 개선 사항:
 * - 출고 회수 + 시술 회수를 DB에서 통합 조회
 * - 정렬/페이지네이션을 DB에서 처리 (메모리 부담 제거)
 * - 대용량 데이터에서 50% 이상 성능 향상
 *
 * @param query 조회 옵션
 * @returns 페이지네이션된 회수 이력
 */
export async function getRecallHistoryOptimized(
  query: AdminRecallQueryData
): Promise<ApiResponse<PaginatedResponse<RecallHistoryItem>>> {
  const supabase = await createClient();
  const { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE, startDate, endDate, type = 'all' } =
    query;
  const offset = (page - DEFAULT_PAGE) * pageSize;

  // RPC 파라미터 (KST 기준으로 날짜 범위 변환하여 종료일 포함)
  const rpcParams = {
    p_start_date: startDate ? toStartOfDayKST(startDate) : undefined,
    p_end_date: endDate ? toEndOfDayKST(endDate) : undefined,
    p_type: type,
  };

  // 병렬로 데이터 + 카운트 조회
  const [dataResult, countResult] = await Promise.all([
    supabase.rpc('get_all_recalls', {
      ...rpcParams,
      p_limit: pageSize,
      p_offset: offset,
    }),
    supabase.rpc('get_all_recalls_count', rpcParams),
  ]);

  const { data: recalls, error: dataError } = dataResult;
  const { data: total, error: countError } = countResult;

  if (dataError) {
    logger.error('회수 이력 조회 실패, 기존 함수로 폴백', dataError);
    // 폴백: 기존 함수 사용
    return getRecallHistory(query);
  }

  if (countError) {
    logger.error('회수 이력 카운트 조회 실패', countError);
  }

  // Zod 검증으로 결과 파싱
  const parsed = parseRpcArray(AllRecallsRowSchema, recalls, 'get_all_recalls');
  if (!parsed.success) {
    logger.error('get_all_recalls 검증 실패', parsed.error);
    return createErrorResponse('VALIDATION_ERROR', parsed.error);
  }

  // DB 함수 결과를 RecallHistoryItem 형태로 변환
  const items: RecallHistoryItem[] = parsed.data.map((row) => ({
    id: row.recall_id,
    type: row.recall_type as 'shipment' | 'treatment',
    recallDate: row.recall_date,
    recallReason: row.recall_reason ?? '',
    quantity: Number(row.quantity),
    fromOrganization: {
      id: row.from_org_id,
      name: row.from_org_name,
      type: row.from_org_type as OrganizationType,
    },
    toTarget: row.to_id
      ? {
          id: row.to_id,
          name: row.to_name ?? '알 수 없음',
          type: row.to_type as OrganizationType | 'PATIENT',
        }
      : null,
    items: (row.product_summary as { productName: string; quantity: number }[] | null) ?? [],
  }));

  const totalCount = Number(total) ?? 0;

  return createSuccessResponse({
    items,
    meta: {
      page,
      pageSize,
      total: totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      hasMore: offset + pageSize < totalCount,
    },
  });
}

/**
 * 회수 이력 조회 (커서 기반 무한 스크롤)
 * RPC: get_all_recalls_cursor
 */
export async function getRecallHistoryCursor(query: {
  startDate?: string;
  endDate?: string;
  type?: 'shipment' | 'treatment' | 'all';
  limit?: number;
  cursorTime?: string;
  cursorKey?: string;
}): Promise<ApiResponse<CursorPaginatedResponse<RecallHistoryItem>>> {
  const supabase = await createClient();
  const { startDate, endDate, type = 'all', limit = 20, cursorTime, cursorKey } = query;

  // KST 기준으로 날짜 범위 변환하여 종료일 포함
  const { data, error } = await supabase.rpc('get_all_recalls_cursor', {
    p_start_date: startDate ? toStartOfDayKST(startDate) : undefined,
    p_end_date: endDate ? toEndOfDayKST(endDate) : undefined,
    p_type: type,
    p_limit: limit,
    p_cursor_time: cursorTime ?? undefined,
    p_cursor_key: cursorKey ?? undefined,
  });

  if (error) {
    logger.error('회수 이력 커서 조회 실패', error);
    return createErrorResponse('QUERY_ERROR', error.message);
  }

  // Zod 검증
  const parsed = parseRpcArray(AllRecallsCursorRowSchema, data, 'get_all_recalls_cursor');
  if (!parsed.success) {
    logger.error('get_all_recalls_cursor 검증 실패', parsed.error);
    return createErrorResponse('VALIDATION_ERROR', parsed.error);
  }

  // hasMore 추출 (limit+1개 조회하여 초과분이 있으면 hasMore)
  const hasMore = parsed.data.length > limit;

  // 초과분 제거하여 실제 반환 데이터 생성
  const actualData = hasMore ? parsed.data.slice(0, limit) : parsed.data;

  // RecallHistoryItem으로 변환
  const items: RecallHistoryItem[] = actualData.map((row) => ({
    id: row.recall_id,
    type: row.recall_type as 'shipment' | 'treatment',
    recallDate: row.recall_date,
    recallReason: row.recall_reason ?? '',
    quantity: Number(row.quantity),
    fromOrganization: {
      id: row.from_org_id,
      name: row.from_org_name,
      type: row.from_org_type as OrganizationType,
    },
    toTarget: row.to_id
      ? {
          id: row.to_id,
          name: row.to_name ?? '알 수 없음',
          type: row.to_type as OrganizationType | 'PATIENT',
        }
      : null,
    items: (row.product_summary as { productName: string; quantity: number }[] | null) ?? [],
    codeIds: row.code_ids ?? undefined,
  }));

  return createSuccessResponse({
    items,
    meta: {
      limit,
      hasMore,
    },
  });
}
