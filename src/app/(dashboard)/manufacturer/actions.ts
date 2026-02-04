'use server';

/**
 * 제조사 Server Actions
 * 제품 관리, 생산 등록, 제조사 설정 처리, 알림 관리
 */

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { getCurrentUser } from '@/services/auth.service';
import * as productService from '@/services/product.service';
import * as lotService from '@/services/lot.service';
import * as manufacturerSettingsService from '@/services/manufacturer-settings.service';
import * as shipmentService from '@/services/shipment.service';
import * as alertService from '@/services/alert.service';
import * as historyService from '@/services/history.service';
import {
  productCreateSchema,
  productUpdateSchema,
  lotCreateSchema,
} from '@/lib/validations/product';
import { manufacturerSettingsSchema } from '@/lib/validations/organization';
import { shipmentCreateSchema, returnSchema } from '@/lib/validations/shipment';
import type { ApiResponse, Product, ProductDeactivationReason, OrganizationAlertType, HistoryActionType } from '@/types/api.types';
import type { ShipmentItemData } from '@/lib/validations/shipment';
import type { CursorPaginatedHistory, HistoryCursorQuery } from '@/services/history.service';
import { formatZodErrors } from '@/lib/utils';
import { createErrorResponse } from '@/services/common.service';

// ============================================================================
// 헬퍼 함수
// ============================================================================

/**
 * 현재 로그인된 제조사의 조직 ID 가져오기
 */
async function getManufacturerOrganizationId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (user?.organization.type !== 'MANUFACTURER') {
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
// 제품 관련 Actions
// ============================================================================

/**
 * 제품 생성 Action
 */
export async function createProductAction(
  formData: FormData
): Promise<ApiResponse<{ id: string }>> {
  const organizationId = await getManufacturerOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '제조사 계정으로 로그인이 필요합니다.',
      },
    };
  }

  const rawData = {
    name: formData.get('name') as string,
    udiDi: formData.get('udiDi') as string,
    modelName: formData.get('modelName') as string,
  };

  const validation = productCreateSchema.safeParse(rawData);
  if (!validation.success) {
    return formatValidationError(validation.error);
  }

  const result = await productService.createProduct(organizationId, validation.data);

  if (result.success) {
    after(() => {
      revalidatePath('/manufacturer/products');
      revalidatePath('/manufacturer/production');
      revalidatePath('/manufacturer/dashboard');
    });
    return { success: true, data: { id: result.data!.id } };
  }

  return { success: false, error: result.error };
}

/**
 * 제품 수정 Action
 */
export async function updateProductAction(
  formData: FormData
): Promise<ApiResponse<Product>> {
  const organizationId = await getManufacturerOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '제조사 계정으로 로그인이 필요합니다.',
      },
    };
  }

  const rawData = {
    id: formData.get('id') as string,
    name: formData.get('name') as string || undefined,
    udiDi: formData.get('udiDi') as string || undefined,
    modelName: formData.get('modelName') as string || undefined,
  };

  const validation = productUpdateSchema.safeParse(rawData);
  if (!validation.success) {
    return formatValidationError(validation.error);
  }

  const result = await productService.updateProduct(organizationId, validation.data);

  if (result.success) {
    after(() => {
      revalidatePath('/manufacturer/products');
      revalidatePath('/manufacturer/production');
    });
  }

  return result;
}

/**
 * 제품 비활성화 Action
 */
export async function deactivateProductAction(
  productId: string,
  reason: ProductDeactivationReason,
  note?: string
): Promise<ApiResponse<void>> {
  const organizationId = await getManufacturerOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '제조사 계정으로 로그인이 필요합니다.',
      },
    };
  }

  const result = await productService.deactivateProduct(organizationId, productId, reason, note);

  if (result.success) {
    after(() => {
      revalidatePath('/manufacturer/products');
      revalidatePath('/manufacturer/production');
      revalidatePath('/manufacturer/dashboard');
    });
    return { success: true };
  }

  return { success: false, error: result.error };
}

/**
 * 제품 활성화 Action
 */
export async function activateProductAction(
  productId: string
): Promise<ApiResponse<void>> {
  const organizationId = await getManufacturerOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '제조사 계정으로 로그인이 필요합니다.',
      },
    };
  }

  const result = await productService.activateProduct(organizationId, productId);

  if (result.success) {
    after(() => {
      revalidatePath('/manufacturer/products');
      revalidatePath('/manufacturer/production');
      revalidatePath('/manufacturer/dashboard');
    });
    return { success: true };
  }

  return { success: false, error: result.error };
}

/**
 * 제품 검색 Action
 * 검색, 정렬, 페이지네이션을 지원하는 제품 조회
 */
