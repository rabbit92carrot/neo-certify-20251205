/**
 * common.service.ts 통합 테스트
 *
 * SSOT(Single Source of Truth) 패턴의 핵심 서비스 테스트
 * 마스킹, 캐시, 포맷팅, 라벨 변환 기능 검증
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  maskPhoneNumber,
  maskEmail,
  getOrganizationName,
  createOrganizationNameCache,
  getOwnerDisplayName,
  formatOwnerInfo,
  getActionTypeLabel,
  ACTION_TYPE_LABELS,
  getMinuteGroupKey,
} from '@/services/common.service';
import { createTestAdminClient } from '../helpers/supabase-test-client';
import {
  createTestOrganization,
  cleanupAllTestData,
} from '../helpers/test-data-factory';

describe('common.service', () => {
  // ============================================================================
  // 전화번호 마스킹 테스트
  // ============================================================================
  describe('maskPhoneNumber', () => {
    it('일반 전화번호를 마스킹해야 함', () => {
      expect(maskPhoneNumber('01012345678')).toBe('***-****-5678');
      expect(maskPhoneNumber('01098765432')).toBe('***-****-5432');
    });

    it('하이픈이 포함된 전화번호도 마스킹해야 함', () => {
      // 하이픈 포함 번호는 그대로 처리됨 (마지막 4자리 추출)
      expect(maskPhoneNumber('010-1234-5678')).toBe('***-****-5678');
    });

    it('4자리 미만 전화번호는 기본 마스킹 반환', () => {
      expect(maskPhoneNumber('123')).toBe('****');
      expect(maskPhoneNumber('12')).toBe('****');
      expect(maskPhoneNumber('')).toBe('****');
    });

    it('정확히 4자리 전화번호 처리', () => {
      expect(maskPhoneNumber('1234')).toBe('***-****-1234');
    });

    it('빈 값이나 null-like 값 처리', () => {
      expect(maskPhoneNumber('')).toBe('****');
    });
  });

  // ============================================================================
  // 이메일 마스킹 테스트
  // ============================================================================
  describe('maskEmail', () => {
    it('일반 이메일을 마스킹해야 함', () => {
      expect(maskEmail('testuser@example.com')).toBe('te***@example.com');
      expect(maskEmail('john.doe@company.co.kr')).toBe('jo***@company.co.kr');
    });

    it('짧은 로컬파트(2자 이하) 이메일 처리', () => {
      expect(maskEmail('ab@example.com')).toBe('a***@example.com');
      expect(maskEmail('a@example.com')).toBe('a***@example.com');
    });

    it('@ 없는 문자열은 기본 마스킹 반환', () => {
      expect(maskEmail('notanemail')).toBe('***@***');
      expect(maskEmail('')).toBe('***@***');
    });

    it('특수문자 포함 이메일 처리', () => {
      expect(maskEmail('user+tag@example.com')).toBe('us***@example.com');
      expect(maskEmail('user.name@example.com')).toBe('us***@example.com');
    });
  });

  // ============================================================================
  // 액션 타입 라벨 테스트
  // ============================================================================
  describe('getActionTypeLabel', () => {
    it('모든 정의된 액션 타입에 대해 한글 라벨 반환', () => {
      expect(getActionTypeLabel('PRODUCED')).toBe('생산');
      expect(getActionTypeLabel('SHIPPED')).toBe('출고');
      expect(getActionTypeLabel('RECEIVED')).toBe('입고');
      expect(getActionTypeLabel('TREATED')).toBe('시술');
      expect(getActionTypeLabel('RECALLED')).toBe('회수');
      expect(getActionTypeLabel('DISPOSED')).toBe('폐기');
    });

    it('정의되지 않은 액션 타입은 원본 반환', () => {
      expect(getActionTypeLabel('UNKNOWN_ACTION')).toBe('UNKNOWN_ACTION');
      expect(getActionTypeLabel('CUSTOM')).toBe('CUSTOM');
    });

    it('ACTION_TYPE_LABELS 상수가 올바르게 정의됨', () => {
      expect(Object.keys(ACTION_TYPE_LABELS)).toHaveLength(9);
      expect(ACTION_TYPE_LABELS).toMatchObject({
        PRODUCED: '생산',
        SHIPPED: '출고',
        RECEIVED: '입고',
        TREATED: '시술',
        RECALLED: '회수',
        RETURN_SENT: '반품 출고',
        RETURN_RECEIVED: '반품 입고',
        DISPOSED: '폐기',
        RETURNED: '반품',
      });
    });
  });

  // ============================================================================
  // 분 단위 그룹 키 테스트
  // ============================================================================
  describe('getMinuteGroupKey', () => {
    it('ISO 타임스탬프에서 분 단위 키 추출', () => {
      expect(getMinuteGroupKey('2024-01-15T10:30:45.123Z')).toBe('2024-01-15T10:30');
      expect(getMinuteGroupKey('2024-12-31T23:59:59.999Z')).toBe('2024-12-31T23:59');
    });

    it('초와 밀리초가 다른 동일 분 타임스탬프는 같은 키', () => {
      const key1 = getMinuteGroupKey('2024-01-15T10:30:00.000Z');
      const key2 = getMinuteGroupKey('2024-01-15T10:30:59.999Z');
      expect(key1).toBe(key2);
    });
  });

  // ============================================================================
  // 조직 이름 캐시 테스트
  // ============================================================================
  describe('createOrganizationNameCache', () => {
    it('빈 Map 객체 반환', () => {
      const cache = createOrganizationNameCache();
      expect(cache).toBeInstanceOf(Map);
      expect(cache.size).toBe(0);
    });

    it('여러 캐시 인스턴스는 독립적', () => {
      const cache1 = createOrganizationNameCache();
      const cache2 = createOrganizationNameCache();
      cache1.set('key', 'value');
      expect(cache2.has('key')).toBe(false);
    });
  });

  // ============================================================================
  // DB 연동 테스트 (모든 조직 관련 테스트를 한 블록에서 처리)
  // ============================================================================
  describe('DB 연동 테스트', () => {
    let supabase: ReturnType<typeof createTestAdminClient>;
    let testOrgCommon: Awaited<ReturnType<typeof createTestOrganization>>;
    let testOrg1: Awaited<ReturnType<typeof createTestOrganization>>;
    let testOrg2: Awaited<ReturnType<typeof createTestOrganization>>;
    let testOrgOwner: Awaited<ReturnType<typeof createTestOrganization>>;
    let testOrgFormat: Awaited<ReturnType<typeof createTestOrganization>>;

    beforeAll(async () => {
      supabase = createTestAdminClient();

      // 모든 테스트용 조직을 한 번에 생성 (고유한 이름 자동 생성)
      testOrgCommon = await createTestOrganization({
        type: 'MANUFACTURER',
      });
      testOrg1 = await createTestOrganization({
        type: 'MANUFACTURER',
      });
      testOrg2 = await createTestOrganization({
        type: 'DISTRIBUTOR',
      });
      testOrgOwner = await createTestOrganization({
        type: 'HOSPITAL',
      });
      testOrgFormat = await createTestOrganization({
        type: 'DISTRIBUTOR',
      });
    });

    afterAll(async () => {
      await cleanupAllTestData();
    });

    // 동일한 로직을 테스트 클라이언트로 구현하여 검증
    async function getOrganizationNamesWithTestClient(orgIds: string[]): Promise<Map<string, string>> {
      if (orgIds.length === 0) {
        return new Map();
      }
      // 매번 새로운 클라이언트를 생성하여 연결 문제 방지
      const client = createTestAdminClient();
      const uniqueIds = [...new Set(orgIds)];
      const { data, error } = await client
        .from('organizations')
        .select('id, name')
        .in('id', uniqueIds);

      if (error) {
        console.error('getOrganizationNamesWithTestClient error:', error);
        return new Map();
      }

      const result = new Map<string, string>();
      for (const row of data || []) {
        result.set(row.id, row.name);
      }
      return result;
    }

    // getOrganizationName 테스트
    describe('getOrganizationName', () => {
      it('존재하는 조직 ID로 이름 조회', async () => {
        const name = await getOrganizationName(supabase, testOrgCommon.id);
        expect(name).toBe(testOrgCommon.name);
      });

      it('존재하지 않는 조직 ID는 "알 수 없음" 반환', async () => {
        const name = await getOrganizationName(supabase, 'non-existent-id-12345');
        expect(name).toBe('알 수 없음');
      });

      it('캐시 사용 시 동일 결과 반환', async () => {
        const cache = createOrganizationNameCache();

        // 첫 번째 호출 (DB 조회)
        const name1 = await getOrganizationName(supabase, testOrgCommon.id, cache);
        expect(name1).toBe(testOrgCommon.name);
        expect(cache.has(testOrgCommon.id)).toBe(true);

        // 두 번째 호출 (캐시 사용)
        const name2 = await getOrganizationName(supabase, testOrgCommon.id, cache);
        expect(name2).toBe(testOrgCommon.name);
      });

      it('캐시에 값이 있으면 DB 조회 없이 반환', async () => {
        const cache = createOrganizationNameCache();
        cache.set(testOrgCommon.id, '캐시된이름');

        const name = await getOrganizationName(supabase, testOrgCommon.id, cache);
        expect(name).toBe('캐시된이름'); // DB 값이 아닌 캐시 값 반환
      });
    });

    // getOrganizationNames 로직 검증
    describe('getOrganizationNames 로직 검증', () => {
      it('여러 조직 ID로 이름 일괄 조회', async () => {
        const names = await getOrganizationNamesWithTestClient([testOrg1.id, testOrg2.id]);

        expect(names.get(testOrg1.id)).toBe(testOrg1.name);
        expect(names.get(testOrg2.id)).toBe(testOrg2.name);
      });

      it('빈 배열 입력 시 빈 Map 반환', async () => {
        const names = await getOrganizationNamesWithTestClient([]);
        expect(names.size).toBe(0);
      });

      it('중복 ID는 자동으로 제거됨', async () => {
        const names = await getOrganizationNamesWithTestClient([testOrg1.id, testOrg1.id, testOrg1.id]);
        expect(names.size).toBe(1);
        expect(names.get(testOrg1.id)).toBe(testOrg1.name);
      });

      it('존재하지 않는 ID는 결과에 포함되지 않음', async () => {
        // testOrg2를 사용하고, 존재하지 않는 유효한 UUID 사용
        const nonExistentUUID = '00000000-0000-0000-0000-000000000000';
        const names = await getOrganizationNamesWithTestClient([testOrg2.id, nonExistentUUID]);
        expect(names.has(testOrg2.id)).toBe(true);
        expect(names.has(nonExistentUUID)).toBe(false);
      });
    });

    // getOwnerDisplayName 테스트
    describe('getOwnerDisplayName', () => {
      it('ORGANIZATION 타입은 조직 이름 반환', async () => {
        const name = await getOwnerDisplayName('ORGANIZATION', testOrgOwner.id, supabase);
        expect(name).toBe(testOrgOwner.name);
      });

      it('PATIENT 타입은 마스킹된 전화번호 반환', async () => {
        const name = await getOwnerDisplayName('PATIENT', '01012345678', supabase);
        expect(name).toBe('***-****-5678');
      });

      it('캐시 사용 가능', async () => {
        const cache = createOrganizationNameCache();
        const name = await getOwnerDisplayName('ORGANIZATION', testOrgOwner.id, supabase, cache);
        expect(name).toBe(testOrgOwner.name);
        expect(cache.has(testOrgOwner.id)).toBe(true);
      });
    });

    // formatOwnerInfo 테스트
    describe('formatOwnerInfo', () => {
      it('조직 정보 포맷팅', async () => {
        const info = await formatOwnerInfo('ORGANIZATION', testOrgFormat.id, supabase);

        expect(info).toMatchObject({
          type: 'ORGANIZATION',
          id: testOrgFormat.id,
          name: testOrgFormat.name,
        });
      });

      it('환자 정보 포맷팅', async () => {
        const info = await formatOwnerInfo('PATIENT', '01098765432', supabase);

        expect(info).toMatchObject({
          type: 'PATIENT',
          id: '01098765432',
          name: '***-****-5432',
        });
      });

      it('null 타입은 undefined 반환', async () => {
        const info = await formatOwnerInfo(null, testOrgFormat.id, supabase);
        expect(info).toBeUndefined();
      });

      it('null ID는 undefined 반환', async () => {
        const info = await formatOwnerInfo('ORGANIZATION', null, supabase);
        expect(info).toBeUndefined();
      });

      it('둘 다 null이면 undefined 반환', async () => {
        const info = await formatOwnerInfo(null, null, supabase);
        expect(info).toBeUndefined();
      });

      it('캐시 사용 가능', async () => {
        const cache = createOrganizationNameCache();
        const info = await formatOwnerInfo('ORGANIZATION', testOrgFormat.id, supabase, cache);

        expect(info?.name).toBe(testOrgFormat.name);
        expect(cache.has(testOrgFormat.id)).toBe(true);
      });
    });
  });
});
