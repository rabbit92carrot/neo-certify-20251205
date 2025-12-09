/**
 * 공통 Zod 유효성 검사 스키마
 * 다른 스키마에서 재사용되는 기본 스키마들을 정의합니다.
 */

import { z } from 'zod';
import { CONFIG } from '@/constants';
import { ERROR_MESSAGES } from '@/constants';

// ============================================================================
// 기본 스키마
// ============================================================================

/**
 * UUID 스키마
 */
export const uuidSchema = z.string().uuid();

/**
 * 이메일 스키마
 */
export const emailSchema = z
  .string()
  .min(1, ERROR_MESSAGES.GENERAL.REQUIRED_FIELD('이메일'))
  .email(ERROR_MESSAGES.AUTH.INVALID_EMAIL);

/**
 * 비밀번호 스키마 (최소 6자)
 */
export const passwordSchema = z
  .string()
  .min(
    CONFIG.PASSWORD.MIN_LENGTH,
    ERROR_MESSAGES.AUTH.PASSWORD_TOO_SHORT
  );

/**
 * 전화번호 스키마 (정규화된 형식: 숫자만, 10-11자리)
 * 예: 01012345678
 */
export const phoneNumberSchema = z
  .string()
  .transform((val) => val.replace(/[^0-9]/g, '')) // 숫자만 추출
  .refine(
    (val) => /^0\d{9,10}$/.test(val),
    { message: ERROR_MESSAGES.GENERAL.INVALID_INPUT('전화번호') }
  );

/**
 * 전화번호 스키마 (입력용 - 하이픈 허용)
 */
export const phoneNumberInputSchema = z
  .string()
  .min(1, ERROR_MESSAGES.GENERAL.REQUIRED_FIELD('전화번호'))
  .refine(
    (val) => {
      const normalized = val.replace(/[^0-9]/g, '');
      return /^0\d{9,10}$/.test(normalized);
    },
    { message: ERROR_MESSAGES.GENERAL.INVALID_INPUT('전화번호') }
  );

/**
 * 사업자등록번호 스키마 (10자리 숫자)
 * 예: 1234567890 또는 123-45-67890
 */
export const businessNumberSchema = z
  .string()
  .transform((val) => val.replace(/[^0-9]/g, '')) // 숫자만 추출
  .refine(
    (val) => /^\d{10}$/.test(val),
    { message: ERROR_MESSAGES.ORGANIZATION.INVALID_BUSINESS_NUMBER }
  );

/**
 * 사업자등록번호 스키마 (입력용 - 하이픈 허용)
 */
export const businessNumberInputSchema = z
  .string()
  .min(1, ERROR_MESSAGES.GENERAL.REQUIRED_FIELD('사업자등록번호'))
  .refine(
    (val) => {
      const normalized = val.replace(/[^0-9]/g, '');
      return /^\d{10}$/.test(normalized);
    },
    { message: ERROR_MESSAGES.ORGANIZATION.INVALID_BUSINESS_NUMBER }
  );

// ============================================================================
// 수량 스키마
// ============================================================================

/**
 * 기본 수량 스키마 (1 이상 정수)
 */
export const quantitySchema = z
  .number()
  .int(ERROR_MESSAGES.QUANTITY.INVALID)
  .min(CONFIG.QUANTITY.MIN, ERROR_MESSAGES.QUANTITY.MIN);

/**
 * 생산 수량 스키마 (1 ~ 100,000)
 */
export const productionQuantitySchema = z
  .number()
  .int(ERROR_MESSAGES.QUANTITY.INVALID)
  .min(CONFIG.QUANTITY.MIN, ERROR_MESSAGES.QUANTITY.MIN)
  .max(CONFIG.QUANTITY.MAX_PRODUCTION, ERROR_MESSAGES.QUANTITY.MAX_PRODUCTION);

/**
 * 수량 입력 스키마 (문자열에서 숫자로 변환)
 */
