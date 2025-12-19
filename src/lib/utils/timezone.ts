/**
 * 시간대 처리 유틸리티
 *
 * Neo-Certify 프로젝트의 시간대 정책:
 * - DB 저장: UTC (TIMESTAMPTZ)
 * - DB 조회/비교: UTC
 * - 표시: 한국 시간 (Asia/Seoul)
 *
 * 주의:
 * - 날짜 입력(date input)은 사용자 로컬 시간으로 받음
 * - DB 쿼리 시 날짜 경계는 한국 시간 기준으로 변환 후 사용
 */

const KOREA_TIMEZONE = 'Asia/Seoul';
const KOREA_OFFSET_HOURS = 9;

/**
 * 한국 시간 기준 날짜의 시작 시간 (00:00:00)을 UTC로 변환
 * @param dateStr 날짜 문자열 (YYYY-MM-DD 형식)
 * @returns ISO 8601 형식의 UTC 시간 문자열
 *
 * @example
 * // 2024-01-15 한국 시간 00:00:00 = 2024-01-14T15:00:00Z UTC
 * getStartOfDayInKorea('2024-01-15') // '2024-01-14T15:00:00.000Z'
 */
export function getStartOfDayInKorea(dateStr: string): string {
  // 한국 시간 00:00:00을 UTC로 변환 (UTC = 한국시간 - 9시간)
  const [year, month, day] = dateStr.split('-').map(Number);
  const koreaDate = new Date(Date.UTC(year!, month! - 1, day!, 0, 0, 0));
  koreaDate.setUTCHours(koreaDate.getUTCHours() - KOREA_OFFSET_HOURS);
  return koreaDate.toISOString();
}

/**
 * 한국 시간 기준 날짜의 종료 시간 (23:59:59.999)을 UTC로 변환
 * @param dateStr 날짜 문자열 (YYYY-MM-DD 형식)
 * @returns ISO 8601 형식의 UTC 시간 문자열
 *
 * @example
 * // 2024-01-15 한국 시간 23:59:59 = 2024-01-15T14:59:59Z UTC
 * getEndOfDayInKorea('2024-01-15') // '2024-01-15T14:59:59.999Z'
 */
export function getEndOfDayInKorea(dateStr: string): string {
  // 한국 시간 23:59:59.999를 UTC로 변환
  const [year, month, day] = dateStr.split('-').map(Number);
  const koreaDate = new Date(Date.UTC(year!, month! - 1, day!, 23, 59, 59, 999));
  koreaDate.setUTCHours(koreaDate.getUTCHours() - KOREA_OFFSET_HOURS);
  return koreaDate.toISOString();
}

/**
 * UTC 시간을 한국 시간 문자열로 변환
 * @param utcDate UTC Date 객체 또는 ISO 문자열
 * @param format 출력 형식 ('date' | 'datetime' | 'full')
 * @returns 한국 시간 문자열
 *
 * @example
 * formatToKoreaTime(new Date('2024-01-15T15:00:00Z'), 'datetime')
 * // '2024-01-16 00:00'
 */
export function formatToKoreaTime(
  utcDate: Date | string,
  format: 'date' | 'datetime' | 'full' = 'datetime'
): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;

  const options: Intl.DateTimeFormatOptions = {
    timeZone: KOREA_TIMEZONE,
  };

  switch (format) {
    case 'date':
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
      break;
    case 'datetime':
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.hour12 = false;
      break;
    case 'full':
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.second = '2-digit';
      options.hour12 = false;
      break;
  }

  return date.toLocaleString('ko-KR', options);
}

/**
 * 오늘 날짜를 한국 시간 기준 YYYY-MM-DD 형식으로 반환
 */
export function getTodayInKorea(): string {
  const now = new Date();
  const koreaDate = new Date(now.getTime() + KOREA_OFFSET_HOURS * 60 * 60 * 1000);
  return koreaDate.toISOString().split('T')[0]!;
}

/**
 * 현재 시간이 한국 시간 기준으로 특정 시간 이후인지 확인
 * @param hours 시간 (0-23)
 * @param minutes 분 (0-59)
 */
export function isAfterKoreaTime(hours: number, minutes: number = 0): boolean {
  const now = new Date();
  const koreaHours = (now.getUTCHours() + KOREA_OFFSET_HOURS) % 24;
  const koreaMinutes = now.getUTCMinutes();

  if (koreaHours > hours) {return true;}
  if (koreaHours === hours && koreaMinutes >= minutes) {return true;}
  return false;
}

/**
 * 두 날짜 사이의 한국 시간 기준 일수 차이
 */
export function getDaysDifferenceInKorea(
  startDate: Date | string,
  endDate: Date | string
): number {
  const start = getStartOfDayInKorea(
    typeof startDate === 'string'
      ? startDate.split('T')[0]!
      : startDate.toISOString().split('T')[0]!
  );
  const end = getStartOfDayInKorea(
    typeof endDate === 'string'
      ? endDate.split('T')[0]!
      : endDate.toISOString().split('T')[0]!
  );

  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * PostgreSQL에서 사용할 시간대 변환 SQL 조각
 * DB 함수에서 직접 사용할 때 참고용
 */
export const SQL_TIMEZONE = {
  // UTC를 한국 시간으로 변환
  TO_KOREA: `AT TIME ZONE 'Asia/Seoul'`,
  // 한국 시간을 UTC로 변환
  FROM_KOREA: `AT TIME ZONE 'Asia/Seoul' AT TIME ZONE 'UTC'`,
} as const;
