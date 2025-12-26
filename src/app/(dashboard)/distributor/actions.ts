'use server';

/**
 * 유통사 Server Actions
 * 출고 및 회수 처리
 */

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/services/auth.service';
import * as shipmentService from '@/services/shipment.service';
import * as historyService from '@/services/history.service';
import { shipmentCreateSchema, recallSchema } from '@/lib/validations/shipment';
import type { ApiResponse, HistoryActionType } from '@/types/api.types';
import type { ShipmentItemData } from '@/lib/validations/shipment';
import type { CursorPaginatedHistory, HistoryCursorQuery } from '@/services/history.service';

// ============================================================================
// 헬퍼 함수
// ============================================================================

/**
 * 현재 로그인된 유통사의 조직 ID 가져오기
 */
async function getDistributorOrganizationId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (user?.organization.type !== 'DISTRIBUTOR') {
    return null;
  }
  return user.organization.id;
}

/**
 * Zod 검증 에러를 ApiResponse 형식으로 변환
 */
function formatValidationError(
  error: import('zod').ZodError
): ApiResponse<never> {
  const fieldErrors: Record<string, string[]> = {};
  error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    fieldErrors[path] ??= [];
    fieldErrors[path].push(issue.message);
  });

  return {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: '입력값을 확인해주세요.',
      details: fieldErrors,
    },
  };
}

// ============================================================================
// 출고 관련 Actions
// ============================================================================

/**
 * 출고 생성 Action
 */
export async function createShipmentAction(
  toOrganizationId: string,
  items: ShipmentItemData[]
): Promise<ApiResponse<{ shipmentBatchId: string; totalQuantity: number }>> {
  const organizationId = await getDistributorOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '유통사 계정으로 로그인이 필요합니다.',
      },
    };
  }

  const validation = shipmentCreateSchema.safeParse({ toOrganizationId, items });
  if (!validation.success) {
    return formatValidationError(validation.error);
  }

  const result = await shipmentService.createShipment(validation.data);

  if (result.success) {
    revalidatePath('/distributor/shipment');
    revalidatePath('/distributor/shipment-history');
    revalidatePath('/distributor/inventory');
    revalidatePath('/distributor/dashboard');
  }

  return result;
}

/**
 * 출고 대상 조직 검색 Action (Lazy Load용)
 * 사용자가 검색할 때만 조직을 조회하여 초기 로딩 시간을 대폭 줄입니다.
 */
export async function searchShipmentTargetsAction(
  query: string,
  limit: number = 20
): Promise<ApiResponse<Pick<import('@/types/api.types').Organization, 'id' | 'name' | 'type'>[]>> {
  const user = await getCurrentUser();
  if (user?.organization.type !== 'DISTRIBUTOR') {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '유통사 계정으로 로그인이 필요합니다.',
      },
    };
  }

  return shipmentService.searchShipmentTargetOrganizations(
    query,
    'DISTRIBUTOR',
    user.organization.id,
    limit
  );
}

/**
 * 출고 회수 Action
 */
export async function recallShipmentAction(
  shipmentBatchId: string,
  reason: string
): Promise<ApiResponse<void>> {
  const organizationId = await getDistributorOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '유통사 계정으로 로그인이 필요합니다.',
      },
    };
  }

  const validation = recallSchema.safeParse({ shipmentBatchId, reason });
  if (!validation.success) {
    return formatValidationError(validation.error);
  }

  const result = await shipmentService.recallShipment(
    validation.data.shipmentBatchId,
    validation.data.reason
  );

  if (result.success) {
    revalidatePath('/distributor/history');
    revalidatePath('/distributor/inventory');
    revalidatePath('/distributor/dashboard');
  }

  return result;
}

// ============================================================================
// 거래 이력 Actions (커서 기반 페이지네이션)
// ============================================================================

/**
 * 유통사 거래이력 조회 (커서 기반)
 * 입고, 출고, 회수 이력을 무한 스크롤로 조회합니다.
 */
export async function getDistributorHistoryCursorAction(
  query: {
    actionTypes?: HistoryActionType[];
    startDate?: string;
    endDate?: string;
    isRecall?: boolean;
    limit?: number;
    cursorTime?: string;
    cursorKey?: string;
  }
): Promise<ApiResponse<CursorPaginatedHistory>> {
  const organizationId = await getDistributorOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '유통사 계정으로 로그인이 필요합니다.',
      },
    };
  }

  return historyService.getDistributorHistoryCursor(organizationId, query as HistoryCursorQuery);
}