export const quantityInputSchema = z
  .string()
  .min(1, ERROR_MESSAGES.GENERAL.REQUIRED_FIELD('수량'))
  .transform((val) => parseInt(val, 10))
  .refine((val) => !isNaN(val), { message: ERROR_MESSAGES.QUANTITY.INVALID })
  .refine((val) => val >= CONFIG.QUANTITY.MIN, { message: ERROR_MESSAGES.QUANTITY.MIN });

// ============================================================================
// 날짜 스키마
// ============================================================================

/**
 * ISO 8601 날짜 스키마 (문자열)
 */
export const dateStringSchema = z.string().datetime();

/**
 * 날짜 스키마 (Date 객체)
 */
export const dateSchema = z.date();

/**
 * 날짜 입력 스키마 (YYYY-MM-DD 형식)
 */
export const dateInputSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, ERROR_MESSAGES.GENERAL.INVALID_INPUT('날짜'));

// ============================================================================
// 파일 스키마
// ============================================================================

/**
 * 파일 크기 검증 (10MB 이하)
 */
export const fileSizeSchema = z
  .number()
  .max(CONFIG.FILE_UPLOAD.MAX_SIZE_BYTES, ERROR_MESSAGES.FILE.SIZE_EXCEEDED);

/**
 * 파일 타입 검증 (PDF, JPG, PNG)
 */
export const fileTypeSchema = z
  .string()
  .refine(
    (type) =>
      (CONFIG.FILE_UPLOAD.ALLOWED_TYPES as readonly string[]).includes(type),
    { message: ERROR_MESSAGES.FILE.INVALID_TYPE }
  );

/**
 * 파일 업로드 스키마 (브라우저 File 객체용)
 */
export const fileUploadSchema = z
  .instanceof(File)
  .refine(
    (file) => file.size <= CONFIG.FILE_UPLOAD.MAX_SIZE_BYTES,
    { message: ERROR_MESSAGES.FILE.SIZE_EXCEEDED }
  )
  .refine(
    (file) =>
      (CONFIG.FILE_UPLOAD.ALLOWED_TYPES as readonly string[]).includes(
        file.type
      ),
    { message: ERROR_MESSAGES.FILE.INVALID_TYPE }
  );

/**
 * 파일 업로드 스키마 (옵셔널)
 */
export const optionalFileUploadSchema = fileUploadSchema.optional();

// ============================================================================
// 문자열 스키마
// ============================================================================

/**
 * 필수 문자열 스키마
 */
export const requiredStringSchema = (fieldName: string) =>
  z.string().min(1, ERROR_MESSAGES.GENERAL.REQUIRED_FIELD(fieldName));

/**
 * 트리밍된 필수 문자열 스키마
 */
export const trimmedRequiredStringSchema = (fieldName: string) =>
  z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, {
      message: ERROR_MESSAGES.GENERAL.REQUIRED_FIELD(fieldName),
    });

/**
 * 최대 길이 제한 문자열 스키마
 */
export const maxLengthStringSchema = (fieldName: string, maxLength: number) =>
  z
    .string()
    .min(1, ERROR_MESSAGES.GENERAL.REQUIRED_FIELD(fieldName))
    .max(maxLength, `${fieldName}은(는) ${maxLength}자를 초과할 수 없습니다.`);

// ============================================================================
// 유틸리티 타입
// ============================================================================

/**
 * 전화번호 정규화 함수
 */
export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

/**
 * 사업자등록번호 정규화 함수
 */
export function normalizeBusinessNumber(bn: string): string {
  return bn.replace(/[^0-9]/g, '');
}

/**
 * 사업자등록번호 포맷팅 함수 (123-45-67890)
 */
export function formatBusinessNumber(bn: string): string {
  const normalized = normalizeBusinessNumber(bn);
  if (normalized.length !== CONFIG.BUSINESS_NUMBER.LENGTH) {
    return bn;
  }
  return `${normalized.slice(0, 3)}-${normalized.slice(3, 5)}-${normalized.slice(5)}`;
}

/**
 * 전화번호 포맷팅 함수 (010-1234-5678)
 */
export function formatPhoneNumber(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  if (normalized.length === 11) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 7)}-${normalized.slice(7)}`;
  }
  if (normalized.length === 10) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 6)}-${normalized.slice(6)}`;
  }
  return phone;
}
