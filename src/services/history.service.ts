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
 */

import { createClient } from '@/lib/supabase/server';
import type {
  ApiResponse,
  PaginatedResponse,
  HistoryActionType,
} from '@/types/api.types';
import type { TransactionHistoryQueryData } from '@/lib/validations/history';

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
  id: string; // 첫 번째 이력 ID (그룹 대표)
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
  }[];

  totalQuantity: number;
}

// ============================================================================
// 상수
// ============================================================================

const ACTION_TYPE_LABELS: Record<HistoryActionType, string> = {
  PRODUCED: '생산',
  SHIPPED: '출고',
  RECEIVED: '입고',
  TREATED: '시술',
  RECALLED: '회수',
  DISPOSED: '폐기',
};

// ============================================================================
// 내부 유틸리티
// ============================================================================

/**
 * 조직 이름 조회 (캐시 활용)
 */
async function getOrganizationName(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  cache: Map<string, string>
): Promise<string> {
  if (cache.has(orgId)) {
    return cache.get(orgId)!;
  }

  const { data } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single();

  const name = data?.name || '알 수 없음';
  cache.set(orgId, name);
  return name;
}

/**
 * 환자 정보 (전화번호 마스킹)
 */
const MIN_PHONE_LENGTH = 4;

function maskPhoneNumber(phone: string): string {
  if (phone.length < MIN_PHONE_LENGTH) {
    return '****';
  }
  return `***-****-${phone.slice(-MIN_PHONE_LENGTH)}`;
}

// ============================================================================
// 거래이력 조회
// ============================================================================

/**
 * 조직의 거래이력 조회
 *
 * @param organizationId 조직 ID
 * @param query 조회 옵션
 * @returns 페이지네이션된 거래이력 목록
 */
// 페이지네이션 상수
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const GROUPING_MULTIPLIER = 10;
const GROUP_ESTIMATION_DIVISOR = 5;
const TIME_GROUP_LENGTH = 16; // YYYY-MM-DDTHH:mm

