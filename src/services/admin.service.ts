/**
 * 관리자 서비스
 * 조직 관리, 전체 이력, 회수 모니터링 비즈니스 로직
 *
 * SSOT 원칙:
 * - 조직 이름 조회, 마스킹 등 공통 유틸리티는 common.service.ts 사용
 */

import { createClient } from '@/lib/supabase/server';
import {
  getOrganizationName,
  maskPhoneNumber,
  createOrganizationNameCache,
  parseRpcArray,
  createErrorResponse,
  createSuccessResponse,
  createNotFoundResponse,
} from './common.service';
import type {
  ApiResponse,
  PaginatedResponse,
  Organization,
  OrganizationWithStats,
  OrganizationDetail,
  AdminHistoryItem,
  AdminHistoryDetail,
  RecallHistoryItem,
  HistoryActionType,
  OrganizationType,
  VirtualCodeStatus,
  AdminEventSummary,
  AdminEventLotSummary,
  AdminEventSampleCode,
  LotCodeItem,
  LotCodesPaginatedResponse,
  InactiveProductUsageLog,
  ProductDeactivationReason,
} from '@/types/api.types';
import type {
  AdminOrganizationQueryData,
  AdminHistoryQueryData,
  AdminRecallQueryData,
  AdminEventSummaryQueryData,
} from '@/lib/validations/admin';
import { getActionTypeLabel } from './common.service';
import { ORGANIZATION_STATUSES } from '@/constants/organization';
import { CONFIG } from '@/constants/config';
import {
  OrgStatusCountRowSchema,
  OrgCodeCountRowSchema,
  AllRecallsRowSchema,
  AllRecallsCursorRowSchema,
  AdminEventSummaryRowSchema,
} from '@/lib/validations/rpc-schemas';
import type { CursorPaginatedResponse } from '@/types/api.types';

// ============================================================================
// 상수
// ============================================================================

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = CONFIG.PAGINATION.DEFAULT_PAGE_SIZE;

// ============================================================================
// 조직 관리
// ============================================================================

/**
 * 조직 상태별 통계 조회 (관리자 전용)
 * 활성, 비활성, 승인 대기, 삭제된 조직 수 반환
 *
 * 최적화: SQL GROUP BY를 사용하여 DB에서 직접 집계
 */
export async function getOrganizationStatusCounts(): Promise<
  ApiResponse<{
    total: number;
    active: number;
    inactive: number;
    pendingApproval: number;
    deleted: number;
  }>
> {
  const supabase = await createClient();

  // SQL GROUP BY를 사용하여 상태별 카운트 집계
  const { data, error } = await supabase.rpc('get_organization_status_counts');

  if (error) {
    console.error('조직 상태 통계 조회 실패:', error);
    return createErrorResponse('QUERY_ERROR', error.message);
  }

  // Zod 검증으로 결과 파싱
  const parsed = parseRpcArray(OrgStatusCountRowSchema, data, 'get_organization_status_counts');
  if (!parsed.success) {
    console.error('get_organization_status_counts 검증 실패:', parsed.error);
    return createErrorResponse('VALIDATION_ERROR', parsed.error);
  }

  // RPC 결과를 카운트 객체로 변환
  const counts = {
    total: 0,
    active: 0,
    inactive: 0,
    pendingApproval: 0,
    deleted: 0,
  };

  for (const row of parsed.data) {
    const count = Number(row.count);
    counts.total += count;

    switch (row.status) {
      case 'ACTIVE':
        counts.active = count;
        break;
      case 'INACTIVE':
        counts.inactive = count;
        break;
      case 'PENDING_APPROVAL':
        counts.pendingApproval = count;
        break;
      case 'DELETED':
        counts.deleted = count;
        break;
    }
  }

  return createSuccessResponse(counts);
}

/**
 * 전체 조직 목록 조회 (관리자 전용)
 *
 * @param query 조회 옵션 (페이지네이션, 필터)
 * @returns 페이지네이션된 조직 목록 (통계 포함)
 */
