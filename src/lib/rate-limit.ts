/**
 * Rate Limiting 유틸리티
 *
 * 인메모리 슬라이딩 윈도우 방식의 Rate Limiting 구현.
 * 서버리스 환경에서는 인스턴스별로 독립적으로 동작합니다.
 *
 * 설계 원칙:
 * - 정상 사용자 경험 보호 (관대한 설정)
 * - 악의적 공격에 대한 기본 방어 레이어
 */

/**
 * Rate Limit 설정 인터페이스
 */
interface RateLimitConfig {
  /** 시간 윈도우 (밀리초) */
  windowMs: number;
  /** 최대 요청 수 */
  maxRequests: number;
}

/**
 * Rate Limit 엔트리 (내부 저장용)
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Rate Limit 체크 결과
 */
export interface RateLimitResult {
  /** 요청 허용 여부 */
  success: boolean;
  /** 남은 요청 횟수 */
  remaining: number;
  /** 리셋 시간 (Unix timestamp) */
  resetAt: number;
}

// 인메모리 저장소 (서버리스 환경에서는 인스턴스별 독립)
const store = new Map<string, RateLimitEntry>();

// 만료된 엔트리 정리 (메모리 누수 방지)
const CLEANUP_INTERVAL_MS = 60 * 1000; // 1분
let lastCleanup = Date.now();

/**
 * 만료된 Rate Limit 엔트리 정리
 */
function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
    return;
  }

  lastCleanup = now;
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}

/**
 * 관대한 Rate Limit 설정 (정상 사용자 친화적)
 *
 * 설정 근거:
 * - 로그인: 비밀번호 오타, 여러 계정 순차 로그인 등 정상 사용 패턴 수용
 * - 회원가입: 동일 IP에서 여러 조직 등록(지사 등) 시나리오 허용
 */
export const RATE_LIMIT_CONFIGS = {
  /** 로그인: 5분에 20회 */
  auth: { windowMs: 5 * 60 * 1000, maxRequests: 20 },
  /** 회원가입: 30분에 10회 (테스트 환경 고려) */
  register: { windowMs: 30 * 60 * 1000, maxRequests: 10 },
} as const;

/**
 * Rate Limit 체크
 *
 * @param key 고유 식별자 (예: "login:192.168.1.1")
 * @param config Rate Limit 설정
 * @returns Rate Limit 체크 결과
 *
 * @example
 * ```typescript
 * const result = checkRateLimit('login:192.168.1.1', RATE_LIMIT_CONFIGS.auth);
 * if (!result.success) {
 *   return createErrorResponse('RATE_LIMIT_EXCEEDED', '...');
 * }
 * ```
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  // 새로운 윈도우 시작
  if (!entry || entry.resetAt < now) {
    store.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  // 기존 윈도우 내 요청 - 제한 초과
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // 기존 윈도우 내 요청 - 허용
  entry.count++;
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * IP 주소 추출 (Next.js headers 기반)
 *
 * @param headersList Next.js headers 객체
 * @returns 클라이언트 IP 주소
 */
export function getClientIP(headersList: Headers): string {
  // Vercel/Cloudflare 등 프록시 환경
  const forwarded = headersList.get('x-forwarded-for');
  if (forwarded) {
    const firstIP = forwarded.split(',')[0];
    if (firstIP) {
      return firstIP.trim();
    }
  }

  const realIP = headersList.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // 개발 환경 폴백
  return '127.0.0.1';
}

/**
 * Rate Limit 키 생성
 *
 * @param ip 클라이언트 IP 주소
 * @param action 액션 이름 (예: 'login', 'register')
 * @returns Rate Limit 키
 */
export function createRateLimitKey(ip: string, action: string): string {
  return `${action}:${ip}`;
}

/**
 * 남은 시간을 사람이 읽기 쉬운 형식으로 변환
 *
 * @param resetAt 리셋 시간 (Unix timestamp)
 * @returns 남은 시간 문자열 (예: "2분 30초")
 */
export function formatRetryAfter(resetAt: number): string {
  const now = Date.now();
  const remainingMs = Math.max(0, resetAt - now);
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  if (remainingSeconds < 60) {
    return `${remainingSeconds}초`;
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  if (seconds === 0) {
    return `${minutes}분`;
  }

  return `${minutes}분 ${seconds}초`;
}
