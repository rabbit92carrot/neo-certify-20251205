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
