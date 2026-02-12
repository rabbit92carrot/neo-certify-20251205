'use server';

/**
 * 병원 Server Actions
 * 시술 등록, 회수, 폐기 처리
 */

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { getCurrentUser } from '@/services/auth.service';
import * as treatmentService from '@/services/treatment.service';
import * as disposalService from '@/services/disposal.service';
import * as shipmentService from '@/services/shipment.service';
import * as historyService from '@/services/history.service';
import * as hospitalProductService from '@/services/hospital-product.service';
import { treatmentCreateSchema, treatmentRecallSchema } from '@/lib/validations/treatment';
import { disposalCreateSchema } from '@/lib/validations/disposal';
import { returnSchema } from '@/lib/validations/shipment';
import { normalizePhoneNumber } from '@/lib/validations/common';
import type {
  ApiResponse,
  HistoryActionType,
  HospitalKnownProduct,
  PaginatedResponse,
  ProductForTreatment,
} from '@/types/api.types';
import type { TreatmentItemData } from '@/lib/validations/treatment';
import type { DisposalItemData, DisposalReasonTypeValue } from '@/lib/validations/disposal';
import type { CursorPaginatedHistory, HistoryCursorQuery } from '@/services/history.service';
import type { GetKnownProductsQuery } from '@/services/hospital-product.service';
import { formatZodErrors } from '@/lib/utils';
import { createErrorResponse } from '@/services/common.service';

// ============================================================================
// 헬퍼 함수
// ============================================================================

/**
 * 현재 로그인된 병원의 조직 ID 가져오기
 */
async function getHospitalOrganizationId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (user?.organization.type !== 'HOSPITAL') {
    return null;
  }
  return user.organization.id;
}

async function getHospitalInfo(): Promise<{ id: string; name: string } | null> {
  const user = await getCurrentUser();
  if (user?.organization.type !== 'HOSPITAL') {
    return null;
  }
  return { id: user.organization.id, name: user.organization.name };
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
// 환자 검색 Action
// ============================================================================

/**
 * 병원의 기존 환자 전화번호 검색 Action
 * 시술 이력이 있는 환자의 전화번호를 검색합니다.
 *
 * @param searchTerm 검색어 (전화번호 일부)
 * @returns 환자 전화번호 목록
 */
export async function searchHospitalPatientsAction(
  searchTerm?: string
): Promise<ApiResponse<string[]>> {
  const organizationId = await getHospitalOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '병원 계정으로 로그인이 필요합니다.',
      },
    };
  }

  return treatmentService.getHospitalPatients(organizationId, searchTerm);
}

// ============================================================================
// 시술 관련 Actions
// ============================================================================

/**
 * 시술 등록 Action
 */
export async function createTreatmentAction(
  patientPhone: string,
  treatmentDate: string,
  items: TreatmentItemData[]
): Promise<ApiResponse<{ treatmentId: string; totalQuantity: number }>> {
  const hospital = await getHospitalInfo();
  if (!hospital) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '병원 계정으로 로그인이 필요합니다.',
      },
    };
  }

  const validation = treatmentCreateSchema.safeParse({
    patientPhone,
    treatmentDate,
    items,
  });

  if (!validation.success) {
    return formatValidationError(validation.error);
  }

  // 전화번호 정규화
  const normalizedData = {
    ...validation.data,
    patientPhone: normalizePhoneNumber(validation.data.patientPhone),
  };

  const result = await treatmentService.createTreatment(normalizedData, hospital.name);

  if (result.success) {
    revalidatePath('/hospital/treatment');
    revalidatePath('/hospital/treatment-history');
    revalidatePath('/hospital/inventory');
    revalidatePath('/hospital/dashboard');
  }

  return result;
}

/**
 * 시술 회수 Action
 */
export async function recallTreatmentAction(
  treatmentId: string,
  reason: string
): Promise<ApiResponse<void>> {
  const organizationId = await getHospitalOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '병원 계정으로 로그인이 필요합니다.',
      },
    };
  }

  const validation = treatmentRecallSchema.safeParse({ treatmentId, reason });
  if (!validation.success) {
    return formatValidationError(validation.error);
  }

  const result = await treatmentService.recallTreatment(
    validation.data.treatmentId,
    validation.data.reason
  );

  if (result.success) {
    revalidatePath('/hospital/treatment-history');
    revalidatePath('/hospital/inventory');
    revalidatePath('/hospital/dashboard');
  }

  return result;
}

// ============================================================================
// 출고 반품 Actions
// ============================================================================

/**
 * 출고 반품 Action
 * 수신 조직이 발송 조직에게 제품을 반품합니다.
 * 병원은 유통사로부터 입고받은 제품을 반품할 수 있습니다.
 * (24시간 제한 없음, 소유권 기반 검증, 부분 반품 지원)
 */
export async function returnShipmentAction(
  shipmentBatchId: string,
  reason: string,
  productQuantities?: Array<{ productId: string; quantity: number }>
): Promise<ApiResponse<{ newBatchId: string | null; returnedCount: number }>> {
  const organizationId = await getHospitalOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '병원 계정으로 로그인이 필요합니다.',
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
    revalidatePath('/hospital/history');
    revalidatePath('/hospital/inventory');
    revalidatePath('/hospital/dashboard');
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
  const organizationId = await getHospitalOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '병원 계정으로 로그인이 필요합니다.',
      },
    };
  }

  return shipmentService.getReturnableCodesByBatch(shipmentBatchId);
}

