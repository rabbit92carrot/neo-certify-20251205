/**
 * 관리자 서비스 - 이벤트 요약
 * 관리자용 전체 이력 이벤트 요약 및 상세 조회
 */

import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import { toEndOfDayKST, toStartOfDayKST } from '@/lib/utils/date';
import {
  maskPhoneNumber,
  parseRpcArray,
  getActionTypeLabel,
  createErrorResponse,
  createSuccessResponse,
} from '../common.service';
import type {
  ApiResponse,
  PaginatedResponse,
  AdminEventSummary,
  AdminEventLotSummary,
  AdminEventSampleCode,
  LotCodeItem,
  LotCodesPaginatedResponse,
  HistoryActionType,
  VirtualCodeStatus,
} from '@/types/api.types';
import type { AdminEventSummaryQueryData } from '@/lib/validations/admin';
import { CONFIG } from '@/constants/config';
import { AdminEventSummaryRowSchema } from '@/lib/validations/rpc-schemas';

const logger = createLogger('admin.event-summary.service');

// ============================================================================
// 상수
// ============================================================================

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = CONFIG.PAGINATION.DEFAULT_PAGE_SIZE;

// ============================================================================
// 이벤트 요약 타입
// ============================================================================

/**
 * 커서 기반 쿼리 파라미터 타입
 */
interface AdminEventSummaryCursorQuery {
  startDate?: string;
  endDate?: string;
  actionTypes?: string[];
  lotNumber?: string;
  productId?: string;
  organizationId?: string;
  includeRecalled?: boolean;
  limit?: number;
  cursorTime?: string;
  cursorKey?: string;
}

/**
 * 커서 기반 응답 타입
 */
interface CursorPaginatedEventSummary {
  items: AdminEventSummary[];
  meta: {
    hasMore: boolean;
    limit: number;
  };
}

// ============================================================================
// 이벤트 요약 조회
// ============================================================================

/**
 * 관리자 이벤트 요약 조회 (offset 페이지네이션)
 *
 * @param query 조회 조건
 * @returns 페이지네이션된 이벤트 요약
 */
