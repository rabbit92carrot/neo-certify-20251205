/**
 * Rate Limiting 유틸리티 (Upstash Redis 기반)
 *
 * 분산 환경에서 일관된 Rate Limiting을 제공합니다.
 * Upstash 환경 변수가 없는 로컬 개발 환경에서는 인메모리 폴백을 사용합니다.
 *
 * 설계 원칙:
 * - 정상 사용자 경험 보호 (관대한 설정)
 * - 악의적 공격에 대한 방어 레이어
 * - 분산 환경에서 일관된 Rate Limiting
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { createLogger } from '@/lib/logger';

const logger = createLogger('rate-limit');

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

/**
 * Upstash 환경 변수 설정 여부 확인
 */
function isUpstashConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

// Upstash Redis 인스턴스 (환경 변수 자동 로드)
// 환경 변수가 없으면 null
let redis: Redis | null = null;
let authLimiter: Ratelimit | null = null;
let registerLimiter: Ratelimit | null = null;

// Upstash 설정이 있으면 Redis 및 Rate Limiter 초기화
if (isUpstashConfigured()) {
  redis = Redis.fromEnv();

  // 로그인: 5분당 20회 (슬라이딩 윈도우)
  authLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '5 m'),
    prefix: 'ratelimit:auth',
    analytics: false,
  });

  // 회원가입: 30분당 10회 (슬라이딩 윈도우)
  registerLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '30 m'),
    prefix: 'ratelimit:register',
    analytics: false,
  });
}

// ============================================================================
// 로컬 개발용 인메모리 폴백
// ============================================================================

interface LocalRateLimitEntry {
  count: number;
  resetAt: number;
}

const localStore = new Map<string, LocalRateLimitEntry>();

const LOCAL_CONFIGS = {
  auth: { windowMs: 5 * 60 * 1000, maxRequests: 20 },
  register: { windowMs: 30 * 60 * 1000, maxRequests: 10 },
} as const;

/**
 * E2E 테스트 환경인지 확인
 * Playwright 테스트 시 rate limit 비활성화
 */
function isE2ETestEnvironment(): boolean {
  return process.env.PLAYWRIGHT_TEST === 'true' || process.env.E2E_TEST === 'true';
}

/**
 * 로컬 인메모리 Rate Limit 체크
 */
function checkLocalRateLimit(
  key: string,
  config: { windowMs: number; maxRequests: number }
): RateLimitResult {
  const now = Date.now();
  const entry = localStore.get(key);

  // 새로운 윈도우 시작
  if (!entry || entry.resetAt < now) {
    localStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  // 제한 초과
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // 허용
  entry.count++;
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

// ============================================================================
// Public API
// ============================================================================

/**
 * 관대한 Rate Limit 설정 (정상 사용자 친화적)
 *
 * @deprecated Upstash Rate Limiter를 직접 사용하세요.
 *             하위 호환성을 위해 유지됩니다.
 */
export const RATE_LIMIT_CONFIGS = {
  /** 로그인: 5분에 20회 */
  auth: { windowMs: 5 * 60 * 1000, maxRequests: 20 },
  /** 회원가입: 30분에 10회 */
  register: { windowMs: 30 * 60 * 1000, maxRequests: 10 },
} as const;

/**
 * 로그인 Rate Limit 체크
 *
 * @param identifier 고유 식별자 (예: 클라이언트 IP)
 * @returns Rate Limit 체크 결과
 */
export async function checkAuthRateLimit(identifier: string): Promise<RateLimitResult> {
  // E2E 테스트 환경에서는 rate limit 비활성화
  if (isE2ETestEnvironment()) {
    return { success: true, remaining: 999, resetAt: Date.now() + 5 * 60 * 1000 };
  }

  // Upstash 사용 가능한 경우
  if (authLimiter) {
    try {
      const result = await authLimiter.limit(identifier);
      return {
        success: result.success,
        remaining: result.remaining,
        resetAt: result.reset,
      };
    } catch (error) {
      // Upstash 오류 시 허용 (fail-open)
      logger.error('Rate limit error (auth):', error);
      return { success: true, remaining: 20, resetAt: Date.now() + 5 * 60 * 1000 };
    }
  }

  // 로컬 폴백
  return checkLocalRateLimit(`auth:${identifier}`, LOCAL_CONFIGS.auth);
}

/**
 * 회원가입 Rate Limit 체크
 *
 * @param identifier 고유 식별자 (예: 클라이언트 IP)
 * @returns Rate Limit 체크 결과
 */
export async function checkRegisterRateLimit(identifier: string): Promise<RateLimitResult> {
  // E2E 테스트 환경에서는 rate limit 비활성화
  if (isE2ETestEnvironment()) {
    return { success: true, remaining: 999, resetAt: Date.now() + 30 * 60 * 1000 };
  }

  // Upstash 사용 가능한 경우
  if (registerLimiter) {
    try {
      const result = await registerLimiter.limit(identifier);
      return {
        success: result.success,
        remaining: result.remaining,
        resetAt: result.reset,
      };
    } catch (error) {
      // Upstash 오류 시 허용 (fail-open)
      logger.error('Rate limit error (register):', error);
      return { success: true, remaining: 10, resetAt: Date.now() + 30 * 60 * 1000 };
    }
  }

  // 로컬 폴백
  return checkLocalRateLimit(`register:${identifier}`, LOCAL_CONFIGS.register);
}

/**
 * Rate Limit 체크 (하위 호환성)
 *
 * @deprecated checkAuthRateLimit 또는 checkRegisterRateLimit를 사용하세요.
 * @param key 고유 식별자 (예: "login:192.168.1.1")
 * @param config Rate Limit 설정
 * @returns Rate Limit 체크 결과
 */
export async function checkRateLimit(
  key: string,
  config: { windowMs: number; maxRequests: number }
): Promise<RateLimitResult> {
  // 키에서 액션 타입 추출
  const isAuth = key.startsWith('login:') || key.startsWith('auth:');
  const isRegister = key.startsWith('register:');

  // 식별자 추출 (IP 부분)
  const identifier = key.split(':')[1] || key;

  if (isAuth) {
    return checkAuthRateLimit(identifier);
  }
  if (isRegister) {
    return checkRegisterRateLimit(identifier);
  }

  // 알 수 없는 타입은 로컬 폴백
  return checkLocalRateLimit(key, config);
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