// ============================================================================
// 폐기 관련 Actions
// ============================================================================

/**
 * 폐기 등록 Action
 * 병원에서 손실, 만료, 불량 등의 이유로 제품을 폐기합니다.
 * 폐기는 즉시 확정되며 취소할 수 없습니다.
 */
export async function createDisposalAction(
  disposalDate: string,
  disposalReasonType: DisposalReasonTypeValue,
  disposalReasonCustom: string | null,
  items: DisposalItemData[]
): Promise<ApiResponse<{ disposalId: string; totalQuantity: number }>> {
  const organizationId = await getHospitalOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '병원 계정으로 로그인이 필요합니다.',
      },
    };
  }

  const validation = disposalCreateSchema.safeParse({
    disposalDate,
    disposalReasonType,
    disposalReasonCustom,
    items,
  });

  if (!validation.success) {
    return formatValidationError(validation.error);
  }

  const result = await disposalService.createDisposal(validation.data);

  if (result.success) {
    revalidatePath('/hospital/disposal');
    revalidatePath('/hospital/inventory');
    revalidatePath('/hospital/dashboard');
    revalidatePath('/hospital/history');
  }

  return result;
}

// ============================================================================
// 거래 이력 Actions (커서 기반 페이지네이션)
// ============================================================================

/**
 * 병원 거래이력 조회 (커서 기반)
 * 입고, 시술, 회수 이력을 무한 스크롤로 조회합니다.
 */
export async function getHospitalHistoryCursorAction(
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
  const organizationId = await getHospitalOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '병원 계정으로 로그인이 필요합니다.',
      },
    };
  }

  return historyService.getHospitalHistoryCursor(organizationId, query as HistoryCursorQuery);
}

// ============================================================================
// 제품 관리 Actions
// ============================================================================

/**
 * 병원 Known Products 목록 조회 Action
 * 입고받은 제품 목록 (별칭, 활성화 상태 포함)
 */
export async function getHospitalKnownProductsAction(
  query?: GetKnownProductsQuery
): Promise<ApiResponse<HospitalKnownProduct[]>> {
  const organizationId = await getHospitalOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '병원 계정으로 로그인이 필요합니다.',
      },
    };
  }

  return hospitalProductService.getHospitalKnownProducts(organizationId, query);
}

/**
 * 제품 설정 업데이트 Action (별칭, 활성화 상태)
 */
export async function updateHospitalProductSettingsAction(
  productId: string,
  settings: { alias?: string | null; isActive?: boolean }
): Promise<ApiResponse<void>> {
  const organizationId = await getHospitalOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '병원 계정으로 로그인이 필요합니다.',
      },
    };
  }

  const result = await hospitalProductService.updateHospitalProductSettings(
    organizationId,
    productId,
    settings
  );

  if (result.success) {
    after(() => {
      revalidatePath('/hospital/settings');
      revalidatePath('/hospital/treatment');
      revalidatePath('/hospital/inventory');
      revalidatePath('/hospital/dashboard');
    });
  }

  return result;
}

/**
 * 별칭 중복 체크 Action
 */
export async function checkAliasExistsAction(
  alias: string,
  excludeProductId?: string
): Promise<boolean> {
  const organizationId = await getHospitalOrganizationId();
  if (!organizationId) {
    return false;
  }

  return hospitalProductService.checkAliasExists(organizationId, alias, excludeProductId);
}

/**
 * 시술 등록용 활성 제품 목록 조회 Action
 * 재고가 있고 활성화된 제품만 반환 (별칭 포함)
 */
export async function getActiveProductsForTreatmentAction(): Promise<ApiResponse<ProductForTreatment[]>> {
  const organizationId = await getHospitalOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '병원 계정으로 로그인이 필요합니다.',
      },
    };
  }

  return hospitalProductService.getActiveProductsForTreatment(organizationId);
}

/**
 * 시술용 제품 검색 Action
 * 검색어와 즐겨찾기 ID를 기반으로 제품 목록을 반환합니다.
 */
export async function searchTreatmentProductsAction(
  search: string,
  favoriteIds: string[]
): Promise<ApiResponse<ProductForTreatment[]>> {
  const organizationId = await getHospitalOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '병원 계정으로 로그인이 필요합니다.',
      },
    };
  }

  return hospitalProductService.searchActiveProductsForTreatment(organizationId, {
    search,
    favoriteIds,
    limit: 50,
  });
}

/**
 * 전체 제품 목록 조회 Action (다이얼로그용)
 * 페이지네이션과 검색을 지원합니다.
 * 활성화된 제품 중 재고가 있는 제품을 반환합니다.
 */
export async function getAllProductsForTreatmentDialogAction(
  page: number,
  search: string
): Promise<ApiResponse<PaginatedResponse<ProductForTreatment>>> {
  const organizationId = await getHospitalOrganizationId();
  if (!organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '병원 계정으로 로그인이 필요합니다.',
      },
    };
  }

  return hospitalProductService.getActiveProductsForTreatmentPaginated(organizationId, {
    page,
    pageSize: 30,
    search: search || undefined,
  });
}
