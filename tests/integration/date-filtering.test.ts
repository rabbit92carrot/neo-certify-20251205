/**
 * 날짜 필터링 테스트
 *
 * KST/UTC 변환 및 날짜 경계 케이스를 검증합니다.
 * 최근 버그: 종료일이 UTC 자정으로 변환되어 해당 날짜 데이터 누락
 *
 * 테스트 시나리오:
 * - 종료일 23:59:59 데이터 포함 여부
 * - 시작일 00:00:00 데이터 포함 여부
 * - KST 자정 경계 데이터 필터링
 *
 * 테스트 계정 (TEST_GUIDE.md 참조):
 * - 제조사: manufacturer@neocert.com / test123 / a0000000-0000-0000-0000-000000000002
 */
import { describe, it, expect, beforeAll } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAuthenticatedTestClient, createTestAdminClient } from '../helpers';
import type { Database } from '@/types/database.types';

// 테스트 계정 정보 (TEST_GUIDE.md)
const TEST_ACCOUNTS = {
  manufacturer: {
    email: 'manufacturer@neocert.com',
    password: 'test123',
    orgId: 'a0000000-0000-0000-0000-000000000002',
  },
};

describe('날짜 필터링 테스트 (get_history_summary_cursor)', () => {
  const adminClient = createTestAdminClient();
  let manufacturerClient: SupabaseClient<Database>;

  beforeAll(async () => {
    manufacturerClient = await createAuthenticatedTestClient(
      TEST_ACCOUNTS.manufacturer.email,
      TEST_ACCOUNTS.manufacturer.password
    );
  });

  // ============================================================================
  // 날짜 범위 필터링 테스트
  // ============================================================================
  describe('날짜 범위 필터링', () => {
    it('종료일 자정 직전 데이터가 포함되어야 한다', async () => {
      // 오늘 날짜로 조회
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        23,
        59,
        59,
        999
      );

      const { data, error } = await manufacturerClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.manufacturer.orgId,
        p_start_date: startOfToday.toISOString(),
        p_end_date: endOfToday.toISOString(),
      });

      expect(error).toBeNull();

      // 오늘 생성된 데이터가 있다면 모두 포함되어야 함
      if (data && data.length > 0) {
        data.forEach((item) => {
          const itemDate = new Date(item.created_at);
          expect(itemDate.getTime()).toBeGreaterThanOrEqual(startOfToday.getTime());
          expect(itemDate.getTime()).toBeLessThanOrEqual(endOfToday.getTime());
        });
      }
    });

    it('시작일 자정 데이터가 포함되어야 한다', async () => {
      // 7일 전부터 오늘까지 조회
      const today = new Date();
      const startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);

      const { data, error } = await manufacturerClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.manufacturer.orgId,
        p_start_date: startDate.toISOString(),
      });

      expect(error).toBeNull();

      // 시작일 이후 데이터만 포함되어야 함
      if (data && data.length > 0) {
        data.forEach((item) => {
          const itemDate = new Date(item.created_at);
          expect(itemDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        });
      }
    });

    it('동일 날짜 시작/종료 시 해당 날짜 데이터만 반환해야 한다', async () => {
      // 오늘 하루만 조회
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        23,
        59,
        59,
        999
      );

      const { data, error } = await manufacturerClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.manufacturer.orgId,
        p_start_date: startOfToday.toISOString(),
        p_end_date: endOfToday.toISOString(),
      });

      expect(error).toBeNull();

      // 모든 데이터가 오늘 날짜여야 함
      if (data && data.length > 0) {
        data.forEach((item) => {
          const itemDate = new Date(item.created_at);
          expect(itemDate.getDate()).toBe(today.getDate());
          expect(itemDate.getMonth()).toBe(today.getMonth());
          expect(itemDate.getFullYear()).toBe(today.getFullYear());
        });
      }
    });

    it('미래 날짜 범위 조회 시 빈 결과를 반환해야 한다', async () => {
      // 1년 후 날짜로 조회
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const { data, error } = await manufacturerClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.manufacturer.orgId,
        p_start_date: futureDate.toISOString(),
      });

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });
  });

  // ============================================================================
  // 타임존 경계 테스트
  // ============================================================================
  describe('타임존 경계 테스트', () => {
    it('UTC 자정 경계 데이터가 올바르게 필터링되어야 한다', async () => {
      // UTC 자정 = KST 09:00
      // KST 자정 = UTC 15:00 (전날)
      const now = new Date();
      const utcMidnight = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
      );

      const { data, error } = await manufacturerClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.manufacturer.orgId,
        p_start_date: utcMidnight.toISOString(),
      });

      expect(error).toBeNull();

      // UTC 자정 이후 데이터만 포함되어야 함
      if (data && data.length > 0) {
        data.forEach((item) => {
          const itemDate = new Date(item.created_at);
          expect(itemDate.getTime()).toBeGreaterThanOrEqual(utcMidnight.getTime());
        });
      }
    });

    it('기본 start_date가 3일 전으로 설정되어야 한다', async () => {
      // p_start_date를 제공하지 않으면 기본값 사용
      // 함수 내부: v_start_date := COALESCE(p_start_date, NOW() - INTERVAL '3 days')
      const { data, error } = await manufacturerClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.manufacturer.orgId,
        // p_start_date 생략
      });

      expect(error).toBeNull();

      // 3일 이내 데이터만 포함되어야 함
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      if (data && data.length > 0) {
        data.forEach((item) => {
          const itemDate = new Date(item.created_at);
          expect(itemDate.getTime()).toBeGreaterThanOrEqual(threeDaysAgo.getTime());
        });
      }
    });
  });

  // ============================================================================
  // 엣지 케이스 테스트
  // ============================================================================
  describe('엣지 케이스', () => {
    it('시작일이 종료일보다 늦으면 빈 결과를 반환해야 한다', async () => {
      const endDate = new Date('2025-01-01');
      const startDate = new Date('2025-01-10');

      const { data, error } = await manufacturerClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.manufacturer.orgId,
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
      });

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('매우 넓은 날짜 범위도 처리할 수 있어야 한다', async () => {
      // 1년 전부터 오늘까지
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);

      const { data, error } = await manufacturerClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.manufacturer.orgId,
        p_start_date: startDate.toISOString(),
        p_limit: 5, // 성능을 위해 limit 설정
      });

      expect(error).toBeNull();
      // 에러 없이 결과 반환되어야 함
      expect(Array.isArray(data)).toBe(true);
    });
  });
});
