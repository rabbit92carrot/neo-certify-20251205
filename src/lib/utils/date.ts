/**
 * 날짜 포맷팅 유틸리티
 */

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
