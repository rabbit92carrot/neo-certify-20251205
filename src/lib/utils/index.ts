/**
 * 유틸리티 함수 모듈
 * 모든 유틸리티 함수를 re-export하여 기존 import 호환성 유지
 *
 * @example
 * // 기존 방식 (계속 작동)
 * import { cn, formatDate } from '@/lib/utils';
 *
 * // 새로운 방식 (도메인별 import 가능)
 * import { cn } from '@/lib/utils/ui';
 * import { formatDate } from '@/lib/utils/date';
 */

// UI
export { cn } from './ui';

// Validation
export { isValidPhoneNumber, isValidBusinessNumber, formatZodErrors } from './validation';

// Format
export {
  normalizePhoneNumber,
  formatPhoneNumber,
  maskPhoneNumber,
  formatBusinessNumber,
  formatNumber,
  formatFileSize,
} from './format';

// Date
export {
  toISODateString,
  formatDateKorean,
  formatDate,
  formatDateTimeKorea,
  toEndOfDayKST,
  toStartOfDayKST,
} from './date';

// Time
export {
  getTimeDifferenceMs,
  getHoursDifference,
  isWithin24Hours,
  getKoreaToday,
  getKoreaTodayStart,
  getKoreaTodayEnd,
} from './time';

// Timezone (기존 파일 - 고급 시간대 유틸)
export * from './timezone';

// CSV
export { generateCsvString, downloadCsv } from './csv';

// Database
export { escapePostgrestFilter, buildIlikeFilter } from './db';

// Redirect
export { validateRedirectPath, getSafeRedirectPath } from './redirect';
