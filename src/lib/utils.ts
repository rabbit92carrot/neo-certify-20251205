/**
 * 유틸리티 함수 모듈
 * shadcn/ui와 호환되는 cn 함수 + 앱 전용 유틸리티 함수들
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind CSS 클래스 병합 유틸리티
 * clsx와 tailwind-merge를 조합하여 조건부 클래스와 중복 클래스를 처리
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * 전화번호 정규화
 * 하이픈, 공백 제거하여 숫자만 반환
 */
export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[\s-]/g, '');
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
 * 날짜를 ISO 8601 형식 문자열로 변환
 * Asia/Seoul 타임존 기준
 */
export function toISODateString(date: Date): string {
  return date.toISOString();
}

/**
 * 날짜를 한국어 형식으로 포맷팅
 * YYYY년 MM월 DD일
 */
export function formatDateKorean(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${year}년 ${month}월 ${day}일`;
}

/**
 * 날짜를 간단한 형식으로 포맷팅
 * YYYY-MM-DD
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0] ?? '';
}

/**
 * 시간 차이 계산 (밀리초 단위)
 */
export function getTimeDifferenceMs(from: Date, to: Date = new Date()): number {
  return to.getTime() - from.getTime();
}

/**
 * 24시간 이내인지 확인
 */
export function isWithin24Hours(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const twentyFourHoursMs = 24 * 60 * 60 * 1000;
  return getTimeDifferenceMs(d) < twentyFourHoursMs;
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

// ============================================================
// 타임존 관련 유틸리티 (Asia/Seoul 기준)
// ============================================================

/**
 * 한국 시간 기준 오늘 날짜 (YYYY-MM-DD)
 */
export function getKoreaToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}

/**
 * 한국 시간 기준 오늘 시작 시간 (ISO 문자열)
 * 00:00:00 KST
 */
export function getKoreaTodayStart(): string {
  const koreaToday = getKoreaToday();
  return new Date(`${koreaToday}T00:00:00+09:00`).toISOString();
}

/**
 * 한국 시간 기준 오늘 끝 시간 (ISO 문자열)
 * 23:59:59.999 KST
 */
export function getKoreaTodayEnd(): string {
  const koreaToday = getKoreaToday();
  return new Date(`${koreaToday}T23:59:59.999+09:00`).toISOString();
}

/**
 * 두 날짜 사이의 시간 차이 (시간 단위)
 */
export function getHoursDifference(from: Date | string, to: Date | string = new Date()): number {
  const fromDate = typeof from === 'string' ? new Date(from) : from;
  const toDate = typeof to === 'string' ? new Date(to) : to;
  return (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60);
}

/**
 * 날짜를 한국 시간 기준으로 포맷팅
 * YYYY-MM-DD HH:mm
 */
export function formatDateTimeKorea(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * 전화번호 마스킹 (개인정보 보호)
 * 01012345678 -> 010****5678
 */
export function maskPhoneNumber(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  if (normalized.length < 7) {return phone;}
  return `${normalized.slice(0, 3)}****${normalized.slice(-4)}`;
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

// ============================================================
// CSV 유틸리티
// ============================================================

/**
 * CSV 필드 이스케이프
 * 쉼표, 줄바꿈, 큰따옴표가 포함된 경우 처리
 */
function escapeCsvField(field: string | number | boolean | null | undefined): string {
  if (field === null || field === undefined) {
    return '';
  }
  const stringField = String(field);
  // 쉼표, 줄바꿈, 큰따옴표가 포함된 경우 큰따옴표로 감싸고 내부 큰따옴표는 두 번 반복
  if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
}

/**
 * 객체 배열을 CSV 문자열로 변환
 * @param data 데이터 배열
 * @param headers 헤더 정의 { key: 객체의 키, label: CSV 헤더 표시명 }
 */
export function generateCsvString<T extends Record<string, unknown>>(
  data: T[],
  headers: { key: keyof T; label: string }[]
): string {
  // 헤더 행
  const headerRow = headers.map((h) => escapeCsvField(h.label)).join(',');

  // 데이터 행
  const dataRows = data.map((row) =>
    headers
      .map((h) => {
        const value = row[h.key];
        return escapeCsvField(value as string | number | boolean | null | undefined);
      })
      .join(',')
  );

  // BOM + 헤더 + 데이터 (한글 인코딩을 위해 BOM 추가)
  return '\uFEFF' + [headerRow, ...dataRows].join('\n');
}

/**
 * CSV 문자열을 파일로 다운로드
 * @param csvString CSV 문자열
 * @param filename 파일명 (확장자 포함)
 */
export function downloadCsv(csvString: string, filename: string): void {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
