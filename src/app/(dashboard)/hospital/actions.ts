'use server';

/**
 * 병원 Server Actions
 * 시술 등록 및 회수 처리
 */

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/services/auth.service';
import * as treatmentService from '@/services/treatment.service';
import { treatmentCreateSchema, treatmentRecallSchema } from '@/lib/validations/treatment';
import { normalizePhoneNumber } from '@/lib/validations/common';
import type { ApiResponse } from '@/types/api.types';
import type { TreatmentItemData } from '@/lib/validations/treatment';

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

  const result = await treatmentService.createTreatment(organizationId, normalizedData);

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
    organizationId,
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
