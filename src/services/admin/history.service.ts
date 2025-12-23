/**
 * 관리자 서비스 - 이력 조회
 * 전체 가상 코드 이력 조회 및 분석
 */

import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import {
  getOrganizationName,
  maskPhoneNumber,
  createOrganizationNameCache,
  createErrorResponse,
  createSuccessResponse,
} from '../common.service';
import type {
  ApiResponse,
  PaginatedResponse,
  AdminHistoryItem,
  AdminHistoryDetail,
  HistoryActionType,
  OrganizationType,
  VirtualCodeStatus,
} from '@/types/api.types';
import type { AdminHistoryQueryData } from '@/lib/validations/admin';
import { CONFIG } from '@/constants/config';

const logger = createLogger('admin.history.service');

// ============================================================================
// 상수
// ============================================================================

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = CONFIG.PAGINATION.DEFAULT_PAGE_SIZE;

// ============================================================================
// 전체 이력 조회
// ============================================================================

/**
 * 전체 가상 코드 이력 조회 (관리자 전용)
 *
 * @param query 조회 옵션 (페이지네이션, 필터)
 * @returns 페이지네이션된 가상 코드 이력
 */
export async function getAdminHistory(
  query: AdminHistoryQueryData
): Promise<ApiResponse<PaginatedResponse<AdminHistoryItem>>> {
  const supabase = await createClient();
  const {
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
    startDate,
    endDate,
    currentStatus,
    currentOwnerId,
    originalProducerId,
    productId,
    includeRecalled = true,
  } = query;
  const offset = (page - DEFAULT_PAGE) * pageSize;

  // 조직 이름 캐시 (공통 서비스 사용)
  const orgNameCache = createOrganizationNameCache();

  // 기본 쿼리 - 가상 코드 기준 조회
  let queryBuilder = supabase
    .from('virtual_codes')
    .select(
      `
      id,
      code,
      status,
      owner_type,
      owner_id,
      created_at,
      lot:lots!inner(
        id,
        lot_number,
        manufacture_date,
        expiry_date,
        product:products!inner(
          id,
          name,
          organization_id
        )
      )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });

  // 현재 상태 필터
  if (currentStatus) {
    queryBuilder = queryBuilder.eq('status', currentStatus);
  }

  // 현재 소유자 필터
  if (currentOwnerId) {
    queryBuilder = queryBuilder.eq('owner_id', currentOwnerId);
  }

  // 최초 생산자 필터
  if (originalProducerId) {
    queryBuilder = queryBuilder.eq('lot.product.organization_id', originalProducerId);
  }

  // 제품 종류 필터
  if (productId) {
    queryBuilder = queryBuilder.eq('lot.product.id', productId);
  }

  // 기간 필터
  if (startDate) {
    queryBuilder = queryBuilder.gte('created_at', startDate);
  }
  if (endDate) {
    queryBuilder = queryBuilder.lte('created_at', endDate);
  }

  const { data: virtualCodes, count, error } = await queryBuilder.range(
    offset,
    offset + pageSize - 1
  );

  if (error) {
    logger.error('전체 이력 조회 실패', error);
    return createErrorResponse('QUERY_ERROR', error.message);
  }

  // N+1 최적화: 한 번에 모든 이력 조회
  const codeIds = (virtualCodes || []).map((vc) => vc.id);
  const { data: allHistories } = await supabase
    .from('histories')
    .select('*')
    .in('virtual_code_id', codeIds)
    .order('created_at', { ascending: false });

  // 가상 코드별 이력 그룹화
  const historiesByCodeId = new Map<string, typeof allHistories>();
  for (const h of allHistories || []) {
    const existing = historiesByCodeId.get(h.virtual_code_id) || [];
    existing.push(h);
    historiesByCodeId.set(h.virtual_code_id, existing);
  }

  // N+1 최적화: 현재 소유자(조직) 정보 배치 조회
  const ownerOrgIds = (virtualCodes || [])
    .filter((vc) => vc.owner_id && vc.owner_type !== 'PATIENT')
    .map((vc) => vc.owner_id);
  const uniqueOwnerOrgIds = [...new Set(ownerOrgIds)];

  const { data: ownerOrgs } = await supabase
    .from('organizations')
    .select('id, name, type')
    .in('id', uniqueOwnerOrgIds);

  const ownerOrgMap = new Map<string, { id: string; name: string; type: string }>();
  for (const org of ownerOrgs || []) {
    ownerOrgMap.set(org.id, org);
  }

  // 각 가상 코드의 이력 정보 처리 (DB 쿼리 없이 메모리에서 처리)
  const historyItemsWithNull = await Promise.all(
    (virtualCodes || []).map(async (vc): Promise<AdminHistoryItem | null> => {
      const lot = vc.lot as {
        id: string;
        lot_number: string;
        manufacture_date: string;
        expiry_date: string;
        product: {
          id: string;
          name: string;
          organization_id: string;
        };
      };

      // 이력 조회 (메모리에서)
      const histories = historiesByCodeId.get(vc.id) || [];

      // 회수 이력 존재 여부
      const isRecalled = histories.some((h) => h.is_recall) || false;

      // 회수 포함하지 않는 경우 필터
      if (!includeRecalled && isRecalled) {
        return null;
      }

      // 이력 상세 정보 변환 (조직 이름은 캐시 활용)
      const historyDetails: AdminHistoryDetail[] = await Promise.all(
        histories.map(async (h) => {
          const fromName =
            h.from_owner_type === 'PATIENT'
              ? maskPhoneNumber(h.from_owner_id || '')
              : h.from_owner_id
                ? await getOrganizationName(supabase, h.from_owner_id, orgNameCache)
                : '-';

          const toName =
            h.to_owner_type === 'PATIENT'
              ? maskPhoneNumber(h.to_owner_id || '')
              : h.to_owner_id
                ? await getOrganizationName(supabase, h.to_owner_id, orgNameCache)
                : '-';

          return {
            id: h.id,
            actionType: h.action_type as HistoryActionType,
            fromOwner: fromName,
            toOwner: toName,
            createdAt: h.created_at,
            isRecall: h.is_recall ?? false,
            recallReason: h.recall_reason ?? undefined,
          };
        })
      );

      // 현재 소유자 정보 (메모리에서)
      let currentOwner: AdminHistoryItem['currentOwner'] = null;
      if (vc.owner_id) {
        if (vc.owner_type === 'PATIENT') {
          currentOwner = {
            id: vc.owner_id,
            name: maskPhoneNumber(vc.owner_id),
            type: 'PATIENT',
          };
        } else {
          const ownerOrg = ownerOrgMap.get(vc.owner_id);
          if (ownerOrg) {
            currentOwner = {
              id: ownerOrg.id,
              name: ownerOrg.name,
              type: ownerOrg.type as OrganizationType,
            };
          }
        }
      }

      // 최초 생산자 정보 (캐시 활용)
      const producerName = await getOrganizationName(
        supabase,
        lot.product.organization_id,
        orgNameCache
      );

      return {
        id: vc.id,
        virtualCode: vc.code,
        productionDate: lot.manufacture_date,
        currentStatus: vc.status as VirtualCodeStatus,
        currentOwner,
        originalProducer: {
          id: lot.product.organization_id,
          name: producerName,
        },
        productName: lot.product.name,
        lotNumber: lot.lot_number,
        expiryDate: lot.expiry_date,
        historyCount: histories.length,
        isRecalled,
        histories: historyDetails,
      };
    })
  );

  // null 필터링
  const filteredItems = historyItemsWithNull.filter(
    (item): item is AdminHistoryItem => item !== null
  );

  const total = count || 0;

  return createSuccessResponse({
    items: filteredItems,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasMore: offset + pageSize < total,
    },
  });
}
