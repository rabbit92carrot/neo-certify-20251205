'use server';

/**
 * 관리자 Server Actions
 * 조직 관리, 승인 처리
 */

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/services/auth.service';
import * as adminService from '@/services/admin.service';
import type { ApiResponse } from '@/types/api.types';

// ============================================================================
// 헬퍼 함수
// ============================================================================

/**
 * 현재 로그인된 관리자의 조직 ID 가져오기
 */
async function getAdminOrganizationId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (user?.organization.type !== 'ADMIN') {
    return null;
  }
  return user.organization.id;
}

// ============================================================================
// 조직 관리 Actions
// ============================================================================

/**
 * 조직 승인 Action
 */
export async function approveOrganizationAction(
  organizationId: string
): Promise<ApiResponse<void>> {
  const adminId = await getAdminOrganizationId();
  if (!adminId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '관리자 계정으로 로그인이 필요합니다.',
      },
    };
  }

  const result = await adminService.updateOrganizationStatus(organizationId, 'ACTIVE');

  if (result.success) {
    revalidatePath('/admin/organizations');
    revalidatePath('/admin/approvals');
    revalidatePath('/admin/dashboard');
  }

  return result;
}

/**
 * 조직 거부 Action (승인 거부 = 삭제 처리)
 */
export async function rejectOrganizationAction(
  organizationId: string
): Promise<ApiResponse<void>> {
  const adminId = await getAdminOrganizationId();
  if (!adminId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '관리자 계정으로 로그인이 필요합니다.',
      },
    };
  }

  const result = await adminService.updateOrganizationStatus(organizationId, 'DELETED');

  if (result.success) {
    revalidatePath('/admin/organizations');
    revalidatePath('/admin/approvals');
    revalidatePath('/admin/dashboard');
  }

  return result;
}

/**
 * 조직 비활성화 Action
 */
export async function deactivateOrganizationAction(
  organizationId: string
): Promise<ApiResponse<void>> {
  const adminId = await getAdminOrganizationId();
  if (!adminId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '관리자 계정으로 로그인이 필요합니다.',
      },
    };
  }

  const result = await adminService.updateOrganizationStatus(organizationId, 'INACTIVE');

  if (result.success) {
    revalidatePath('/admin/organizations');
    revalidatePath('/admin/dashboard');
  }

  return result;
}

/**
 * 조직 활성화 Action
 */
export async function activateOrganizationAction(
  organizationId: string
): Promise<ApiResponse<void>> {
  const adminId = await getAdminOrganizationId();
  if (!adminId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '관리자 계정으로 로그인이 필요합니다.',
      },
    };
  }

  const result = await adminService.updateOrganizationStatus(organizationId, 'ACTIVE');

  if (result.success) {
    revalidatePath('/admin/organizations');
    revalidatePath('/admin/dashboard');
  }

  return result;
}

/**
 * 조직 삭제 Action (소프트 삭제)
 */
export async function deleteOrganizationAction(
  organizationId: string
): Promise<ApiResponse<void>> {
  const adminId = await getAdminOrganizationId();
  if (!adminId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '관리자 계정으로 로그인이 필요합니다.',
      },
    };
  }

  const result = await adminService.updateOrganizationStatus(organizationId, 'DELETED');

  if (result.success) {
    revalidatePath('/admin/organizations');
    revalidatePath('/admin/dashboard');
  }

  return result;
}

// ============================================================================
// 조직 조회 Actions
// ============================================================================

/**
 * 조직 상태별 통계 조회 Action
 * 활성, 비활성, 승인 대기, 삭제된 조직 수 반환
 */
export async function getOrganizationStatusCountsAction() {
  const adminId = await getAdminOrganizationId();
  if (!adminId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '관리자 계정으로 로그인이 필요합니다.',
      },
    };
  }

  return adminService.getOrganizationStatusCounts();
}

/**
 * 조직 목록 조회 Action (필터링 포함)
 */
export async function getOrganizationsAction(query: {
  page?: number;
  pageSize?: number;
  status?: 'PENDING_APPROVAL' | 'ACTIVE' | 'INACTIVE' | 'DELETED';
  type?: 'MANUFACTURER' | 'DISTRIBUTOR' | 'HOSPITAL';
  search?: string;
}) {
  const adminId = await getAdminOrganizationId();
  if (!adminId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '관리자 계정으로 로그인이 필요합니다.',
      },
    };
  }

  return adminService.getOrganizations({
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 20,
    status: query.status,
    type: query.type,
    search: query.search,
  });
}

/**
 * 승인 대기 조직 목록 조회 Action
 */
export async function getPendingOrganizationsAction(query: {
  page?: number;
  pageSize?: number;
}) {
  const adminId = await getAdminOrganizationId();
  if (!adminId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '관리자 계정으로 로그인이 필요합니다.',
      },
    };
  }

  return adminService.getPendingOrganizations({
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 50,
  });
}

// ============================================================================
// 회수 이력 Actions
// ============================================================================

/**
 * 회수 이력 조회 Action
 * Phase 17: 최적화된 DB 함수 사용 (정렬/페이지네이션을 DB에서 처리)
 */