export async function getTransactionHistory(
  organizationId: string,
  query: TransactionHistoryQueryData
): Promise<ApiResponse<PaginatedResponse<TransactionHistorySummary>>> {
  const supabase = await createClient();
  const { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE, startDate, endDate, actionTypes, isRecall, productId } = query;
  const offset = (page - DEFAULT_PAGE) * pageSize;

  // 조직 이름 캐시
  const orgNameCache = new Map<string, string>();

  // 1. 기본 쿼리 - 내가 관련된 이력 조회
  let queryBuilder = supabase
    .from('histories')
    .select(
      `
      id,
      action_type,
      from_owner_type,
      from_owner_id,
      to_owner_type,
      to_owner_id,
      is_recall,
      recall_reason,
      created_at,
      virtual_code:virtual_codes!inner(
        id,
        code,
        lot:lots!inner(
          id,
          lot_number,
          product:products!inner(
            id,
            name
          )
        )
      )
    `,
      { count: 'exact' }
    )
    .or(`from_owner_id.eq.${organizationId},to_owner_id.eq.${organizationId}`)
    .order('created_at', { ascending: false });

  // 2. 필터 적용
  if (startDate) {
    queryBuilder = queryBuilder.gte('created_at', startDate);
  }
  if (endDate) {
    queryBuilder = queryBuilder.lte('created_at', endDate);
  }
  if (actionTypes && actionTypes.length > 0) {
    queryBuilder = queryBuilder.in('action_type', actionTypes);
  }
  if (isRecall !== undefined) {
    queryBuilder = queryBuilder.eq('is_recall', isRecall);
  }

  // 3. 제품 필터 (서브쿼리 필요)
  // 제품 ID 필터는 클라이언트 측에서 처리 (복잡한 조인 쿼리 회피)

  const { data: histories, count, error } = await queryBuilder.range(
    offset,
    offset + pageSize * GROUPING_MULTIPLIER - 1 // 그룹화를 위해 더 많이 가져옴
  );

  if (error) {
    console.error('거래이력 조회 실패:', error);
    return {
      success: false,
      error: {
        code: 'QUERY_ERROR',
        message: error.message,
      },
    };
  }

  // 4. 결과 그룹화 (같은 시간, 같은 액션, 같은 당사자)
  const groupedHistories = new Map<string, TransactionHistorySummary>();

  for (const history of histories || []) {
    const virtualCode = history.virtual_code as {
      id: string;
      code: string;
      lot: {
        id: string;
        lot_number: string;
        product: { id: string; name: string };
      };
    };

    // 제품 필터 적용
    if (productId && virtualCode.lot.product.id !== productId) {
      continue;
    }

    // 그룹 키 생성 (같은 시간대, 같은 액션, 같은 당사자)
    const createdAtMinute = history.created_at.slice(0, TIME_GROUP_LENGTH); // YYYY-MM-DDTHH:mm
    const groupKey = `${createdAtMinute}_${history.action_type}_${history.from_owner_id}_${history.to_owner_id}`;

    if (groupedHistories.has(groupKey)) {
      // 기존 그룹에 추가
      const existing = groupedHistories.get(groupKey)!;
      const productId = virtualCode.lot.product.id;
      const existingItem = existing.items.find((i) => i.productId === productId);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        existing.items.push({
          productId,
          productName: virtualCode.lot.product.name,
          quantity: 1,
        });
      }
      existing.totalQuantity += 1;
    } else {
      // 새 그룹 생성
      const fromOwner = history.from_owner_id
        ? {
            type: history.from_owner_type as 'ORGANIZATION' | 'PATIENT',
            id: history.from_owner_id,
            name:
              history.from_owner_type === 'PATIENT'
                ? maskPhoneNumber(history.from_owner_id)
                : await getOrganizationName(supabase, history.from_owner_id, orgNameCache),
          }
        : undefined;

      const toOwner = history.to_owner_id
        ? {
            type: history.to_owner_type as 'ORGANIZATION' | 'PATIENT',
            id: history.to_owner_id,
            name:
              history.to_owner_type === 'PATIENT'
                ? maskPhoneNumber(history.to_owner_id)
                : await getOrganizationName(supabase, history.to_owner_id, orgNameCache),
          }
        : undefined;

      groupedHistories.set(groupKey, {
        id: history.id,
        actionType: history.action_type as HistoryActionType,
        actionTypeLabel: ACTION_TYPE_LABELS[history.action_type as HistoryActionType],
        createdAt: history.created_at,
        isRecall: history.is_recall ?? false,
        recallReason: history.recall_reason ?? undefined,
        fromOwner,
        toOwner,
        items: [
          {
            productId: virtualCode.lot.product.id,
            productName: virtualCode.lot.product.name,
            quantity: 1,
          },
        ],
        totalQuantity: 1,
      });
    }
  }

  // 5. 페이지네이션 적용
  const allSummaries = Array.from(groupedHistories.values());
  const paginatedSummaries = allSummaries.slice(0, pageSize);
  const total = count ?? allSummaries.length;

  return {
    success: true,
    data: {
      items: paginatedSummaries,
      meta: {
        page,
        pageSize,
        total: Math.ceil(total / GROUP_ESTIMATION_DIVISOR), // 대략적인 그룹 수 추정
        totalPages: Math.ceil(total / (pageSize * GROUP_ESTIMATION_DIVISOR)),
        hasMore: allSummaries.length > pageSize,
      },
    },
  };
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
        ? query.actionTypes.filter((t) => manufacturerActionTypes.includes(t as HistoryActionType))
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
        ? query.actionTypes.filter((t) => distributorActionTypes.includes(t as HistoryActionType))
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
        ? query.actionTypes.filter((t) => hospitalActionTypes.includes(t as HistoryActionType))
        : hospitalActionTypes,
  };

  return getTransactionHistory(organizationId, filteredQuery as TransactionHistoryQueryData);
}
