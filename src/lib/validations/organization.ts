/**
 * 조직 관련 Zod 유효성 검사 스키마
 */

import { z } from 'zod';
import {
  emailSchema,
  passwordSchema,
  businessNumberInputSchema,
  phoneNumberInputSchema,
  fileUploadSchema,
  maxLengthStringSchema,
  uuidSchema,
} from './common';
import { ORGANIZATION_TYPES, CONFIG } from '@/constants';
import { ERROR_MESSAGES } from '@/constants';

// ============================================================================
// 조직 유형 스키마
// ============================================================================

/**
 * 조직 유형 스키마 (제조사/유통사/병원)
 * 관리자는 일반 회원가입에서 제외
 */
export const organizationTypeSchema = z.enum(
  [
    ORGANIZATION_TYPES.MANUFACTURER,
    ORGANIZATION_TYPES.DISTRIBUTOR,
    ORGANIZATION_TYPES.HOSPITAL,
  ] as const,
  {
    message: ERROR_MESSAGES.GENERAL.INVALID_INPUT('조직 유형'),
  }
);

/**
 * 모든 조직 유형 스키마 (관리자 포함)
 */
export const allOrganizationTypeSchema = z.enum(
  [
    ORGANIZATION_TYPES.MANUFACTURER,
    ORGANIZATION_TYPES.DISTRIBUTOR,
    ORGANIZATION_TYPES.HOSPITAL,
    ORGANIZATION_TYPES.ADMIN,
  ] as const,
  {
    message: ERROR_MESSAGES.GENERAL.INVALID_INPUT('조직 유형'),
  }
);

// ============================================================================
// 조직 정보 스키마
// ============================================================================

/**
 * 조직 기본 정보 스키마
 */
export const organizationInfoSchema = z.object({
  name: maxLengthStringSchema('조직명', 100),
  businessNumber: businessNumberInputSchema,
  representativeName: maxLengthStringSchema('대표자명', 50),
  representativeContact: phoneNumberInputSchema,
  address: maxLengthStringSchema('주소', 200),
});

/**
 * 조직 회원가입 기본 스키마 (refine 없음)
 */
const organizationRegisterBaseSchema = z.object({
  // 인증 정보
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, ERROR_MESSAGES.GENERAL.REQUIRED_FIELD('비밀번호 확인')),

  // 조직 유형
  organizationType: organizationTypeSchema,

  // 조직 정보
  name: maxLengthStringSchema('조직명', 100),
  businessNumber: businessNumberInputSchema,
  representativeName: maxLengthStringSchema('대표자명', 50),
  representativeContact: phoneNumberInputSchema,
  address: maxLengthStringSchema('주소', 200),
});

/**
 * 비밀번호 확인 refine 함수
 */
const passwordConfirmRefine = (data: { password: string; confirmPassword: string }) =>
  data.password === data.confirmPassword;

const passwordConfirmRefinement = {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['confirmPassword'],
};

/**
 * 조직 회원가입 스키마 (전체)
 */
export const organizationRegisterSchema = organizationRegisterBaseSchema.refine(
  passwordConfirmRefine,
  passwordConfirmRefinement
);

/**
 * 조직 회원가입 스키마 (파일 포함)
 * 클라이언트에서 파일 업로드 포함 검증 시 사용
 */
export const organizationRegisterWithFileSchema = organizationRegisterBaseSchema
  .extend({
    businessLicenseFile: fileUploadSchema,
  })
  .refine(passwordConfirmRefine, passwordConfirmRefinement);

/**
 * 조직 정보 수정 스키마
 */
export const organizationUpdateSchema = z.object({
  name: maxLengthStringSchema('조직명', 100).optional(),
  representativeName: maxLengthStringSchema('대표자명', 50).optional(),
  representativeContact: phoneNumberInputSchema.optional(),
  address: maxLengthStringSchema('주소', 200).optional(),
});

// ============================================================================
// 제조사 설정 스키마
// ============================================================================

/**
 * 사용기한 개월 수 스키마
 */
export const expiryMonthsSchema = z
  .number()
  .int()
  .refine(
    (val) => (CONFIG.EXPIRY_MONTH_OPTIONS as readonly number[]).includes(val),
    {
      message: `사용기한은 ${CONFIG.EXPIRY_MONTH_OPTIONS.join(', ')} 개월 중 선택해야 합니다.`,
    }
  );

/**
 * 제조사 설정 스키마
 */
export const manufacturerSettingsSchema = z.object({
  lotPrefix: z
    .string()
    .min(1, ERROR_MESSAGES.GENERAL.REQUIRED_FIELD('Lot 번호 접두어'))
    .max(10, 'Lot 번호 접두어는 10자를 초과할 수 없습니다.')
    .regex(/^[A-Z]+$/, 'Lot 번호 접두어는 대문자 알파벳만 사용 가능합니다.'),
  lotModelDigits: z
    .number()
    .int()
    .min(1, '모델 코드 자릿수는 최소 1자리 이상이어야 합니다.')
    .max(10, '모델 코드 자릿수는 최대 10자리입니다.'),
  lotDateFormat: z
    .string()
    .min(1, ERROR_MESSAGES.GENERAL.REQUIRED_FIELD('날짜 형식')),
  expiryMonths: expiryMonthsSchema,
});

/**
 * 제조사 설정 수정 스키마 (부분 수정)
 */
export const manufacturerSettingsUpdateSchema = manufacturerSettingsSchema.partial();

// ============================================================================
// 조직 관리 스키마 (관리자용)
// ============================================================================

/**
 * 조직 승인 스키마
 */
export const organizationApprovalSchema = z.object({
  organizationId: uuidSchema,
});

/**
 * 조직 상태 변경 스키마
 */
export const organizationStatusChangeSchema = z.object({
  organizationId: uuidSchema,
  status: z.enum(['ACTIVE', 'INACTIVE', 'DELETED'] as const, {
    message: ERROR_MESSAGES.GENERAL.INVALID_INPUT('조직 상태'),
  }),
});

// ============================================================================
// 타입 추출
// ============================================================================

export type OrganizationTypeValue = z.infer<typeof organizationTypeSchema>;
export type OrganizationInfoData = z.infer<typeof organizationInfoSchema>;
export type OrganizationRegisterData = z.infer<typeof organizationRegisterSchema>;
export type OrganizationRegisterWithFileData = z.infer<typeof organizationRegisterWithFileSchema>;
export type OrganizationUpdateData = z.infer<typeof organizationUpdateSchema>;
export type ManufacturerSettingsData = z.infer<typeof manufacturerSettingsSchema>;
export type ManufacturerSettingsUpdateData = z.infer<typeof manufacturerSettingsUpdateSchema>;
export type OrganizationApprovalData = z.infer<typeof organizationApprovalSchema>;
export type OrganizationStatusChangeData = z.infer<typeof organizationStatusChangeSchema>;
