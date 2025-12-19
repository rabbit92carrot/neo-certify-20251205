/**
 * 유효성 검사 유틸리티
 */

import { normalizePhoneNumber } from './format';

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