export async function getRecallHistoryAction(query: {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  type?: 'shipment' | 'treatment' | 'all';
}) {
  const adminId = await getAdminOrganizationId();
  if (!adminId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '관리자 계정으로 로그인이 필요합니다.',
      },
    };
  }

  // Phase 17: 최적화된 함수 사용 (DB에서 정렬/페이지네이션)
  return adminService.getRecallHistoryOptimized({
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 20,
    type: query.type ?? 'all',
    startDate: query.startDate,
    endDate: query.endDate,
  });
}

// ============================================================================
// 관리자 이력 Actions
// ============================================================================

/**
 * 관리자 이력 조회 Action
 */
export async function getAdminHistoryAction(query: {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  currentStatus?: string;
  currentOwnerId?: string;
  originalProducerId?: string;
  productId?: string;
  includeRecalled?: boolean;
}) {
  const adminId = await getAdminOrganizationId();
  if (!adminId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '관리자 계정으로 로그인이 필요합니다.',
      },
    };
  }

  return adminService.getAdminHistory({
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 50,
    startDate: query.startDate,
    endDate: query.endDate,
    currentStatus: query.currentStatus as 'IN_STOCK' | 'USED' | 'DISPOSED' | undefined,
    currentOwnerId: query.currentOwnerId,
    originalProducerId: query.originalProducerId,
    productId: query.productId,
    includeRecalled: query.includeRecalled ?? true,
  });
}

/**
 * 전체 조직 목록 조회 Action (셀렉트용)
 */
export async function getAllOrganizationsForSelectAction() {
  const adminId = await getAdminOrganizationId();
  if (!adminId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '관리자 계정으로 로그인이 필요합니다.',
      },
    };
  }

  return adminService.getAllOrganizationsForSelect();
}

/**
 * 전체 제품 목록 조회 Action (셀렉트용)
 */
export async function getAllProductsForSelectAction() {
  const adminId = await getAdminOrganizationId();
  if (!adminId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '관리자 계정으로 로그인이 필요합니다.',
      },
    };
  }

  return adminService.getAllProductsForSelect();
}

// ============================================================================
// 이벤트 요약 Actions (이력 조회 개선)
// ============================================================================

/**
 * 관리자 이벤트 요약 조회 Action
 * 시간+액션+출발지+도착지로 그룹화된 이벤트 단위 조회
 */
export async function getAdminEventSummaryAction(query: {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  actionTypes?: string[];
  lotNumber?: string;
  productId?: string;
  organizationId?: string;
  includeRecalled?: boolean;
}) {
  const adminId = await getAdminOrganizationId();
  if (!adminId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '관리자 계정으로 로그인이 필요합니다.',
      },
    };
  }

  return adminService.getAdminEventSummary({
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 50,
    startDate: query.startDate,
    endDate: query.endDate,
    actionTypes: query.actionTypes as ('PRODUCED' | 'SHIPPED' | 'RECEIVED' | 'TREATED' | 'RECALLED' | 'DISPOSED')[] | undefined,
    lotNumber: query.lotNumber,
    productId: query.productId,
    organizationId: query.organizationId,
    includeRecalled: query.includeRecalled ?? true,
  });
}

/**
 * 이벤트 샘플 코드 조회 Action
 * 상세 모달에서 샘플 코드 정보를 가져올 때 사용
 */
export async function getEventSampleCodesAction(codeIds: string[]) {
  const adminId = await getAdminOrganizationId();
  if (!adminId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '관리자 계정으로 로그인이 필요합니다.',
      },
    };
  }

  return adminService.getEventSampleCodes(codeIds);
}

/**
 * 이벤트별 고유식별코드 조회 Action
 * 이벤트 상세의 Lot 확장 영역에서 사용
 * codeIds 배열을 기반으로 해당 이벤트에서 처리된 코드만 조회
 */
export async function getEventCodesAction(codeIds: string[], page: number = 1) {
  const adminId = await getAdminOrganizationId();
  if (!adminId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '관리자 계정으로 로그인이 필요합니다.',
      },
    };
  }

  return adminService.getEventCodesPaginated(codeIds, page, 20);
}

/**
 * 이벤트 요약 CSV 내보내기 Action
 * 필터 적용된 전체 이벤트 요약 목록을 반환 (CSV 생성은 클라이언트에서)
 */
export async function exportEventSummaryCsvAction(query: {
  startDate?: string;
  endDate?: string;
  actionTypes?: string[];
  lotNumber?: string;
  productId?: string;
  organizationId?: string;
  includeRecalled?: boolean;
}) {
  const adminId = await getAdminOrganizationId();
  if (!adminId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '관리자 계정으로 로그인이 필요합니다.',
      },
    };
  }

  // CSV 내보내기는 페이지네이션 없이 최대 10,000개까지
  return adminService.getAdminEventSummary({
    page: 1,
    pageSize: 10000,
    startDate: query.startDate,
    endDate: query.endDate,
    actionTypes: query.actionTypes as ('PRODUCED' | 'SHIPPED' | 'RECEIVED' | 'TREATED' | 'RECALLED' | 'DISPOSED')[] | undefined,
    lotNumber: query.lotNumber,
    productId: query.productId,
    organizationId: query.organizationId,
    includeRecalled: query.includeRecalled ?? true,
  });
}
