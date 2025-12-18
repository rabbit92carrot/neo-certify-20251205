/**
 * 포맷팅 유틸리티
 * 전화번호, 사업자번호, 숫자, 파일크기 등 포맷 변환
 */

/**
 * 전화번호 정규화
 * 하이픈, 공백 제거하여 숫자만 반환
 */
export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[\s-]/g, '');
}

/**
 * 전화번호 포맷팅
 * 01012345678 -> 010-1234-5678
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

/**
 * 전화번호 마스킹 (개인정보 보호)
 * 01012345678 -> 010****5678
 */
export function maskPhoneNumber(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  if (normalized.length < 7) {
    return phone;
  }
  return `${normalized.slice(0, 3)}****${normalized.slice(-4)}`;
}

/**
 * 사업자등록번호 포맷팅
 * 123-45-67890 형식으로 변환
 */
export function formatBusinessNumber(businessNumber: string): string {
  const cleaned = businessNumber.replace(/\D/g, '');
  if (cleaned.length !== 10) {
    return businessNumber;
  }
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
}

/**
 * 숫자를 콤마가 있는 문자열로 포맷팅
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR');
}

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
