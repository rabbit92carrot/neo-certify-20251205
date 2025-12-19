/**
 * 시간 계산 유틸리티
 */

/**
 * 시간 차이 계산 (밀리초 단위)
 */
export function getTimeDifferenceMs(from: Date, to: Date = new Date()): number {
  return to.getTime() - from.getTime();
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
 * 24시간 이내인지 확인
 */
export function isWithin24Hours(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const twentyFourHoursMs = 24 * 60 * 60 * 1000;
  return getTimeDifferenceMs(d) < twentyFourHoursMs;
}

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