export async function searchProductsAction(
  search: string,
  sortBy: 'model_name' | 'name' | 'created_at',
  sortOrder: 'asc' | 'desc',
  page: number
): Promise<ApiResponse<import('@/types/api.types').PaginatedResponse<Product>>> {
  const organizationId = await getManufacturerOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '제조사 계정으로 로그인이 필요합니다.',
      },
    };
  }

  return productService.getProducts(organizationId, {
    page,
    pageSize: 20,
    search: search || undefined,
    sortBy,
    sortOrder,
  });
}

// ============================================================================
// Lot 생산 관련 Actions
// ============================================================================

/**
 * Lot 생산 등록 Action
 */
export async function createLotAction(
  formData: FormData
): Promise<ApiResponse<{ id: string; lotNumber: string }>> {
  const organizationId = await getManufacturerOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '제조사 계정으로 로그인이 필요합니다.',
      },
    };
  }

  const quantityStr = formData.get('quantity') as string;
  const quantity = parseInt(quantityStr, 10);

  const rawData = {
    productId: formData.get('productId') as string,
    quantity: isNaN(quantity) ? 0 : quantity,
    manufactureDate: formData.get('manufactureDate') as string,
    expiryDate: (formData.get('expiryDate') as string) || undefined,
  };

  const validation = lotCreateSchema.safeParse(rawData);
  if (!validation.success) {
    return formatValidationError(validation.error);
  }

  const result = await lotService.createLot(organizationId, validation.data);

  if (result.success) {
    after(() => {
      revalidatePath('/manufacturer/production');
      revalidatePath('/manufacturer/inventory');
      revalidatePath('/manufacturer/dashboard');
    });
    return {
      success: true,
      data: {
        id: result.data!.id,
        lotNumber: result.data!.lot_number,
      },
    };
  }

  return { success: false, error: result.error };
}

// ============================================================================
// 제조사 설정 관련 Actions
// ============================================================================

/**
 * 제조사 설정 수정 Action
 */
export async function updateManufacturerSettingsAction(
  formData: FormData
): Promise<ApiResponse<void>> {
  const organizationId = await getManufacturerOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '제조사 계정으로 로그인이 필요합니다.',
      },
    };
  }

  const lotModelDigitsStr = formData.get('lotModelDigits') as string;
  const expiryMonthsStr = formData.get('expiryMonths') as string;

  const rawData = {
    lotPrefix: formData.get('lotPrefix') as string,
    lotModelDigits: parseInt(lotModelDigitsStr, 10),
    lotDateFormat: formData.get('lotDateFormat') as string,
    expiryMonths: parseInt(expiryMonthsStr, 10),
  };

  const validation = manufacturerSettingsSchema.safeParse(rawData);
  if (!validation.success) {
    return formatValidationError(validation.error);
  }

  const result = await manufacturerSettingsService.updateManufacturerSettings(
    organizationId,
    validation.data
  );

  if (result.success) {
    after(() => {
      revalidatePath('/manufacturer/settings');
      revalidatePath('/manufacturer/production');
    });
    return { success: true };
  }

  return { success: false, error: result.error };
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
  const organizationId = await getManufacturerOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '제조사 계정으로 로그인이 필요합니다.',
      },
    };
  }

  const validation = shipmentCreateSchema.safeParse({ toOrganizationId, items });
  if (!validation.success) {
    return formatValidationError(validation.error);
  }

  const result = await shipmentService.createShipment(validation.data);

  if (result.success) {
    after(() => {
      revalidatePath('/manufacturer/shipment');
      revalidatePath('/manufacturer/shipment-history');
      revalidatePath('/manufacturer/inventory');
      revalidatePath('/manufacturer/dashboard');
    });
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
  if (user?.organization.type !== 'MANUFACTURER') {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '제조사 계정으로 로그인이 필요합니다.',
      },
    };
  }

  return shipmentService.searchShipmentTargetOrganizations(
    query,
    'MANUFACTURER',
    user.organization.id,
    limit
  );
}

/**
 * 출고 제품 검색 Action (최적화)
 * 검색어로 제품을 검색하고 즐겨찾기 순으로 정렬합니다.
 */
export async function searchShipmentProductsAction(
  search: string,
  favoriteIds: string[]
): Promise<ApiResponse<import('@/types/api.types').ShipmentProductSummary[]>> {
  const organizationId = await getManufacturerOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '제조사 계정으로 로그인이 필요합니다.',
      },
    };
  }

  const { getTopProductsForShipment } = await import('@/services/inventory.service');
  return getTopProductsForShipment(organizationId, {
    limit: 12,
    search,
    favoriteIds,
  });
}

/**
 * 제품 Lot 조회 Action (Lazy Load)
 * 제품 선택 시 Lot 정보를 지연 로딩합니다.
 */
