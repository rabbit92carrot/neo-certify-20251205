/**
 * 앱 설정 상수 정의
 * SSOT 원칙에 따라 모든 설정 값을 이 파일에서 정의합니다.
 */

export const CONFIG = {
  // 수량 제한
  QUANTITY: {
    MIN: 1,
    MAX_PRODUCTION: 100000,
  },

  // 회수 시간 제한 (밀리초)
  RECALL_TIME_LIMIT_MS: 24 * 60 * 60 * 1000, // 24시간
  RECALL_TIME_LIMIT_HOURS: 24,

  // 사용기한 옵션 (개월)
  EXPIRY_MONTH_OPTIONS: [6, 12, 18, 24, 30, 36] as const,
  DEFAULT_EXPIRY_MONTHS: 24,

  // Lot 번호 기본 설정
  LOT_DEFAULTS: {
    PREFIX: 'ND',
    MODEL_DIGITS: 5,
    DATE_FORMAT: 'yymmdd',
  },

  // 파일 업로드
  FILE_UPLOAD: {
    MAX_SIZE_MB: 10,
    MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['application/pdf', 'image/jpeg', 'image/png'] as const,
    ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png'] as const,
  },

  // 페이지네이션
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
  },

  // 타임존
  TIMEZONE: 'Asia/Seoul',

  // 비밀번호 정책
  PASSWORD: {
    MIN_LENGTH: 6,
  },

  // 앱 정보
  APP: {
    NAME: '네오인증서',
    COMPANY: '주식회사 네오닥터',
  },
} as const;

// 타입 추출
export type ExpiryMonthOption = (typeof CONFIG.EXPIRY_MONTH_OPTIONS)[number];
export type AllowedFileType = (typeof CONFIG.FILE_UPLOAD.ALLOWED_TYPES)[number];