export async function getAdminEventSummary(
  query: AdminEventSummaryQueryData
): Promise<ApiResponse<PaginatedResponse<AdminEventSummary>>> {
  const supabase = await createClient();
  const {
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
    startDate,
    endDate,
    actionTypes,
    lotNumber,
    productId,
    organizationId,
    includeRecalled = true,
  } = query;
  const offset = (page - DEFAULT_PAGE) * pageSize;

  // 공통 RPC 파라미터 (KST 기준으로 날짜 범위 변환하여 종료일 포함)
  const rpcParams = {
    p_start_date: startDate ? toStartOfDayKST(startDate) : undefined,
    p_end_date: endDate ? toEndOfDayKST(endDate) : undefined,
    p_action_types: actionTypes?.length ? actionTypes : undefined,
    p_lot_number: lotNumber || undefined,
    p_product_id: productId || undefined,
    p_organization_id: organizationId || undefined,
    p_include_recalled: includeRecalled,
  };

  // 병렬로 이벤트 요약 조회 + 총 개수 조회 (Phase 16 최적화)
  const [summaryResult, countResult] = await Promise.all([
    supabase.rpc('get_admin_event_summary', {
      ...rpcParams,
      p_limit: pageSize,
      p_offset: offset,
    }),
    supabase.rpc('get_admin_event_summary_count', rpcParams),
  ]);

  const { data: summaryData, error: summaryError } = summaryResult;
  const { data: totalCount, error: countError } = countResult;

  if (summaryError) {
    logger.error('이벤트 요약 조회 실패', summaryError);
    return createErrorResponse('QUERY_ERROR', summaryError.message || '이벤트 요약 조회에 실패했습니다.');
  }

  if (countError) {
    logger.error('이벤트 요약 카운트 조회 실패', countError);
  }

  // Zod 검증으로 결과 파싱
  const parsed = parseRpcArray(AdminEventSummaryRowSchema, summaryData, 'get_admin_event_summary');
  if (!parsed.success) {
    logger.error('get_admin_event_summary 검증 실패', parsed.error);
    return createErrorResponse('VALIDATION_ERROR', parsed.error);
  }

  const validatedData = parsed.data;

  // 조직 이름 캐시 생성 및 일괄 조회
  const orgIds = new Set<string>();
  for (const row of validatedData) {
    if (row.from_owner_id && row.from_owner_type === 'ORGANIZATION') {
      orgIds.add(row.from_owner_id);
    }
    if (row.to_owner_id && row.to_owner_type === 'ORGANIZATION') {
      orgIds.add(row.to_owner_id);
    }
  }

  // 조직 이름 일괄 조회
  const orgNameMap = new Map<string, string>();
  if (orgIds.size > 0) {
    const { data: orgData } = await supabase
      .from('organizations')
      .select('id, name')
      .in('id', [...orgIds]);

    for (const org of orgData ?? []) {
      orgNameMap.set(org.id, org.name);
    }
  }

  // 결과 매핑 (Zod 검증된 데이터 사용)
  const summaries: AdminEventSummary[] = validatedData.map((row) => {
    const fromOwner = row.from_owner_id
      ? {
          type: row.from_owner_type as 'ORGANIZATION' | 'PATIENT',
          id: row.from_owner_id,
          name:
            row.from_owner_type === 'PATIENT'
              ? maskPhoneNumber(row.from_owner_id)
              : orgNameMap.get(row.from_owner_id) || '알 수 없음',
        }
      : null;

    const toOwner = row.to_owner_id
      ? {
          type: row.to_owner_type as 'ORGANIZATION' | 'PATIENT',
          id: row.to_owner_id,
          name:
            row.to_owner_type === 'PATIENT'
              ? maskPhoneNumber(row.to_owner_id)
              : orgNameMap.get(row.to_owner_id) || '알 수 없음',
        }
      : null;

    // lot_summaries는 Zod로 검증된 형식
    const lotSummaries: AdminEventLotSummary[] = (row.lot_summaries ?? []).map((lot) => ({
      lotId: lot.lotId,
      lotNumber: lot.lotNumber,
      productId: lot.productId,
      productName: lot.productName,
      modelName: '', // DB 함수는 model_name을 반환하지 않음
      quantity: lot.quantity,
      codeIds: [], // DB 함수는 code_ids를 lot 레벨에서 반환하지 않음
    }));

    return {
      id: row.group_key,
      eventTime: row.event_time,
      actionType: row.action_type as HistoryActionType,
      actionTypeLabel: getActionTypeLabel(row.action_type),
      fromOwner,
      toOwner,
      isRecall: row.is_recall ?? false,
      recallReason: row.recall_reason ?? undefined,
      totalQuantity: Number(row.total_quantity),
      lotSummaries,
      sampleCodeIds: row.sample_code_ids ?? [],
    };
  });

  const total = Number(totalCount) ?? summaries.length;

  return createSuccessResponse({
    items: summaries,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasMore: offset + summaries.length < total,
    },
  });
}

/**
 * 이벤트 샘플 코드 조회
 * 이벤트 상세 모달에서 샘플 코드 표시용
 *
 * @param codeIds 가상 코드 ID 배열 (최대 10개)
 * @returns 샘플 코드 상세 정보 배열
 */
export async function getEventSampleCodes(
  codeIds: string[]
): Promise<ApiResponse<AdminEventSampleCode[]>> {
  const supabase = await createClient();

  if (!codeIds.length) {
    return createSuccessResponse([]);
  }

  // 최대 10개만 조회
  const limitedIds = codeIds.slice(0, 10);

  const { data, error } = await supabase
    .from('virtual_codes')
    .select(
      `
      id,
      code,
      status,
      owner_id,
      owner_type,
      lot:lots!inner(
        lot_number,
        manufacture_date,
        product:products!inner(name)
      )
    `
    )
    .in('id', limitedIds);

  if (error) {
    logger.error('샘플 코드 조회 실패', error);
    return createErrorResponse('QUERY_ERROR', error.message);
  }

  // 소유자 이름 조회 (조직만)
  const ownerIds = (data ?? [])
    .filter((vc) => vc.owner_type === 'ORGANIZATION')
    .map((vc) => vc.owner_id);

  const orgNameMap = new Map<string, string>();
  if (ownerIds.length > 0) {
    const { data: orgData } = await supabase
      .from('organizations')
      .select('id, name')
      .in('id', [...new Set(ownerIds)]);

    for (const org of orgData ?? []) {
      orgNameMap.set(org.id, org.name);
    }
  }

  const sampleCodes: AdminEventSampleCode[] = (data ?? []).map((vc) => {
    const lot = vc.lot as { lot_number: string; manufacture_date: string; product: { name: string } };
    return {
      id: vc.id,
      code: vc.code,
      productionDate: lot.manufacture_date,
      currentStatus: vc.status as VirtualCodeStatus,
      currentOwnerName:
        vc.owner_type === 'PATIENT'
          ? maskPhoneNumber(vc.owner_id)
          : orgNameMap.get(vc.owner_id) || '알 수 없음',
      lotNumber: lot.lot_number,
      productName: lot.product.name,
    };
  });

  return createSuccessResponse(sampleCodes);
}

