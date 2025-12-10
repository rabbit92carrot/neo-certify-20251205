/**
 * 관리자 서비스
 * 조직 관리, 전체 이력, 회수 모니터링 비즈니스 로직
 */

import { createClient } from '@/lib/supabase/server';
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
} from '@/types/api.types';
import type {
  AdminOrganizationQueryData,
  AdminHistoryQueryData,
  AdminRecallQueryData,
} from '@/lib/validations/admin';
import { ORGANIZATION_STATUSES } from '@/constants/organization';

// ============================================================================
// 상수
// ============================================================================

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;


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
// 조직 관리
// ============================================================================

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
    return {
      success: false,
      error: {
        code: 'QUERY_ERROR',
        message: error.message,
      },
    };
  }

  // 각 조직의 가상 코드 수 조회
  const organizationsWithStats: OrganizationWithStats[] = await Promise.all(
    (organizations || []).map(async (org) => {
      const { count: codeCount } = await supabase
        .from('virtual_codes')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', org.id);

      return {
        ...org,
        virtualCodeCount: codeCount || 0,
      };
    })
  );

  const total = count || 0;

  return {
    success: true,
    data: {
      items: organizationsWithStats,
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
    return {
      success: false,
      error: {
        code: 'QUERY_ERROR',
        message: error.message,
      },
    };
  }

  const total = count || 0;

  return {
    success: true,
    data: {
      items: data || [],
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
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: '조직을 찾을 수 없습니다.',
      },
    };
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

  return {
    success: true,
    data: {
      ...organization,
      manufacturerSettings,
    },
  };
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
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: '조직을 찾을 수 없습니다.',
      },
    };
  }

  // 관리자 조직은 상태 변경 불가
  if (organization.type === 'ADMIN') {
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: '관리자 조직의 상태는 변경할 수 없습니다.',
      },
    };
  }

  const { error } = await supabase
    .from('organizations')
    .update({ status })
    .eq('id', organizationId);

  if (error) {
    console.error('조직 상태 변경 실패:', error);
    return {
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: error.message,
      },
    };
  }

  return { success: true };
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

  // 조직 이름 캐시
  const orgNameCache = new Map<string, string>();

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
    return {
      success: false,
      error: {
        code: 'QUERY_ERROR',
        message: error.message,
      },
    };
  }

  // 각 가상 코드의 이력 정보 조회
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

      // 이력 조회
      const { data: histories } = await supabase
        .from('histories')
        .select('*')
        .eq('virtual_code_id', vc.id)
        .order('created_at', { ascending: false });

      // 회수 이력 존재 여부
      const isRecalled = histories?.some((h) => h.is_recall) || false;

      // 회수 포함하지 않는 경우 필터
      if (!includeRecalled && isRecalled) {
        return null;
      }

      // 이력 상세 정보 변환
      const historyDetails: AdminHistoryDetail[] = await Promise.all(
        (histories || []).map(async (h) => {
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

      // 현재 소유자 정보
      let currentOwner: AdminHistoryItem['currentOwner'] = null;
      if (vc.owner_id) {
        if (vc.owner_type === 'PATIENT') {
          currentOwner = {
            id: vc.owner_id,
            name: maskPhoneNumber(vc.owner_id),
            type: 'PATIENT',
          };
        } else {
          const { data: ownerOrg } = await supabase
            .from('organizations')
            .select('id, name, type')
            .eq('id', vc.owner_id)
            .single();

          if (ownerOrg) {
            currentOwner = {
              id: ownerOrg.id,
              name: ownerOrg.name,
              type: ownerOrg.type as OrganizationType,
            };
          }
        }
      }

      // 최초 생산자 정보
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
        historyCount: histories?.length || 0,
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

  return {
    success: true,
    data: {
      items: filteredItems,
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

    // 각 출고 회수의 상세 정보 조회
    for (const shipment of shipments || []) {
      const { data: details } = await supabase
        .from('shipment_details')
        .select(
          `
          virtual_code:virtual_codes!inner(
            lot:lots!inner(
              product:products!inner(name)
            )
          )
        `
        )
        .eq('shipment_batch_id', shipment.id);

      // 제품별 수량 집계
      const productCounts = new Map<string, number>();
      for (const detail of details || []) {
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
        quantity: details?.length || 0,
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

    // 조직 정보 조회 및 결과 추가
    for (const [, group] of groupedRecalls) {
      const { data: fromOrg } = await supabase
        .from('organizations')
        .select('id, name, type')
        .eq('id', group.fromOrganizationId)
        .single();

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

  return {
    success: true,
    data: {
      items: paginatedItems,
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
    return {
      success: false,
      error: {
        code: 'QUERY_ERROR',
        message: error.message,
      },
    };
  }

  return {
    success: true,
    data: (data || []).map((org) => ({
      id: org.id,
      name: org.name,
      type: org.type as OrganizationType,
    })),
  };
}

/**
 * 모든 제품 목록 조회 (선택용)
 */
export async function getAllProductsForSelect(): Promise<
  ApiResponse<{ id: string; name: string; manufacturerName: string }[]>
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id,
      name,
      organization:organizations!inner(name)
    `
    )
    .eq('is_active', true)
    .order('name');

  if (error) {
    return {
      success: false,
      error: {
        code: 'QUERY_ERROR',
        message: error.message,
      },
    };
  }

  return {
    success: true,
    data: (data || []).map((product) => ({
      id: product.id,
      name: product.name,
      manufacturerName: (product.organization as { name: string }).name,
    })),
  };
}
