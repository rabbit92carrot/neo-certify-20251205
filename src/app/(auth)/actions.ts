'use server';

/**
 * 인증 Server Actions
 * 회원가입, 로그인, 로그아웃 처리
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import * as authService from '@/services/auth.service';
import { organizationRegisterSchema, loginSchema } from '@/lib/validations';
import { DEFAULT_REDIRECT, LOGIN_PATH } from '@/constants/routes';
import { createErrorResponse, createSuccessResponse, ERROR_CODES } from '@/services/common.service';
import { formatZodErrors } from '@/lib/utils';
import {
  checkRateLimit,
  getClientIP,
  createRateLimitKey,
  formatRetryAfter,
  RATE_LIMIT_CONFIGS,
} from '@/lib/rate-limit';
import type { ApiResponse } from '@/types/api.types';
import type { OrganizationType } from '@/constants';

/**
 * 회원가입 결과 타입
 */
interface RegisterActionResult {
  redirect: string;
}

/**
 * 로그인 결과 타입
 */
interface LoginActionResult {
  redirect: string;
}

/**
 * 회원가입 Server Action
 *
 * @param formData 폼 데이터
 * @returns API 응답
 */
export async function registerAction(
  formData: FormData
): Promise<ApiResponse<RegisterActionResult>> {
  // Rate Limit 체크
  const headersList = await headers();
  const clientIP = getClientIP(headersList);
  const rateLimitKey = createRateLimitKey(clientIP, 'register');
  const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.register);

  if (!rateLimitResult.success) {
    const retryAfter = formatRetryAfter(rateLimitResult.resetAt);
    return createErrorResponse(
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      `너무 많은 회원가입 시도입니다. ${retryAfter} 후에 다시 시도해주세요.`
    );
  }

  // FormData에서 데이터 추출
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
    organizationType: formData.get('organizationType') as string,
    name: formData.get('name') as string,
    businessNumber: formData.get('businessNumber') as string,
    representativeName: formData.get('representativeName') as string,
    representativeContact: formData.get('representativeContact') as string,
    address: formData.get('address') as string,
  };

  const file = formData.get('businessLicenseFile') as File | null;

  // Zod 검증
  const validationResult = organizationRegisterSchema.safeParse(rawData);
  if (!validationResult.success) {
    return createErrorResponse(ERROR_CODES.VALIDATION_ERROR, '입력값을 확인해주세요.', formatZodErrors(validationResult.error));
  }

  // 파일 검증
  if (!file || file.size === 0) {
    return createErrorResponse('FILE_REQUIRED', '사업자등록증 파일을 업로드해주세요.');
  }

  // 서비스 호출
  const result = await authService.register(validationResult.data, file);

  if (!result.success) {
    return createErrorResponse(result.error?.code ?? 'UNKNOWN_ERROR', result.error?.message ?? '회원가입에 실패했습니다.');
  }

  return createSuccessResponse({ redirect: `${LOGIN_PATH}?registered=true` });
}

/**
 * 로그인 Server Action
 *
 * @param formData 폼 데이터
 * @returns API 응답
 */
export async function loginAction(
  formData: FormData
): Promise<ApiResponse<LoginActionResult>> {
  // Rate Limit 체크
  const headersList = await headers();
  const clientIP = getClientIP(headersList);
  const rateLimitKey = createRateLimitKey(clientIP, 'login');
  const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.auth);

  if (!rateLimitResult.success) {
    const retryAfter = formatRetryAfter(rateLimitResult.resetAt);
    return createErrorResponse(
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      `너무 많은 로그인 시도입니다. ${retryAfter} 후에 다시 시도해주세요.`
    );
  }

  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  // Zod 검증
  const validationResult = loginSchema.safeParse(rawData);
  if (!validationResult.success) {
    return createErrorResponse(ERROR_CODES.VALIDATION_ERROR, '입력값을 확인해주세요.', formatZodErrors(validationResult.error));
  }

  // 서비스 호출
  const result = await authService.login(
    validationResult.data.email,
    validationResult.data.password
  );

  if (!result.success) {
    return createErrorResponse(result.error?.code ?? 'UNKNOWN_ERROR', result.error?.message ?? '로그인에 실패했습니다.');
  }

  // 조직 유형별 리다이렉트 경로 결정
  const orgType = result.data!.organization.type as OrganizationType;
  const redirectPath = DEFAULT_REDIRECT[orgType];

  revalidatePath('/', 'layout');

  return createSuccessResponse({ redirect: redirectPath });
}

/**
 * 로그아웃 Server Action
 */
export async function logoutAction(): Promise<void> {
  await authService.logout();
  revalidatePath('/', 'layout');
  redirect(LOGIN_PATH);
}