/**
 * 이벤트별 고유식별코드 페이지네이션 조회
 * 이벤트 상세의 Lot 확장 영역에서 사용
 * codeIds 배열을 기반으로 해당 이벤트에서 처리된 코드만 조회
 *
 * @param codeIds 조회할 코드 ID 배열
 * @param page 페이지 번호 (1부터 시작)
 * @param pageSize 페이지당 개수 (기본 20)
 * @returns 페이지네이션된 코드 목록
 */
export async function getEventCodesPaginated(
  codeIds: string[],
  page: number = 1,
  pageSize: number = 20
): Promise<ApiResponse<LotCodesPaginatedResponse>> {
  const supabase = await createClient();

  // 전체 개수 계산
  const total = codeIds.length;
  const totalPages = Math.ceil(total / pageSize);
  const offset = (page - 1) * pageSize;

  // 현재 페이지의 코드 ID들만 추출
  const pageCodeIds = codeIds.slice(offset, offset + pageSize);

  if (pageCodeIds.length === 0) {
    return createSuccessResponse({
      codes: [],
      total,
      totalPages,
      page,
    });
  }

  // 코드 정보 조회 (현재 상태 및 소유자 포함)
  const { data, error } = await supabase
    .from('virtual_codes')
    .select(`
      id,
      code,
      status,
      owner_type,
      owner_id
    `)
    .in('id', pageCodeIds);

  if (error) {
    logger.error('이벤트 코드 조회 실패', error);
    return createErrorResponse('QUERY_ERROR', error.message || '코드 조회에 실패했습니다.');
  }

  // 조직 이름 일괄 조회
  const orgIds = new Set<string>();
  for (const row of data ?? []) {
    if (row.owner_type === 'ORGANIZATION' && row.owner_id) {
      orgIds.add(row.owner_id);
    }
  }

  const orgNameMap = new Map<string, string>();
  if (orgIds.size > 0) {
    const { data: orgData } = await supabase
      .from('organizations')
      .select('id, name')
      .in('id', [...orgIds]);

    for (const org of orgData ?? []) {
      orgNameMap.set(org.id, org.name);
    }
  }

  // 원본 순서 유지를 위한 맵 생성
  const dataMap = new Map(data?.map((row) => [row.id, row]) ?? []);

  // 결과 매핑 (원본 순서 유지)
  const codes: LotCodeItem[] = pageCodeIds
    .map((id) => dataMap.get(id))
    .filter((row): row is NonNullable<typeof row> => row !== undefined)
    .map((row) => ({
      id: row.id,
      code: row.code,
      currentStatus: row.status as VirtualCodeStatus,
      currentOwnerName:
        row.owner_type === 'PATIENT'
          ? maskPhoneNumber(row.owner_id)
          : orgNameMap.get(row.owner_id) || '알 수 없음',
      currentOwnerType: row.owner_type as 'ORGANIZATION' | 'PATIENT',
    }));

  return createSuccessResponse({
    codes,
    total,
    totalPages,
    page,
  });
}

/**
 * 관리자 이벤트 요약 조회 (커서 기반)
 * OFFSET 대비 대용량 데이터에서 일관된 성능 제공
 *
 * @param query 조회 조건 (커서 포함)
 * @returns 커서 기반 페이지네이션 응답
 */
