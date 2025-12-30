/**
 * 유효성 검사 유틸리티
 */

import type { ZodError } from 'zod';
import { normalizePhoneNumber } from './format';

/**
 * Zod 검증 에러를 필드별 에러 메시지 객체로 변환
 * Server Actions에서 클라이언트에 반환할 때 사용
 *
 * @param error Zod 검증 에러
 * @returns 필드별 에러 메시지 배열 객체
 *
 * @example
 * const result = schema.safeParse(data);
 * if (!result.success) {
 *   const fieldErrors = formatZodErrors(result.error);
 *   return createErrorResponse('VALIDATION_ERROR', '입력값을 확인해주세요.', fieldErrors);
 * }
 */
export function formatZodErrors(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    fieldErrors[path] ??= [];
    fieldErrors[path].push(issue.message);
  });
  return fieldErrors;
}

/**
 * 전화번호 유효성 검사
 * 한국 휴대전화 번호 형식 검증 (010-XXXX-XXXX)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  return /^01[0-9]{8,9}$/.test(normalized);
}

/**
 * 사업자등록번호 형식 검사
 * XXX-XX-XXXXX 형식
 */
export function isValidBusinessNumber(businessNumber: string): boolean {
  const cleaned = businessNumber.replace(/-/g, '');
  return /^\d{10}$/.test(cleaned);
}
