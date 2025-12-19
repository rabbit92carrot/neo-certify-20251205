/**
 * 거래이력 서비스
 * 모든 역할에서 공유하는 거래 이력 조회 로직
 *
 * 이력 유형:
 * - PRODUCED: 생산 (제조사)
 * - SHIPPED: 출고 (모든 역할)
 * - RECEIVED: 입고 (유통사, 병원)
 * - TREATED: 시술 (병원)
 * - RECALLED: 회수 (모든 역할)
 *
 * SSOT 원칙:
 * - 이력 그룹화는 DB 함수(get_history_summary)를 통해 수행
 * - 조직 이름 조회는 common.service.ts의 공통 함수 사용
 * - 마스킹 유틸리티는 common.service.ts 사용
 */

import { createClient } from '@/lib/supabase/server';
import {
  getOrganizationName,
  getOrganizationNames,
  maskPhoneNumber,
  createOrganizationNameCache,
  getActionTypeLabel,
  parseRpcArray,
  createErrorResponse,
  createSuccessResponse,
} from './common.service';
import type {
  ApiResponse,
  PaginatedResponse,
  HistoryActionType,
} from '@/types/api.types';
import type { TransactionHistoryQueryData } from '@/lib/validations/history';
import { HistorySummaryRowSchema, HistorySummaryCursorRowSchema } from '@/lib/validations/rpc-schemas';
import { CONFIG } from '@/constants/config';

// ProductSummaryItem 타입은 HistorySummaryRowSchema에서 추론됨
// codes 필드는 20251219100000_restore_codes_in_history_summary.sql에서 복원됨

// 조직명 포함 여부 확인 (마이그레이션 적용 후 true)
const HAS_ORG_NAMES_IN_RPC = true;

// ============================================================================
// 타입 정의
// ============================================================================

/**
 * 거래이력 아이템 (조인된 정보 포함)
 */
export interface TransactionHistoryItem {
  id: string;
  actionType: HistoryActionType;
  actionTypeLabel: string;
  createdAt: string;
  isRecall: boolean;
  recallReason?: string;

  // 가상 코드 정보
  virtualCode: {
    id: string;
    code: string;
  };

  // 제품/Lot 정보
  product: {
    id: string;
    name: string;
  };
  lot: {
    id: string;
    lotNumber: string;
  };

  // 거래 당사자 정보
  fromOwner?: {
    type: 'ORGANIZATION' | 'PATIENT';
    id: string;
    name: string;
  };
  toOwner?: {
    type: 'ORGANIZATION' | 'PATIENT';
    id: string;
    name: string;
  };
}

/**
 * 거래이력 요약 (그룹화)
 */
export interface TransactionHistorySummary {
  id: string; // 그룹 키 (고유 식별자)
  actionType: HistoryActionType;
  actionTypeLabel: string;
  createdAt: string;
  isRecall: boolean;
  recallReason?: string;

  // 거래 당사자
  fromOwner?: {
    type: 'ORGANIZATION' | 'PATIENT';
    id: string;
    name: string;
  };
  toOwner?: {
    type: 'ORGANIZATION' | 'PATIENT';
    id: string;
    name: string;
  };

  // 제품별 수량 요약
  items: {
    productId: string;
    productName: string;
    quantity: number;
    codes: string[]; // 제품 코드 문자열 배열 (NC-XXXXXXXX 형식)
  }[];

  totalQuantity: number;
}

// ============================================================================
// 커서 기반 페이지네이션 타입
// ============================================================================

/**
 * 커서 기반 페이지네이션 쿼리 파라미터
 */
export interface HistoryCursorQuery {
  actionTypes?: HistoryActionType[];
  startDate?: string;
  endDate?: string;
  isRecall?: boolean;
  limit?: number;
  cursorTime?: string;
  cursorKey?: string;
}

/**
 * 커서 기반 페이지네이션 메타데이터
 */
export interface CursorPaginationMeta {
  hasMore: boolean;
  limit: number;
}

/**
 * 커서 기반 페이지네이션 응답
 */
export interface CursorPaginatedHistory {
  items: TransactionHistorySummary[];
  meta: CursorPaginationMeta;
}

// ============================================================================
// 상수
// ============================================================================

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = CONFIG.PAGINATION.DEFAULT_PAGE_SIZE;
const DEFAULT_CURSOR_LIMIT = 50;

// ============================================================================
// 거래이력 조회 (DB 함수 사용)
// ============================================================================

