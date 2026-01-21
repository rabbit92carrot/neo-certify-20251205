/**
 * Rate Limiting Unit Tests
 *
 * src/lib/rate-limit.ts의 유틸리티 함수 테스트
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Upstash 모듈 모킹 - vi.mock은 hoisting되므로 factory 내에서 모든 것을 정의
vi.mock('@upstash/ratelimit', () => {
  const mockLimit = vi.fn().mockResolvedValue({
    success: true,
    remaining: 19,
    reset: Date.now() + 5 * 60 * 1000,
  });

  class MockRatelimit {
    limit = mockLimit;
    static slidingWindow() {
      return {};
    }
  }

  return { Ratelimit: MockRatelimit };
});

vi.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: () => ({}),
  },
}));

// 모킹 후 임포트
import {
  getClientIP,
  createRateLimitKey,
  formatRetryAfter,
  checkAuthRateLimit,
  checkRegisterRateLimit,
  RATE_LIMIT_CONFIGS,
} from '@/lib/rate-limit';

describe('Rate Limiting Unit Tests', () => {
  // ============================================================================
  // getClientIP Tests
  // ============================================================================
  describe('getClientIP()', () => {
    it('x-forwarded-for 헤더에서 첫 번째 IP 추출', () => {
      const headers = new Headers();
      headers.set('x-forwarded-for', '192.168.1.100, 10.0.0.1, 172.16.0.1');

      const ip = getClientIP(headers);
      expect(ip).toBe('192.168.1.100');
    });

    it('x-forwarded-for 단일 IP 추출', () => {
      const headers = new Headers();
      headers.set('x-forwarded-for', '203.0.113.50');

      const ip = getClientIP(headers);
      expect(ip).toBe('203.0.113.50');
    });

    it('x-forwarded-for 없을 때 x-real-ip 사용', () => {
      const headers = new Headers();
      headers.set('x-real-ip', '192.168.1.200');

      const ip = getClientIP(headers);
      expect(ip).toBe('192.168.1.200');
    });

    it('모든 헤더 없을 때 127.0.0.1 반환', () => {
      const headers = new Headers();

      const ip = getClientIP(headers);
      expect(ip).toBe('127.0.0.1');
    });

    it('x-forwarded-for IP 앞뒤 공백 제거', () => {
      const headers = new Headers();
      headers.set('x-forwarded-for', '  192.168.1.100  , 10.0.0.1');

      const ip = getClientIP(headers);
      expect(ip).toBe('192.168.1.100');
    });

    it('x-forwarded-for가 빈 문자열일 때 x-real-ip 사용', () => {
      const headers = new Headers();
      headers.set('x-forwarded-for', '');
      headers.set('x-real-ip', '10.0.0.5');

      const ip = getClientIP(headers);
      expect(ip).toBe('10.0.0.5');
    });
  });

  // ============================================================================
  // createRateLimitKey Tests
  // ============================================================================
  describe('createRateLimitKey()', () => {
    it('로그인 액션 키 생성', () => {
      const key = createRateLimitKey('192.168.1.1', 'login');
      expect(key).toBe('login:192.168.1.1');
    });

    it('회원가입 액션 키 생성', () => {
      const key = createRateLimitKey('10.0.0.1', 'register');
      expect(key).toBe('register:10.0.0.1');
    });

    it('IPv6 주소 키 생성', () => {
      const key = createRateLimitKey('::1', 'login');
      expect(key).toBe('login:::1');
    });

    it('커스텀 액션 키 생성', () => {
      const key = createRateLimitKey('192.168.1.1', 'password-reset');
      expect(key).toBe('password-reset:192.168.1.1');
    });
  });

  // ============================================================================
  // formatRetryAfter Tests
  // ============================================================================
  describe('formatRetryAfter()', () => {
    it('60초 미만: 초 단위로 표시', () => {
      const now = Date.now();
      const result = formatRetryAfter(now + 30 * 1000);

      // 30초 또는 그 근처 (테스트 실행 시간 고려)
      expect(result).toMatch(/^\d+초$/);
      const seconds = parseInt(result);
      expect(seconds).toBeGreaterThanOrEqual(29);
      expect(seconds).toBeLessThanOrEqual(31);
    });

    it('정확히 N분: 분만 표시', () => {
      const now = Date.now();
      const result = formatRetryAfter(now + 2 * 60 * 1000);

      expect(result).toBe('2분');
    });

    it('N분 M초: 분과 초 함께 표시', () => {
      const now = Date.now();
      const result = formatRetryAfter(now + (2 * 60 + 30) * 1000);

      expect(result).toBe('2분 30초');
    });

    it('과거 타임스탬프: 0초 반환', () => {
      const past = Date.now() - 10000;
      const result = formatRetryAfter(past);

      expect(result).toBe('0초');
    });

    it('5분: 5분 표시', () => {
      const now = Date.now();
      const result = formatRetryAfter(now + 5 * 60 * 1000);

      expect(result).toBe('5분');
    });

    it('30분: 30분 표시', () => {
      const now = Date.now();
      const result = formatRetryAfter(now + 30 * 60 * 1000);

      expect(result).toBe('30분');
    });

    it('1초: 1초 표시', () => {
      const now = Date.now();
      const result = formatRetryAfter(now + 1000);

      expect(result).toMatch(/^[01]초$/); // 0 or 1 due to timing
    });
  });

  // ============================================================================
  // RATE_LIMIT_CONFIGS Tests
  // ============================================================================
  describe('RATE_LIMIT_CONFIGS', () => {
    it('auth 설정: 5분 20회', () => {
      expect(RATE_LIMIT_CONFIGS.auth.windowMs).toBe(5 * 60 * 1000);
      expect(RATE_LIMIT_CONFIGS.auth.maxRequests).toBe(20);
    });

    it('register 설정: 30분 10회', () => {
      expect(RATE_LIMIT_CONFIGS.register.windowMs).toBe(30 * 60 * 1000);
      expect(RATE_LIMIT_CONFIGS.register.maxRequests).toBe(10);
    });
  });

  // ============================================================================
  // Rate Limit Function Tests (with mocked Upstash)
  // 모킹된 Upstash로 함수 동작 테스트
  // ============================================================================
  describe('Rate Limit Functions (Mocked)', () => {
    it('checkAuthRateLimit: 요청 허용 및 결과 반환', async () => {
      const testIp = `test-auth-${Date.now()}-${Math.random()}`;
      const result = await checkAuthRateLimit(testIp);

      expect(result.success).toBe(true);
      expect(result.remaining).toBeDefined();
      expect(result.resetAt).toBeGreaterThan(Date.now() - 60000); // 과거 1분 이내
    });

    it('checkAuthRateLimit: 연속 호출 시 일관된 응답', async () => {
      const testIp = `test-auth-seq-${Date.now()}-${Math.random()}`;

      const result1 = await checkAuthRateLimit(testIp);
      const result2 = await checkAuthRateLimit(testIp);
      const result3 = await checkAuthRateLimit(testIp);

      // 모킹된 환경에서는 모든 요청이 성공해야 함
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);
    });

    it('checkRegisterRateLimit: 요청 허용 및 결과 반환', async () => {
      const testIp = `test-register-${Date.now()}-${Math.random()}`;
      const result = await checkRegisterRateLimit(testIp);

      expect(result.success).toBe(true);
      expect(result.remaining).toBeDefined();
      expect(result.resetAt).toBeDefined();
    });

    it('checkRegisterRateLimit: 연속 호출 시 일관된 응답', async () => {
      const testIp = `test-register-seq-${Date.now()}-${Math.random()}`;

      const result1 = await checkRegisterRateLimit(testIp);
      const result2 = await checkRegisterRateLimit(testIp);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it('서로 다른 IP로 호출 시 모두 성공', async () => {
      const testIp1 = `test-ip1-${Date.now()}-${Math.random()}`;
      const testIp2 = `test-ip2-${Date.now()}-${Math.random()}`;

      const result1 = await checkAuthRateLimit(testIp1);
      const result2 = await checkAuthRateLimit(testIp2);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('Edge Cases', () => {
    it('빈 IP 문자열 처리', async () => {
      const result = await checkAuthRateLimit('');

      expect(result.success).toBe(true);
    });

    it('특수 문자 포함 IP 처리', async () => {
      const result = await checkAuthRateLimit('192.168.1.1:8080');

      expect(result.success).toBe(true);
    });

    it('매우 긴 식별자 처리', async () => {
      const longId = 'a'.repeat(1000);
      const result = await checkAuthRateLimit(longId);

      expect(result.success).toBe(true);
    });
  });
});
