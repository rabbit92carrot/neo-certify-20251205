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
// 회수 이력 Actions
// ============================================================================

/**
 * 회수 이력 조회 Action
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

  return adminService.getRecallHistory({
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 20,
    type: query.type ?? 'all',
    startDate: query.startDate,
    endDate: query.endDate,
  });
}
