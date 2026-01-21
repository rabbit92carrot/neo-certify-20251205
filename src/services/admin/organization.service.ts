/**
 * 관리자 서비스 - 조직 관리
 * 조직 목록, 상태 관리, 승인 처리 등
 */

import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import {
  parseRpcArray,
  createErrorResponse,
  createSuccessResponse,
  createNotFoundResponse,
} from '../common.service';
import type {
  ApiResponse,
  PaginatedResponse,
  Organization,
  OrganizationWithStats,
  OrganizationDetail,
} from '@/types/api.types';
import type { AdminOrganizationQueryData } from '@/lib/validations/admin';
import { ORGANIZATION_STATUSES } from '@/constants/organization';
import { CONFIG } from '@/constants/config';
import { OrgStatusCountRowSchema, OrgCodeCountRowSchema } from '@/lib/validations/rpc-schemas';
import { buildIlikeFilter } from '@/lib/utils/db';

const logger = createLogger('admin.organization.service');

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
    logger.error('조직 상태 통계 조회 실패:', error);
    return createErrorResponse('QUERY_ERROR', error.message);
  }

  // Zod 검증으로 결과 파싱
  const parsed = parseRpcArray(OrgStatusCountRowSchema, data, 'get_organization_status_counts');
  if (!parsed.success) {
    logger.error('get_organization_status_counts 검증 실패:', parsed.error);
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
    queryBuilder = queryBuilder.or(buildIlikeFilter(['name', 'email'], search));
  }

  const { data: organizations, count, error } = await queryBuilder.range(
    offset,
    offset + pageSize - 1
  );

  if (error) {
    logger.error('조직 목록 조회 실패:', error);
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
        logger.error('get_organization_code_counts 검증 실패:', parsed.error);
      }
    } else if (countError) {
      logger.error('조직 코드 수 bulk 조회 실패:', countError);
    }
  }

  const organizationsWithStats: OrganizationWithStats[] = (organizations ?? []).map((org) => ({
    ...org,
    virtualCodeCount: countByOrgId.get(org.id) ?? 0,
  }));

  const total = count ?? 0;

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
    logger.error('승인 대기 조직 조회 실패:', error);
    return createErrorResponse('QUERY_ERROR', error.message);
  }

  const total = count ?? 0;

  return createSuccessResponse({
    items: data ?? [],
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
    logger.error('조직 상태 변경 실패:', error);
    return createErrorResponse('UPDATE_ERROR', error.message);
  }

  return createSuccessResponse(undefined);
}