export async function getProductLotsAction(
  productId: string
): Promise<ApiResponse<import('@/types/api.types').InventoryByLot[]>> {
  const organizationId = await getManufacturerOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '제조사 계정으로 로그인이 필요합니다.',
      },
    };
  }

  const { getProductLotsOnDemand } = await import('@/services/inventory.service');
  return getProductLotsOnDemand(organizationId, productId);
}

/**
 * 전체 제품 목록 조회 Action (다이얼로그용)
 * 페이지네이션과 검색을 지원합니다.
 */
export async function getAllProductsForShipmentDialogAction(
  page: number,
  search: string
): Promise<ApiResponse<import('@/types/api.types').PaginatedResponse<import('@/types/api.types').ShipmentProductSummary>>> {
  const organizationId = await getManufacturerOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '제조사 계정으로 로그인이 필요합니다.',
      },
    };
  }

  const { getAllProductsForShipmentDialog } = await import('@/services/inventory.service');
  return getAllProductsForShipmentDialog(organizationId, {
    page,
    pageSize: 30,
    search: search || undefined,
  });
}

/**
 * 출고 반품 Action
 * 수신 조직이 발송 조직에게 제품을 반품합니다.
 * 참고: 제조사는 출고의 발송자이므로 일반적으로 반품 권한이 없습니다.
 * (소유권 기반 검증 - 서비스에서 권한 검증, 부분 반품 지원)
 */
export async function returnShipmentAction(
  shipmentBatchId: string,
  reason: string,
  productQuantities?: Array<{ productId: string; quantity: number }>
): Promise<ApiResponse<{ newBatchId: string | null; returnedCount: number }>> {
  const organizationId = await getManufacturerOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '제조사 계정으로 로그인이 필요합니다.',
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
    after(() => {
      revalidatePath('/manufacturer/history');
      revalidatePath('/manufacturer/inventory');
      revalidatePath('/manufacturer/dashboard');
    });
  }

  return result;
}

// ============================================================================
// 알림 보관함 Actions
// ============================================================================

/**
 * 조직 알림 목록 조회 Action
 */
export async function getOrganizationAlertsAction(query: {
  page?: number;
  pageSize?: number;
  isRead?: boolean;
  alertType?: string;
}) {
  const organizationId = await getManufacturerOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '제조사 계정으로 로그인이 필요합니다.',
      },
    };
  }

  return alertService.getOrganizationAlerts(organizationId, {
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 20,
    isRead: query.isRead,
    alertType: query.alertType as OrganizationAlertType | undefined,
  });
}

/**
 * 알림 읽음 처리 Action
 */
export async function markAlertAsReadAction(alertId: string) {
  const organizationId = await getManufacturerOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '제조사 계정으로 로그인이 필요합니다.',
      },
    };
  }

  const result = await alertService.markAlertAsRead(organizationId, alertId);

  if (result.success) {
    after(() => {
      revalidatePath('/manufacturer/inbox');
    });
  }

  return result;
}

/**
 * 여러 알림 읽음 처리 Action
 */
export async function markAlertsAsReadAction(alertIds: string[]) {
  const organizationId = await getManufacturerOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '제조사 계정으로 로그인이 필요합니다.',
      },
    };
  }

  const result = await alertService.markAlertsAsRead(organizationId, alertIds);

  if (result.success) {
    after(() => {
      revalidatePath('/manufacturer/inbox');
    });
  }

  return result;
}

/**
 * 모든 알림 읽음 처리 Action
 */
export async function markAllAlertsAsReadAction() {
  const organizationId = await getManufacturerOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '제조사 계정으로 로그인이 필요합니다.',
      },
    };
  }

  const result = await alertService.markAllAlertsAsRead(organizationId);

  if (result.success) {
    after(() => {
      revalidatePath('/manufacturer/inbox');
    });
  }

  return result;
}

/**
 * 미읽은 알림 카운트 조회 Action
 */
export async function getUnreadAlertCountAction() {
  const organizationId = await getManufacturerOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '제조사 계정으로 로그인이 필요합니다.',
      },
    };
  }

  return alertService.getUnreadAlertCount(organizationId);
}

/**
 * 알림 상세 조회 Action
 */
export async function getAlertDetailAction(alertId: string) {
  const organizationId = await getManufacturerOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '제조사 계정으로 로그인이 필요합니다.',
      },
    };
  }

  return alertService.getAlertDetail(organizationId, alertId);
}

// ============================================================================
// 거래 이력 Actions (커서 기반 페이지네이션)
// ============================================================================

/**
 * 제조사 거래이력 조회 (커서 기반)
 * 생산, 출고, 회수 이력을 무한 스크롤로 조회합니다.
 */
export async function getManufacturerHistoryCursorAction(
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
  const organizationId = await getManufacturerOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '제조사 계정으로 로그인이 필요합니다.',
      },
    };
  }

  return historyService.getManufacturerHistoryCursor(organizationId, query as HistoryCursorQuery);
}