export async function getAdminEventSummaryCursor(
  query: AdminEventSummaryCursorQuery
): Promise<ApiResponse<CursorPaginatedEventSummary>> {
  const supabase = await createClient();
  const {
    startDate,
    endDate,
    actionTypes,
    lotNumber,
    productId,
    organizationId,
    includeRecalled = true,
    limit = 50,
    cursorTime,
    cursorKey,
  } = query;

  // RPC 파라미터 구성 (KST 기준으로 날짜 범위 변환하여 종료일 포함)
  const rpcParams = {
    p_start_date: startDate ? toStartOfDayKST(startDate) : undefined,
    p_end_date: endDate ? toEndOfDayKST(endDate) : undefined,
    p_action_types: actionTypes?.length ? actionTypes : undefined,
    p_lot_number: lotNumber || undefined,
    p_product_id: productId || undefined,
    p_organization_id: organizationId || undefined,
    p_include_recalled: includeRecalled,
    p_limit: limit,
    p_cursor_time: cursorTime || undefined,
    p_cursor_key: cursorKey || undefined,
  };

  // RPC 호출 (database.types.ts에서 MergeDeep로 타입 확장됨)
  const { data, error } = await supabase.rpc('get_admin_event_summary_cursor', rpcParams);

  if (error) {
    logger.error('이벤트 요약 커서 조회 실패', error);
    return createErrorResponse('QUERY_ERROR', error.message || '이벤트 요약 조회에 실패했습니다.');
  }

  // Zod 검증으로 결과 파싱 (런타임 타입 안전성 확보)
  const { AdminEventSummaryCursorRowSchema } = await import('@/lib/validations/rpc-schemas');
  const parsed = parseRpcArray(AdminEventSummaryCursorRowSchema, data, 'get_admin_event_summary_cursor');
  if (!parsed.success) {
    logger.error('get_admin_event_summary_cursor 검증 실패', parsed.error);
    return createErrorResponse('VALIDATION_ERROR', parsed.error);
  }

  const validatedData = parsed.data;

  // hasMore 플래그 추출 (첫 번째 행에서)
  const hasMore = validatedData.length > 0 ? validatedData[0]?.has_more ?? false : false;

  // 조직 이름 일괄 조회
  const orgIds = new Set<string>();
  for (const row of validatedData) {
    if (row.from_owner_id && row.from_owner_type === 'ORGANIZATION') {
      orgIds.add(row.from_owner_id);
    }
    if (row.to_owner_id && row.to_owner_type === 'ORGANIZATION') {
      orgIds.add(row.to_owner_id);
    }
  }

  const orgNameMap = new Map<string, string>();
  if (orgIds.size > 0) {
    const { data: orgData } = await supabase
      .from('organizations')
      .select('id, name')
      .in('id', [...orgIds]);

    for (const org of orgData ?? []) {
      orgNameMap.set(org.id, org.name);
    }
  }

  // 결과 매핑
  const summaries: AdminEventSummary[] = validatedData.map((row) => {
    const fromOwner = row.from_owner_id
      ? {
          type: row.from_owner_type as 'ORGANIZATION' | 'PATIENT',
          id: row.from_owner_id,
          name:
            row.from_owner_type === 'PATIENT'
              ? maskPhoneNumber(row.from_owner_id)
              : orgNameMap.get(row.from_owner_id) || '알 수 없음',
        }
      : null;

    const toOwner = row.to_owner_id
      ? {
          type: row.to_owner_type as 'ORGANIZATION' | 'PATIENT',
          id: row.to_owner_id,
          name:
            row.to_owner_type === 'PATIENT'
              ? maskPhoneNumber(row.to_owner_id)
              : orgNameMap.get(row.to_owner_id) || '알 수 없음',
        }
      : null;

    const lotSummaries: AdminEventLotSummary[] = (row.lot_summaries ?? []).map((lot) => ({
      lotId: lot.lotId,
      lotNumber: lot.lotNumber,
      productId: lot.productId,
      productName: lot.productName,
      modelName: '',
      quantity: lot.quantity,
      codeIds: lot.codeIds ?? [],
    }));

    return {
      id: row.group_key,
      eventTime: row.event_time,
      actionType: row.action_type as HistoryActionType,
      actionTypeLabel: getActionTypeLabel(row.action_type),
      fromOwner,
      toOwner,
      isRecall: row.is_recall ?? false,
      recallReason: row.recall_reason ?? undefined,
      totalQuantity: Number(row.total_quantity),
      lotSummaries,
      sampleCodeIds: row.sample_code_ids ?? [],
    };
  });

  return createSuccessResponse({
    items: summaries,
    meta: {
      hasMore,
      limit,
    },
  });
}
