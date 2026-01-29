/**
 * 인증 서비스
 * 회원가입, 로그인, 로그아웃, 현재 사용자 조회 등 인증 관련 비즈니스 로직
 */

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeBusinessNumber, normalizePhoneNumber } from '@/lib/validations/common';
import type { OrganizationRegisterData } from '@/lib/validations/organization';
import type { ApiResponse, LoginResponse, CurrentUser, Organization, ManufacturerSettings } from '@/types/api.types';
import { ORGANIZATION_STATUSES, ERROR_MESSAGES } from '@/constants';
import { createErrorResponse, createSuccessResponse } from './common.service';

/**
 * 회원가입 결과 타입
 */
interface RegisterResult {
  userId: string;
}

/**
 * 회원가입 처리
 *
 * 1. 사업자등록번호 중복 확인
 * 2. Supabase Auth 사용자 생성
 * 3. Supabase Storage에 파일 업로드
 * 4. organizations 테이블에 조직 정보 저장
 *
 * @param data 회원가입 데이터
 * @param file 사업자등록증 파일
 * @returns API 응답
 */
export async function register(
  data: OrganizationRegisterData,
  file: File
): Promise<ApiResponse<RegisterResult>> {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // 1. 사업자등록번호 + 조직명 중복 확인 (병렬)
  const normalizedBN = normalizeBusinessNumber(data.businessNumber);
  const [existingResult, existingNameResult] = await Promise.all([
    adminClient
      .from('organizations')
      .select('id')
      .eq('business_number', normalizedBN)
      .single(),
    adminClient
      .from('organizations')
      .select('id')
      .eq('name', data.name)
      .single(),
  ]);

  const { data: existing } = existingResult;
  const { data: existingName } = existingNameResult;

  if (existing) {
    return createErrorResponse('DUPLICATE_BUSINESS_NUMBER', ERROR_MESSAGES.ORGANIZATION.DUPLICATE_BUSINESS_NUMBER);
  }

  if (existingName) {
    return createErrorResponse('DUPLICATE_ORGANIZATION_NAME', ERROR_MESSAGES.ORGANIZATION.DUPLICATE_NAME);
  }

  // 2. Supabase Auth 사용자 생성
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        organization_type: data.organizationType,
      },
    },
  });

  if (authError || !authData.user) {
    return createErrorResponse('AUTH_ERROR', authError?.message ?? '회원가입에 실패했습니다.');
  }

  const userId = authData.user.id;

  // 3. Supabase Storage에 파일 업로드
  const fileExt = file.name.split('.').pop() || 'pdf';
  const fileName = `${userId}/business_license.${fileExt}`;

  const { error: uploadError } = await adminClient.storage
    .from('business-licenses')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    // 롤백: Auth 사용자 삭제
    await adminClient.auth.admin.deleteUser(userId);
    return createErrorResponse('UPLOAD_ERROR', ERROR_MESSAGES.FILE.UPLOAD_FAILED);
  }

  // 4. organizations 테이블에 저장
  const { error: orgError } = await adminClient.from('organizations').insert({
    auth_user_id: userId,
    type: data.organizationType,
    email: data.email,
    name: data.name,
    business_number: normalizedBN,
    business_license_file: fileName,
    representative_name: data.representativeName,
    representative_contact: normalizePhoneNumber(data.representativeContact),
    address: data.address,
    // 실제 운영: 관리자 승인 대기 상태로 설정
    status: ORGANIZATION_STATUSES.PENDING_APPROVAL,
  });

  if (orgError) {
    // 롤백: Storage 파일 삭제 및 Auth 사용자 삭제
    await adminClient.storage.from('business-licenses').remove([fileName]);
    await adminClient.auth.admin.deleteUser(userId);
    return createErrorResponse('DATABASE_ERROR', '조직 정보 저장에 실패했습니다.');
  }

  // 회원가입 후 자동 로그아웃 (이메일 확인 후 로그인하도록)
  await supabase.auth.signOut();

  return createSuccessResponse({ userId });
}

/**
 * 로그인 처리
 *
 * @param email 이메일
 * @param password 비밀번호
 * @returns API 응답 (사용자 및 조직 정보)
 */
export async function login(
  email: string,
  password: string
): Promise<ApiResponse<LoginResponse>> {
  const supabase = await createClient();

  // Supabase Auth 로그인
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return createErrorResponse('LOGIN_FAILED', ERROR_MESSAGES.AUTH.LOGIN_FAILED);
  }

  // 조직 정보 조회
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('auth_user_id', authData.user.id)
    .single();

  if (orgError || !org) {
    // 조직 정보가 없으면 로그아웃
    await supabase.auth.signOut();
    return createErrorResponse('ORGANIZATION_NOT_FOUND', ERROR_MESSAGES.ORGANIZATION.NOT_FOUND);
  }

  // 조직 상태 체크
  if (org.status !== ORGANIZATION_STATUSES.ACTIVE) {
    await supabase.auth.signOut();

    if (org.status === ORGANIZATION_STATUSES.PENDING_APPROVAL) {
      return createErrorResponse('PENDING_APPROVAL', '승인 대기 중인 계정입니다. 관리자 승인 후 이용 가능합니다.');
    }

    return createErrorResponse('INACTIVE_ORGANIZATION', '비활성화된 계정입니다. 관리자에게 문의해주세요.');
  }

  return createSuccessResponse({
    user: {
      id: authData.user.id,
      email: authData.user.email!,
    },
    organization: org as Organization,
  });
}