export async function getOrganizations(
  query: AdminOrganizationQueryData
): Promise<ApiResponse<PaginatedResponse<OrganizationWithStats>>> {
  const supabase = await createClient();
  const { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE, status, type, search } = query;
  const offset = (page - DEFAULT_PAGE) * pageSize;

  // 기본 쿼리
  let queryBuilder = supabase
    .from('organizations')
    .select('*', { count: 'exact' })
    .neq('type', 'ADMIN') // 관리자 제외
    .order('created_at', { ascending: false });

  // 상태 필터
  if (status) {
    queryBuilder = queryBuilder.eq('status', status);
  }

  // 타입 필터
  if (type) {
    queryBuilder = queryBuilder.eq('type', type);
  }

  // 검색 필터 (조직명, 이메일)
  if (search) {
    queryBuilder = queryBuilder.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data: organizations, count, error } = await queryBuilder.range(
    offset,
    offset + pageSize - 1
  );

  if (error) {
    console.error('조직 목록 조회 실패:', error);
    return createErrorResponse('QUERY_ERROR', error.message);
  }

  // 모든 조직의 보유 코드 수를 한 번에 조회 (N+1 최적화)
  // DB 함수 get_organization_code_counts 사용
  const countByOrgId = new Map<string, number>();

  if (organizations && organizations.length > 0) {
    const orgIds = organizations.map((org) => org.id);

    const { data: countResults, error: countError } = await supabase.rpc(
      'get_organization_code_counts',
      { p_org_ids: orgIds }
    );

    if (!countError && countResults) {
      // Zod 검증으로 결과 파싱
      const parsed = parseRpcArray(OrgCodeCountRowSchema, countResults, 'get_organization_code_counts');
      if (parsed.success) {
        for (const row of parsed.data) {
          countByOrgId.set(row.org_id, Number(row.code_count));
        }
      } else {
        console.error('get_organization_code_counts 검증 실패:', parsed.error);
      }
    } else if (countError) {
      console.error('조직 코드 수 bulk 조회 실패:', countError);
    }
  }

  const organizationsWithStats: OrganizationWithStats[] = (organizations || []).map((org) => ({
    ...org,
    virtualCodeCount: countByOrgId.get(org.id) || 0,
  }));

  const total = count || 0;

  return createSuccessResponse({
    items: organizationsWithStats,
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
 * 승인 대기 조직 목록 조회
 *
 * @param query 조회 옵션
 * @returns 페이지네이션된 승인 대기 조직 목록
 */
export async function getPendingOrganizations(
  query: Pick<AdminOrganizationQueryData, 'page' | 'pageSize'>
): Promise<ApiResponse<PaginatedResponse<Organization>>> {
  const supabase = await createClient();
  const { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE } = query;
  const offset = (page - DEFAULT_PAGE) * pageSize;

  const { data, count, error } = await supabase
    .from('organizations')
    .select('*', { count: 'exact' })
    .eq('status', ORGANIZATION_STATUSES.PENDING_APPROVAL)
    .neq('type', 'ADMIN')
    .order('created_at', { ascending: true }) // 먼저 신청한 순
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error('승인 대기 조직 조회 실패:', error);
    return createErrorResponse('QUERY_ERROR', error.message);
  }

  const total = count || 0;

  return createSuccessResponse({
    items: data || [],
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
 * 조직 상세 조회
 *
 * @param organizationId 조직 ID
 * @returns 조직 상세 정보
 */
export async function getOrganizationDetail(
  organizationId: string
): Promise<ApiResponse<OrganizationDetail>> {
  const supabase = await createClient();

  const { data: organization, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single();

  if (error || !organization) {
    return createNotFoundResponse('조직을 찾을 수 없습니다.');
  }

  // 제조사인 경우 설정 정보도 조회
  let manufacturerSettings;
  if (organization.type === 'MANUFACTURER') {
    const { data: settings } = await supabase
      .from('manufacturer_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single();
    manufacturerSettings = settings ?? undefined;
  }

  return createSuccessResponse({
    ...organization,
    manufacturerSettings,
  });
}

/**
 * 조직 상태 변경 (승인/비활성화/삭제)
 *
 * @param organizationId 조직 ID
 * @param status 변경할 상태
 * @returns 성공 여부
 */
export async function updateOrganizationStatus(
  organizationId: string,
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED'
): Promise<ApiResponse<void>> {
  const supabase = await createClient();

  // 조직 존재 여부 확인
  const { data: organization, error: fetchError } = await supabase
    .from('organizations')
    .select('id, type')
    .eq('id', organizationId)
    .single();

  if (fetchError || !organization) {
    return createNotFoundResponse('조직을 찾을 수 없습니다.');
  }

  // 관리자 조직은 상태 변경 불가
  if (organization.type === 'ADMIN') {
    return createErrorResponse('FORBIDDEN', '관리자 조직의 상태는 변경할 수 없습니다.');
  }

  const { error } = await supabase
    .from('organizations')
    .update({ status })
    .eq('id', organizationId);

  if (error) {
    console.error('조직 상태 변경 실패:', error);
    return createErrorResponse('UPDATE_ERROR', error.message);
  }

  return createSuccessResponse(undefined);
}

// ============================================================================
// 전체 이력 조회
// ============================================================================

/**
 * 전체 이력 조회 (관리자 전용)
 * 가상 코드별로 그룹화된 이력 정보 조회
 *
 * @param query 조회 옵션
 * @returns 페이지네이션된 전체 이력
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
    console.error('전체 이력 조회 실패:', error);
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

    if (startDate) {
      shipmentQuery = shipmentQuery.gte('recall_date', startDate);
    }
    if (endDate) {
      shipmentQuery = shipmentQuery.lte('recall_date', endDate);
    }

    const { data: shipments } = await shipmentQuery;

    // N+1 최적화: 모든 출고 뭉치의 상세 정보를 한 번에 조회
    const shipmentBatchIds = (shipments || []).map((s) => s.id);
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
    for (const detail of allShipmentDetails || []) {
      const existing = detailsByBatchId.get(detail.shipment_batch_id) || [];
      existing.push(detail);
      detailsByBatchId.set(detail.shipment_batch_id, existing);
    }

    // 각 출고 회수 처리 (DB 쿼리 없이 메모리에서)
    for (const shipment of shipments || []) {
      const details = detailsByBatchId.get(shipment.id) || [];

      // 제품별 수량 집계
      const productCounts = new Map<string, number>();
      for (const detail of details) {
        const productName = (
          detail.virtual_code as {
            lot: { product: { name: string } };
          }
        ).lot.product.name;
        productCounts.set(productName, (productCounts.get(productName) || 0) + 1);
      }

      const fromOrg = shipment.from_org as { id: string; name: string; type: OrganizationType };
      const toOrg = shipment.to_org as { id: string; name: string; type: OrganizationType };

      recallItems.push({
        id: shipment.id,
        type: 'shipment',
        recallDate: shipment.recall_date || '',
        recallReason: shipment.recall_reason || '',
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

    if (startDate) {
      treatmentRecallQuery = treatmentRecallQuery.gte('created_at', startDate);
    }
    if (endDate) {
      treatmentRecallQuery = treatmentRecallQuery.lte('created_at', endDate);
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

    for (const recall of treatmentRecalls || []) {
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
          (existing.productCounts.get(productName) || 0) + 1
        );
      } else {
        const productCounts = new Map<string, number>();
        productCounts.set(productName, 1);
        groupedRecalls.set(key, {
          id: recall.id,
          recallDate: recall.created_at,
          recallReason: recall.recall_reason || '',
          fromOrganizationId: recall.to_owner_id || '',
          patientPhone: recall.from_owner_id || '',
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
    for (const org of orgs || []) {
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

  // RPC 파라미터
  const rpcParams = {
    p_start_date: startDate ? `${startDate}T00:00:00Z` : undefined,
    p_end_date: endDate ? `${endDate}T23:59:59Z` : undefined,
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
    console.error('회수 이력 조회 실패, 기존 함수로 폴백:', dataError);
    // 폴백: 기존 함수 사용
    return getRecallHistory(query);
  }

  if (countError) {
    console.error('회수 이력 카운트 조회 실패:', countError);
  }

  // Zod 검증으로 결과 파싱
  const parsed = parseRpcArray(AllRecallsRowSchema, recalls, 'get_all_recalls');
  if (!parsed.success) {
    console.error('get_all_recalls 검증 실패:', parsed.error);
    return createErrorResponse('VALIDATION_ERROR', parsed.error);
  }

  // DB 함수 결과를 RecallHistoryItem 형태로 변환
  const items: RecallHistoryItem[] = parsed.data.map((row) => ({
    id: row.recall_id,
    type: row.recall_type as 'shipment' | 'treatment',
    recallDate: row.recall_date,
    recallReason: row.recall_reason || '',
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

  const totalCount = Number(total) || 0;

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

  const { data, error } = await supabase.rpc('get_all_recalls_cursor', {
    p_start_date: startDate ? `${startDate}T00:00:00Z` : undefined,
    p_end_date: endDate ? `${endDate}T23:59:59Z` : undefined,
    p_type: type,
    p_limit: limit,
    p_cursor_time: cursorTime || undefined,
    p_cursor_key: cursorKey || undefined,
  });

  if (error) {
    console.error('회수 이력 커서 조회 실패:', error);
    return createErrorResponse('QUERY_ERROR', error.message);
  }

  // Zod 검증
  const parsed = parseRpcArray(AllRecallsCursorRowSchema, data, 'get_all_recalls_cursor');
  if (!parsed.success) {
    console.error('get_all_recalls_cursor 검증 실패:', parsed.error);
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
    recallReason: row.recall_reason || '',
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

// ============================================================================
// 조직 선택 목록 (드롭다운용)
// ============================================================================

/**
 * 모든 조직 목록 조회 (선택용)
 * 관리자 제외, 활성 상태만
 */
export async function getAllOrganizationsForSelect(): Promise<
  ApiResponse<{ id: string; name: string; type: OrganizationType }[]>
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, type')
    .eq('status', 'ACTIVE')
    .neq('type', 'ADMIN')
    .order('name');

  if (error) {
    return createErrorResponse('QUERY_ERROR', error.message);
  }

  return createSuccessResponse(
    (data || []).map((org) => ({
      id: org.id,
      name: org.name,
      type: org.type as OrganizationType,
    }))
  );
}

/**
 * 조직 검색 (Lazy Load용)
 * 검색어 기반으로 조직을 검색합니다.
 */
export async function searchOrganizations(
  query: string,
  limit: number = 20
): Promise<ApiResponse<{ id: string; name: string; type: OrganizationType }[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, type')
    .eq('status', 'ACTIVE')
    .neq('type', 'ADMIN')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(limit);

  if (error) {
    return createErrorResponse('QUERY_ERROR', error.message);
  }

  return createSuccessResponse(
    (data || []).map((org) => ({
      id: org.id,
      name: org.name,
      type: org.type as OrganizationType,
    }))
  );
}

/**
 * 제품 검색 (Lazy Load용)
 * 검색어 기반으로 제품을 검색합니다 (model_name 또는 name).
 */
export async function searchProducts(
  query: string,
  limit: number = 20
): Promise<ApiResponse<{ id: string; name: string; modelName: string; manufacturerName: string }[]>> {
  const supabase = await createClient();

  // model_name 또는 name으로 검색
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id,
      name,
      model_name,
      organization:organizations!inner(name)
    `
    )
    .eq('is_active', true)
    .or(`model_name.ilike.%${query}%,name.ilike.%${query}%`)
    .order('model_name')
    .limit(limit);

  if (error) {
    return createErrorResponse('QUERY_ERROR', error.message);
  }

  return createSuccessResponse(
    (data || []).map((product) => ({
      id: product.id,
      name: product.name,
      modelName: product.model_name,
      manufacturerName: (product.organization as { name: string }).name,
    }))
  );
}

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

  const total = count || 0;

  const logs: InactiveProductUsageLog[] = (data || []).map((row) => ({
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
    .select('*', { count: 'exact', head: true })
    .is('acknowledged_at', null);

  if (error) {
    return createErrorResponse('QUERY_ERROR', '카운트 조회에 실패했습니다.');
  }

  return createSuccessResponse(count || 0);
}

/**
 * 모든 제품 목록 조회 (선택용)
 * model_name을 포함하여 동일 제품명의 다른 모델을 구분
 */
export async function getAllProductsForSelect(): Promise<
  ApiResponse<{ id: string; name: string; modelName: string; manufacturerName: string }[]>
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id,
      name,
      model_name,
      organization:organizations!inner(name)
    `
    )
    .eq('is_active', true)
    .order('model_name');

  if (error) {
    return createErrorResponse('QUERY_ERROR', error.message);
  }

  return createSuccessResponse(
    (data || []).map((product) => ({
      id: product.id,
      name: product.name,
      modelName: product.model_name,
      manufacturerName: (product.organization as { name: string }).name,
    }))
  );
}

// ============================================================================
// 이벤트 단위 이력 요약 (새 이력 조회 방식)
// ============================================================================

/**
 * 관리자 이벤트 요약 조회
 * 시간+액션+출발지+도착지로 그룹화된 이벤트 단위 조회
 *
 * @param query 조회 옵션 (필터, 페이지네이션)
 * @returns 페이지네이션된 이벤트 요약 목록
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

  // 공통 RPC 파라미터
  const rpcParams = {
    p_start_date: startDate ? `${startDate}T00:00:00Z` : undefined,
    p_end_date: endDate ? `${endDate}T23:59:59Z` : undefined,
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
    console.error('이벤트 요약 조회 실패:', summaryError);
    return createErrorResponse('QUERY_ERROR', summaryError.message || '이벤트 요약 조회에 실패했습니다.');
  }

  if (countError) {
    console.error('이벤트 요약 카운트 조회 실패:', countError);
  }

  // Zod 검증으로 결과 파싱
  const parsed = parseRpcArray(AdminEventSummaryRowSchema, summaryData, 'get_admin_event_summary');
  if (!parsed.success) {
    console.error('get_admin_event_summary 검증 실패:', parsed.error);
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

    for (const org of orgData || []) {
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
    const lotSummaries: AdminEventLotSummary[] = (row.lot_summaries || []).map((lot) => ({
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
      recallReason: row.recall_reason || undefined,
      totalQuantity: Number(row.total_quantity),
      lotSummaries,
      sampleCodeIds: row.sample_code_ids || [],
    };
  });

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
    console.error('샘플 코드 조회 실패:', error);
    return createErrorResponse('QUERY_ERROR', error.message);
  }

  // 소유자 이름 조회 (조직만)
  const ownerIds = (data || [])
    .filter((vc) => vc.owner_type === 'ORGANIZATION')
    .map((vc) => vc.owner_id);

  const orgNameMap = new Map<string, string>();
  if (ownerIds.length > 0) {
    const { data: orgData } = await supabase
      .from('organizations')
      .select('id, name')
      .in('id', [...new Set(ownerIds)]);

    for (const org of orgData || []) {
      orgNameMap.set(org.id, org.name);
    }
  }

  const sampleCodes: AdminEventSampleCode[] = (data || []).map((vc) => {
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
    console.error('이벤트 코드 조회 실패:', error);
    return createErrorResponse('QUERY_ERROR', error.message || '코드 조회에 실패했습니다.');
  }

  // 조직 이름 일괄 조회
  const orgIds = new Set<string>();
  for (const row of data || []) {
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

    for (const org of orgData || []) {
      orgNameMap.set(org.id, org.name);
    }
  }

  // 원본 순서 유지를 위한 맵 생성
  const dataMap = new Map(data?.map((row) => [row.id, row]) || []);

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

// ============================================================================
// 커서 기반 페이지네이션 (성능 최적화)
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

  // RPC 파라미터 구성 (undefined는 Supabase RPC에서 생략됨)
  const rpcParams = {
    p_start_date: startDate ? `${startDate}T00:00:00Z` : undefined,
    p_end_date: endDate ? `${endDate}T23:59:59Z` : undefined,
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
    console.error('이벤트 요약 커서 조회 실패:', error);
    return createErrorResponse('QUERY_ERROR', error.message || '이벤트 요약 조회에 실패했습니다.');
  }

  // Zod 검증으로 결과 파싱 (런타임 타입 안전성 확보)
  const { AdminEventSummaryCursorRowSchema } = await import('@/lib/validations/rpc-schemas');
  const parsed = parseRpcArray(AdminEventSummaryCursorRowSchema, data, 'get_admin_event_summary_cursor');
  if (!parsed.success) {
    console.error('get_admin_event_summary_cursor 검증 실패:', parsed.error);
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

    for (const org of orgData || []) {
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

    const lotSummaries: AdminEventLotSummary[] = (row.lot_summaries || []).map((lot) => ({
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
      recallReason: row.recall_reason || undefined,
      totalQuantity: Number(row.total_quantity),
      lotSummaries,
      sampleCodeIds: row.sample_code_ids || [],
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
