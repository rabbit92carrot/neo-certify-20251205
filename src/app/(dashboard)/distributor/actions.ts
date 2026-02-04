'use server';

/**
 * 유통사 Server Actions
 * 출고 및 회수 처리
 */

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/services/auth.service';
import * as shipmentService from '@/services/shipment.service';
import * as historyService from '@/services/history.service';
import * as inventoryService from '@/services/inventory.service';
import { shipmentCreateSchema, returnSchema } from '@/lib/validations/shipment';
import type {
  ApiResponse,
  HistoryActionType,
  ShipmentProductSummary,
  PaginatedResponse,
} from '@/types/api.types';
import type { ShipmentItemData } from '@/lib/validations/shipment';
import type { CursorPaginatedHistory, HistoryCursorQuery } from '@/services/history.service';
import { formatZodErrors } from '@/lib/utils';
import { createErrorResponse } from '@/services/common.service';

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
  return createErrorResponse('VALIDATION_ERROR', '입력값을 확인해주세요.', formatZodErrors(error));
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
 * 출고 반품 Action
 * 수신 조직이 발송 조직에게 제품을 반품합니다.
 * 유통사는 제조사로부터 입고받은 제품이나, 병원에서 반품받은 제품을 반품할 수 있습니다.
 * (24시간 제한 없음, 소유권 기반 검증, 부분 반품 지원)
 */
export async function returnShipmentAction(
  shipmentBatchId: string,
  reason: string,
  productQuantities?: Array<{ productId: string; quantity: number }>
): Promise<ApiResponse<{ newBatchId: string | null; returnedCount: number }>> {
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

  const validation = returnSchema.safeParse({ shipmentBatchId, reason, productQuantities });
  if (!validation.success) {
    return formatValidationError(validation.error);
  }

  const result = await shipmentService.returnShipment(
    validation.data.shipmentBatchId,
    validation.data.reason,
    validation.data.productQuantities
  );

  if (result.success) {
    revalidatePath('/distributor/history');
    revalidatePath('/distributor/inventory');
    revalidatePath('/distributor/dashboard');
  }

  return result;
}

/**
 * 반품 가능 수량 조회 Action
 * 반품 다이얼로그 오픈 시 호출 (lazy load)
 * 현재 보유 수량과 원래 수량을 비교하여 UI에 표시
 */
export async function getReturnableCodesAction(
  shipmentBatchId: string
): Promise<ApiResponse<shipmentService.ReturnableProductInfo[]>> {
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

  return shipmentService.getReturnableCodesByBatch(shipmentBatchId);
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

// ============================================================================
// 출고용 제품 관련 Actions
// ============================================================================

/**
 * 출고용 제품 검색 Action
 * 검색어와 즐겨찾기 ID를 기반으로 제품 목록을 반환합니다.
 */
export async function searchShipmentProductsAction(
  search: string,
  favoriteIds: string[]
): Promise<ApiResponse<ShipmentProductSummary[]>> {
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

  return inventoryService.getTopProductsForShipment(organizationId, {
    limit: 50, // 검색 시에는 더 많은 결과 반환
    search,
    favoriteIds,
  });
}

/**
 * 전체 제품 목록 조회 Action (다이얼로그용)
 * 페이지네이션과 검색을 지원합니다.
 */
export async function getAllProductsForShipmentDialogAction(
  page: number,
  search: string
): Promise<ApiResponse<PaginatedResponse<ShipmentProductSummary>>> {
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

  return inventoryService.getAllProductsForShipmentDialog(organizationId, {
    page,
    pageSize: 30,
    search: search || undefined,
  });
}