/**
 * 로그아웃 처리
 *
 * @returns API 응답
 */
export async function logout(): Promise<ApiResponse<void>> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return createErrorResponse('LOGOUT_ERROR', error.message);
  }

  return createSuccessResponse(undefined);
}

/**
 * 현재 로그인된 사용자 정보 조회
 *
 * @returns 현재 사용자 정보 또는 null
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // 조직 정보 조회 (제조사 설정 포함)
  const { data: org } = await supabase
    .from('organizations')
    .select('*, manufacturer_settings(*)')
    .eq('auth_user_id', user.id)
    .single();

  if (!org) {
    return null;
  }

  // manufacturer_settings 배열에서 첫 번째 항목 추출 - Supabase 조인 결과 타입 처리
  const rawSettings = org.manufacturer_settings as ManufacturerSettings | ManufacturerSettings[] | null;
  const manufacturerSettings = Array.isArray(rawSettings)
    ? rawSettings[0]
    : rawSettings;

  return {
    id: user.id,
    email: user.email!,
    organization: org as Organization,
    manufacturerSettings: manufacturerSettings ?? undefined,
  };
}

/**
 * 캐싱된 현재 사용자 조회
 * React의 cache()를 사용하여 동일 요청 내 중복 호출 방지
 * 레이아웃과 페이지에서 동시에 호출해도 한 번만 DB 조회
 */
export const getCachedCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  return getCurrentUser();
});

/**
 * 이메일 중복 확인
 *
 * @param email 확인할 이메일
 * @returns 중복 여부
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  const adminClient = createAdminClient();

  const { data } = await adminClient
    .from('organizations')
    .select('id')
    .eq('email', email)
    .single();

  return !!data;
}

/**
 * 사업자등록번호 중복 확인
 *
 * @param businessNumber 확인할 사업자등록번호
 * @returns 중복 여부
 */
export async function checkBusinessNumberExists(businessNumber: string): Promise<boolean> {
  const adminClient = createAdminClient();
  const normalizedBN = normalizeBusinessNumber(businessNumber);

  const { data } = await adminClient
    .from('organizations')
    .select('id')
    .eq('business_number', normalizedBN)
    .single();

  return !!data;
}

/**
 * 비밀번호 재설정 이메일 발송
 * 사업자등록번호와 이메일 일치 확인 후 Supabase resetPasswordForEmail 호출
 *
 * @param businessNumber 사업자등록번호
 * @param email 이메일
 * @returns API 응답
 */
export async function resetPassword(
  businessNumber: string,
  email: string
): Promise<ApiResponse<void>> {
  const adminClient = createAdminClient();
  const normalizedBN = normalizeBusinessNumber(businessNumber);

  // organizations 테이블에서 사업자등록번호 + 이메일 일치 확인
  const { data: org } = await adminClient
    .from('organizations')
    .select('id')
    .eq('business_number', normalizedBN)
    .eq('email', email)
    .single();

  if (!org) {
    return createErrorResponse('NOT_FOUND', '일치하는 계정 정보를 찾을 수 없습니다.');
  }

  // Supabase 비밀번호 재설정 이메일 발송
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback?type=recovery`,
  });

  if (error) {
    return createErrorResponse('RESET_PASSWORD_ERROR', error.message);
  }

  return createSuccessResponse(undefined);
}

/**
 * 새 비밀번호 설정
 * recovery 토큰으로 인증된 세션에서 비밀번호 업데이트
 *
 * @param password 새 비밀번호
 * @returns API 응답
 */
export async function updatePassword(
  password: string
): Promise<ApiResponse<void>> {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return createErrorResponse('UPDATE_PASSWORD_ERROR', error.message);
  }

  return createSuccessResponse(undefined);
}

/**
 * 계정 찾기
 * 사업자등록번호 + 대표연락처로 가입 이메일 조회 (마스킹 처리)
 *
 * @param businessNumber 사업자등록번호
 * @param representativeContact 대표연락처
 * @returns API 응답 (마스킹된 이메일)
 */
export async function findAccount(
  businessNumber: string,
  representativeContact: string
): Promise<ApiResponse<{ maskedEmail: string }>> {
  const adminClient = createAdminClient();
  const normalizedBN = normalizeBusinessNumber(businessNumber);
  const normalizedPhone = normalizePhoneNumber(representativeContact);

  // organizations 테이블에서 사업자등록번호 + 대표연락처 매칭
  const { data: org } = await adminClient
    .from('organizations')
    .select('email')
    .eq('business_number', normalizedBN)
    .eq('representative_contact', normalizedPhone)
    .single();

  if (!org || !org.email) {
    return createErrorResponse('NOT_FOUND', '일치하는 계정 정보를 찾을 수 없습니다.');
  }

  // 이메일 마스킹
  const { maskEmail } = await import('./common.service');
  const maskedEmail = maskEmail(org.email);

  return createSuccessResponse({ maskedEmail });
}
