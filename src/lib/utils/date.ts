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

/**
 * 종료일을 해당 일자 끝까지 포함하도록 변환 (한국 시간 KST 기준)
 * DB 쿼리에서 날짜 범위의 종료 시점을 정의할 때 사용
 * PostgreSQL이 +09:00 오프셋을 인식하여 UTC로 자동 변환
 *
 * @param dateString yyyy-MM-dd 형식의 날짜 문자열
 * @returns ISO 8601 형식의 해당 일자 KST 23:59:59.999
 * @example
 * toEndOfDayKST('2025-01-05') // '2025-01-05T23:59:59.999+09:00'
 */
export function toEndOfDayKST(dateString: string): string {
  return `${dateString}T23:59:59.999+09:00`;
}

/**
 * 시작일을 해당 일자 시작부터 포함하도록 변환 (한국 시간 KST 기준)
 * DB 쿼리에서 날짜 범위의 시작 시점을 정의할 때 사용
 * PostgreSQL이 +09:00 오프셋을 인식하여 UTC로 자동 변환
 *
 * @param dateString yyyy-MM-dd 형식의 날짜 문자열
 * @returns ISO 8601 형식의 해당 일자 KST 00:00:00.000
 * @example
 * toStartOfDayKST('2025-01-05') // '2025-01-05T00:00:00.000+09:00'
 */
export function toStartOfDayKST(dateString: string): string {
  return `${dateString}T00:00:00.000+09:00`;
}
