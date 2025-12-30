'use server';

/**
 * 병원 Server Actions
 * 시술 등록 및 회수 처리
 */

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/services/auth.service';
import * as treatmentService from '@/services/treatment.service';
import * as historyService from '@/services/history.service';
import * as hospitalProductService from '@/services/hospital-product.service';
import { treatmentCreateSchema, treatmentRecallSchema } from '@/lib/validations/treatment';
import { normalizePhoneNumber } from '@/lib/validations/common';
import type { ApiResponse, HistoryActionType, HospitalKnownProduct, ProductForTreatment } from '@/types/api.types';
import type { TreatmentItemData } from '@/lib/validations/treatment';
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

  const result = await treatmentService.createTreatment(normalizedData);

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
    revalidatePath('/hospital/settings');
    revalidatePath('/hospital/treatment');
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
