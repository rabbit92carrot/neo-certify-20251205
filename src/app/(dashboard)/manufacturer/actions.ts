'use server';

/**
 * 제조사 Server Actions
 * 제품 관리, 생산 등록, 제조사 설정 처리
 */

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/services/auth.service';
import * as productService from '@/services/product.service';
import * as lotService from '@/services/lot.service';
import * as manufacturerSettingsService from '@/services/manufacturer-settings.service';
import * as shipmentService from '@/services/shipment.service';
import {
  productCreateSchema,
  productUpdateSchema,
  lotCreateSchema,
} from '@/lib/validations/product';
import { manufacturerSettingsSchema } from '@/lib/validations/organization';
import { shipmentCreateSchema, recallSchema } from '@/lib/validations/shipment';
import type { ApiResponse, Product } from '@/types/api.types';
import type { ShipmentItemData } from '@/lib/validations/shipment';

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
  const fieldErrors: Record<string, string[]> = {};
  error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
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
    revalidatePath('/manufacturer/products');
    revalidatePath('/manufacturer/production');
    revalidatePath('/manufacturer/dashboard');
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
    revalidatePath('/manufacturer/products');
    revalidatePath('/manufacturer/production');
  }

  return result;
}

/**
 * 제품 비활성화 Action
 */
export async function deactivateProductAction(
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

  const result = await productService.deactivateProduct(organizationId, productId);

  if (result.success) {
    revalidatePath('/manufacturer/products');
    revalidatePath('/manufacturer/production');
    revalidatePath('/manufacturer/dashboard');
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
    revalidatePath('/manufacturer/products');
    revalidatePath('/manufacturer/production');
    revalidatePath('/manufacturer/dashboard');
    return { success: true };
  }

  return { success: false, error: result.error };
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
    revalidatePath('/manufacturer/production');
    revalidatePath('/manufacturer/inventory');
    revalidatePath('/manufacturer/dashboard');
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
    revalidatePath('/manufacturer/settings');
    revalidatePath('/manufacturer/production');
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

  const result = await shipmentService.createShipment(organizationId, validation.data);

  if (result.success) {
    revalidatePath('/manufacturer/shipment');
    revalidatePath('/manufacturer/shipment-history');
    revalidatePath('/manufacturer/inventory');
    revalidatePath('/manufacturer/dashboard');
  }

  return result;
}

/**
 * 출고 회수 Action
 */
export async function recallShipmentAction(
  shipmentBatchId: string,
  reason: string
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

  const validation = recallSchema.safeParse({ shipmentBatchId, reason });
  if (!validation.success) {
    return formatValidationError(validation.error);
  }

  const result = await shipmentService.recallShipment(
    organizationId,
    validation.data.shipmentBatchId,
    validation.data.reason
  );

  if (result.success) {
    revalidatePath('/manufacturer/shipment-history');
    revalidatePath('/manufacturer/inventory');
    revalidatePath('/manufacturer/dashboard');
  }

  return result;
}