/**
 * 조직의 거래이력 조회 (DB 함수를 통한 서버 사이드 그룹화)
 * 최적화: 이력 조회와 카운트 조회를 Promise.all로 병렬 실행 (Phase 13.2)
 *
 * @param organizationId 조직 ID
 * @param query 조회 옵션
 * @returns 페이지네이션된 거래이력 목록
 */
export async function getTransactionHistory(
  organizationId: string,
  query: TransactionHistoryQueryData
): Promise<ApiResponse<PaginatedResponse<TransactionHistorySummary>>> {
  const supabase = await createClient();
  const {
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
    startDate,
    endDate,
    actionTypes,
    isRecall,
  } = query;
  const offset = (page - DEFAULT_PAGE) * pageSize;

  // 공통 파라미터 (RPC는 null이 아닌 undefined 사용)
  const rpcParams = {
    p_organization_id: organizationId,
    p_action_types: actionTypes && actionTypes.length > 0 ? actionTypes : undefined,
    p_start_date: startDate || undefined,
    p_end_date: endDate || undefined,
    p_is_recall: isRecall ?? undefined,
  };

  // 병렬로 이력 조회와 카운트 조회 실행 (Phase 13.2 최적화)
  const [historyResult, countResult] = await Promise.all([
    // 1. DB 함수를 통해 그룹화된 이력 조회
    supabase.rpc('get_history_summary', {
      ...rpcParams,
      p_limit: pageSize,
      p_offset: offset,
    }),
    // 2. 총 그룹 수 조회 (페이지네이션용)
    supabase.rpc('get_history_summary_count', rpcParams),
  ]);

  const { data: historyData, error: historyError } = historyResult;
  const { data: totalCount, error: countError } = countResult;

  if (historyError) {
    console.error('거래이력 조회 실패:', historyError.message);
    return createErrorResponse('QUERY_ERROR', historyError.message ?? '거래이력 조회에 실패했습니다.');
  }

  if (countError) {
    console.error('거래이력 카운트 실패:', countError.message);
  }

  // Zod 검증으로 결과 파싱
  const parsed = parseRpcArray(HistorySummaryRowSchema, historyData, 'get_history_summary');
  if (!parsed.success) {
    console.error('get_history_summary 검증 실패:', parsed.error);
    return createErrorResponse('VALIDATION_ERROR', parsed.error);
  }

  const validatedData = parsed.data;

  // 3. 조직 이름 조회 (RPC에 포함되지 않은 경우에만 별도 조회)
  let orgNameMap: Map<string, string> = new Map();
  if (!HAS_ORG_NAMES_IN_RPC) {
    const orgIds = new Set<string>();
    for (const row of validatedData) {
      if (row.from_owner_id && row.from_owner_type === 'ORGANIZATION') {
        orgIds.add(row.from_owner_id);
      }
      if (row.to_owner_id && row.to_owner_type === 'ORGANIZATION') {
        orgIds.add(row.to_owner_id);
      }
    }
    orgNameMap = await getOrganizationNames([...orgIds]);
  }

  // 4. 결과 매핑 (Zod 검증된 데이터 사용)
  const summaries: TransactionHistorySummary[] = validatedData.map((row) => {
    // product_summaries는 Zod로 검증된 형식 (타입 추론 자동)
    const productSummaries = row.product_summaries;
      // 소유자 정보 포맷팅 (RPC에서 조직명 반환 시 직접 사용)
      const fromOwner = row.from_owner_id
        ? {
            type: row.from_owner_type as 'ORGANIZATION' | 'PATIENT',
            id: row.from_owner_id,
            name:
              row.from_owner_type === 'PATIENT'
                ? maskPhoneNumber(row.from_owner_id)
                : (HAS_ORG_NAMES_IN_RPC
                    ? row.from_owner_name ?? '알 수 없음'
                    : orgNameMap.get(row.from_owner_id) ?? '알 수 없음'),
          }
        : undefined;

      const toOwner = row.to_owner_id
        ? {
            type: row.to_owner_type as 'ORGANIZATION' | 'PATIENT',
            id: row.to_owner_id,
            name:
              row.to_owner_type === 'PATIENT'
                ? maskPhoneNumber(row.to_owner_id)
                : (HAS_ORG_NAMES_IN_RPC
                    ? row.to_owner_name ?? '알 수 없음'
                    : orgNameMap.get(row.to_owner_id) ?? '알 수 없음'),
          }
        : undefined;

      return {
        id: row.group_key,
        actionType: row.action_type as HistoryActionType,
        actionTypeLabel: getActionTypeLabel(row.action_type),
        createdAt: row.created_at,
        isRecall: row.is_recall ?? false,
        recallReason: row.recall_reason ?? undefined,
        fromOwner,
        toOwner,
        items: (productSummaries ?? []).map((item) => ({
          ...item,
          codes: item.codes ?? [],
        })),
        totalQuantity: Number(row.total_quantity),
      };
    }
  );

  const total = Number(totalCount) || summaries.length;

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
 * 제조사 거래이력 조회
 * - 생산(PRODUCED), 출고(SHIPPED), 회수(RECALLED)
 */
export async function getManufacturerHistory(
  organizationId: string,
  query: TransactionHistoryQueryData
): Promise<ApiResponse<PaginatedResponse<TransactionHistorySummary>>> {
  const manufacturerActionTypes: HistoryActionType[] = ['PRODUCED', 'SHIPPED', 'RECALLED'];

  // 필터가 없으면 제조사 기본 액션 타입 적용
  const filteredQuery = {
    ...query,
    actionTypes:
      query.actionTypes && query.actionTypes.length > 0
        ? query.actionTypes.filter((t) =>
            manufacturerActionTypes.includes(t as HistoryActionType)
          )
        : manufacturerActionTypes,
  };

  return getTransactionHistory(organizationId, filteredQuery as TransactionHistoryQueryData);
}

/**
 * 유통사 거래이력 조회
 * - 입고(RECEIVED), 출고(SHIPPED), 회수(RECALLED)
 */
export async function getDistributorHistory(
  organizationId: string,
  query: TransactionHistoryQueryData
): Promise<ApiResponse<PaginatedResponse<TransactionHistorySummary>>> {
  const distributorActionTypes: HistoryActionType[] = ['RECEIVED', 'SHIPPED', 'RECALLED'];

  const filteredQuery = {
    ...query,
    actionTypes:
      query.actionTypes && query.actionTypes.length > 0
        ? query.actionTypes.filter((t) =>
            distributorActionTypes.includes(t as HistoryActionType)
          )
        : distributorActionTypes,
  };

  return getTransactionHistory(organizationId, filteredQuery as TransactionHistoryQueryData);
}

/**
 * 병원 거래이력 조회
 * - 입고(RECEIVED), 시술(TREATED), 회수(RECALLED)
 */
export async function getHospitalHistory(
  organizationId: string,
  query: TransactionHistoryQueryData
): Promise<ApiResponse<PaginatedResponse<TransactionHistorySummary>>> {
  const hospitalActionTypes: HistoryActionType[] = ['RECEIVED', 'TREATED', 'RECALLED'];

  const filteredQuery = {
    ...query,
    actionTypes:
      query.actionTypes && query.actionTypes.length > 0
        ? query.actionTypes.filter((t) =>
            hospitalActionTypes.includes(t as HistoryActionType)
          )
        : hospitalActionTypes,
  };

  return getTransactionHistory(organizationId, filteredQuery as TransactionHistoryQueryData);
}

// ============================================================================
// 커서 기반 페이지네이션 함수
// ============================================================================

/**
 * 조직의 거래이력 조회 (커서 기반 페이지네이션)
 * DB 함수 get_history_summary_cursor 사용
 *
 * 장점:
 * - OFFSET 기반 대비 대용량 데이터에서 일관된 성능 (O(1) vs O(n))
 * - count 쿼리 제거로 쿼리 수 50% 감소
 * - 100K+ 데이터에서 OFFSET 대비 10-50배 성능 향상
 *
 * @param organizationId 조직 ID
 * @param query 커서 기반 조회 옵션
 * @returns 커서 기반 페이지네이션 응답
 */
export async function getTransactionHistoryCursor(
  organizationId: string,
  query: HistoryCursorQuery
): Promise<ApiResponse<CursorPaginatedHistory>> {
  const supabase = await createClient();
  const {
    actionTypes,
    startDate,
    endDate,
    isRecall,
    limit = DEFAULT_CURSOR_LIMIT,
    cursorTime,
    cursorKey,
  } = query;

  // RPC 파라미터 구성
  const rpcParams = {
    p_organization_id: organizationId,
    p_action_types: actionTypes?.length ? actionTypes : undefined,
    p_start_date: startDate || undefined,
    p_end_date: endDate || undefined,
    p_is_recall: isRecall ?? undefined,
    p_limit: limit,
    p_cursor_time: cursorTime || undefined,
    p_cursor_key: cursorKey || undefined,
  };

  // 커서 기반 RPC 호출
  const { data, error } = await supabase.rpc('get_history_summary_cursor', rpcParams);

  if (error) {
    console.error('거래이력 커서 조회 실패:', error.message);
    return createErrorResponse('QUERY_ERROR', error.message ?? '거래이력 조회에 실패했습니다.');
  }

  // Zod 검증으로 결과 파싱
  const parsed = parseRpcArray(HistorySummaryCursorRowSchema, data, 'get_history_summary_cursor');
  if (!parsed.success) {
    console.error('get_history_summary_cursor 검증 실패:', parsed.error);
    return createErrorResponse('VALIDATION_ERROR', parsed.error);
  }

  const validatedData = parsed.data;

  // hasMore 플래그 추출 (첫 번째 행에서)
  const hasMore = validatedData.length > 0 ? validatedData[0]?.has_more ?? false : false;

  // 결과 매핑 (RPC에서 조직명 반환됨)
  const summaries: TransactionHistorySummary[] = validatedData.map((row) => {
    const productSummaries = row.product_summaries;

    const fromOwner = row.from_owner_id
      ? {
          type: row.from_owner_type as 'ORGANIZATION' | 'PATIENT',
          id: row.from_owner_id,
          name:
            row.from_owner_type === 'PATIENT'
              ? maskPhoneNumber(row.from_owner_id)
              : row.from_owner_name ?? '알 수 없음',
        }
      : undefined;

    const toOwner = row.to_owner_id
      ? {
          type: row.to_owner_type as 'ORGANIZATION' | 'PATIENT',
          id: row.to_owner_id,
          name:
            row.to_owner_type === 'PATIENT'
              ? maskPhoneNumber(row.to_owner_id)
              : row.to_owner_name ?? '알 수 없음',
        }
      : undefined;

    return {
      id: row.group_key,
      actionType: row.action_type as HistoryActionType,
      actionTypeLabel: getActionTypeLabel(row.action_type),
      createdAt: row.created_at,
      isRecall: row.is_recall ?? false,
      recallReason: row.recall_reason ?? undefined,
      fromOwner,
      toOwner,
      items: (productSummaries ?? []).map((item) => ({
        ...item,
        codes: [], // 커서 버전에서는 codes 미포함 (성능 최적화)
      })),
      totalQuantity: Number(row.total_quantity),
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

/**
 * 제조사 거래이력 조회 (커서 기반)
 * - 생산(PRODUCED), 출고(SHIPPED), 회수(RECALLED)
 */
export async function getManufacturerHistoryCursor(
  organizationId: string,
  query: HistoryCursorQuery
): Promise<ApiResponse<CursorPaginatedHistory>> {
  const manufacturerActionTypes: HistoryActionType[] = ['PRODUCED', 'SHIPPED', 'RECALLED'];

  const filteredQuery = {
    ...query,
    actionTypes:
      query.actionTypes?.length
        ? query.actionTypes.filter((t) =>
            manufacturerActionTypes.includes(t as HistoryActionType)
          )
        : manufacturerActionTypes,
  };

  return getTransactionHistoryCursor(organizationId, filteredQuery);
}

/**
 * 유통사 거래이력 조회 (커서 기반)
 * - 입고(RECEIVED), 출고(SHIPPED), 회수(RECALLED)
 */
export async function getDistributorHistoryCursor(
  organizationId: string,
  query: HistoryCursorQuery
): Promise<ApiResponse<CursorPaginatedHistory>> {
  const distributorActionTypes: HistoryActionType[] = ['RECEIVED', 'SHIPPED', 'RECALLED'];

  const filteredQuery = {
    ...query,
    actionTypes:
      query.actionTypes?.length
        ? query.actionTypes.filter((t) =>
            distributorActionTypes.includes(t as HistoryActionType)
          )
        : distributorActionTypes,
  };

  return getTransactionHistoryCursor(organizationId, filteredQuery);
}

/**
 * 병원 거래이력 조회 (커서 기반)
 * - 입고(RECEIVED), 시술(TREATED), 회수(RECALLED)
 */
export async function getHospitalHistoryCursor(
  organizationId: string,
  query: HistoryCursorQuery
): Promise<ApiResponse<CursorPaginatedHistory>> {
  const hospitalActionTypes: HistoryActionType[] = ['RECEIVED', 'TREATED', 'RECALLED'];

  const filteredQuery = {
    ...query,
    actionTypes:
      query.actionTypes?.length
        ? query.actionTypes.filter((t) =>
            hospitalActionTypes.includes(t as HistoryActionType)
          )
        : hospitalActionTypes,
  };

  return getTransactionHistoryCursor(organizationId, filteredQuery);
}

// ============================================================================
// 레거시 함수 (하위 호환성) - deprecated
// ============================================================================

/**
 * @deprecated common.service.ts의 getOrganizationName 사용
 */
export { getOrganizationName, maskPhoneNumber, createOrganizationNameCache };
