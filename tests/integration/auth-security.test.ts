/**
 * Auth Flow Security Integration Tests
 *
 * 보안 마이그레이션 후 인증 플로우 검증:
 * - 로그인 후 조직 정보 조회 성공
 * - 비인증 상태에서 조직 조회 실패
 * - 세션 갱신 후 조직 조회 유지
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createTestClient,
  createTestAdminClient,
  createTestOrganizationWithAuth,
  cleanupAllTestData,
} from '../helpers';

/**
 * 시드 데이터 계정 정보
 */
const SEED_ACCOUNTS = {
  manufacturer: {
    email: 'manufacturer@neocert.com',
    password: 'test123',
  },
  distributor: {
    email: 'distributor@neocert.com',
    password: 'test123',
  },
  hospital: {
    email: 'hospital@neocert.com',
    password: 'test123',
  },
  admin: {
    email: 'admin@neocert.com',
    password: 'admin123',
  },
};

describe('Auth Flow Security Tests', () => {
  afterAll(async () => {
    await cleanupAllTestData();
  });

  // ============================================================================
  // 로그인 플로우 테스트
  // ============================================================================
  describe('Login Flow', () => {
    it('제조사 로그인 후 조직 정보 조회 성공', async () => {
      const client = createTestClient();

      // Step 1: 로그인
      const { data: authData, error: authError } = await client.auth.signInWithPassword({
        email: SEED_ACCOUNTS.manufacturer.email,
        password: SEED_ACCOUNTS.manufacturer.password,
      });

      expect(authError).toBeNull();
      expect(authData.user).toBeDefined();

      // Step 2: 조직 정보 조회 (useAuth 훅과 동일한 패턴)
      const { data: org, error: orgError } = await client
        .from('organizations')
        .select('*, manufacturer_settings(*)')
        .eq('auth_user_id', authData.user!.id)
        .single();

      expect(orgError).toBeNull();
      expect(org).toBeDefined();
      expect(org?.type).toBe('MANUFACTURER');
      expect(org?.email).toBe(SEED_ACCOUNTS.manufacturer.email);
    });

    it('유통사 로그인 후 조직 정보 조회 성공', async () => {
      const client = createTestClient();

      const { data: authData, error: authError } = await client.auth.signInWithPassword({
        email: SEED_ACCOUNTS.distributor.email,
        password: SEED_ACCOUNTS.distributor.password,
      });

      expect(authError).toBeNull();

      const { data: org, error: orgError } = await client
        .from('organizations')
        .select('type, status, name')
        .eq('auth_user_id', authData.user!.id)
        .single();

      expect(orgError).toBeNull();
      expect(org?.type).toBe('DISTRIBUTOR');
    });

    it('병원 로그인 후 조직 정보 조회 성공', async () => {
      const client = createTestClient();

      const { data: authData, error: authError } = await client.auth.signInWithPassword({
        email: SEED_ACCOUNTS.hospital.email,
        password: SEED_ACCOUNTS.hospital.password,
      });

      expect(authError).toBeNull();

      const { data: org, error: orgError } = await client
        .from('organizations')
        .select('type, status')
        .eq('auth_user_id', authData.user!.id)
        .single();

      expect(orgError).toBeNull();
      expect(org?.type).toBe('HOSPITAL');
    });

    it('관리자 로그인 후 조직 정보 조회 성공', async () => {
      const client = createTestClient();

      const { data: authData, error: authError } = await client.auth.signInWithPassword({
        email: SEED_ACCOUNTS.admin.email,
        password: SEED_ACCOUNTS.admin.password,
      });

      expect(authError).toBeNull();

      const { data: org, error: orgError } = await client
        .from('organizations')
        .select('type, status')
        .eq('auth_user_id', authData.user!.id)
        .single();

      expect(orgError).toBeNull();
      expect(org?.type).toBe('ADMIN');
    });
  });

  // ============================================================================
  // 비인증 상태 접근 제한 테스트
  // ============================================================================
  describe('Unauthenticated Access Restrictions', () => {
    it('비인증 상태: organizations 테이블 조회 차단', async () => {
      const anonClient = createTestClient();

      // 로그인하지 않은 상태에서 조회
      const { data, error } = await anonClient.from('organizations').select('*').limit(1);

      // 마이그레이션으로 anon 권한 제거됨
      // permission denied 에러 또는 빈 배열 반환
      if (error) {
        expect(error.code).toBe('42501'); // permission denied
      } else {
        expect(data?.length ?? 0).toBe(0);
      }
    });

    it('비인증 상태: 특정 조직 ID로 조회 시 데이터 없음', async () => {
      const anonClient = createTestClient();

      // 알려진 조직 ID로 직접 조회 시도
      const { data } = await anonClient
        .from('organizations')
        .select('*')
        .eq('email', SEED_ACCOUNTS.manufacturer.email)
        .single();

      // 조회 불가
      expect(data).toBeNull();
    });

    it('비인증 상태: products 테이블 조회 시 빈 결과', async () => {
      const anonClient = createTestClient();

      const { data } = await anonClient.from('products').select('*').limit(1);

      expect(data?.length ?? 0).toBe(0);
    });

    it('비인증 상태: virtual_codes 테이블 조회 시 빈 결과', async () => {
      const anonClient = createTestClient();

      const { data } = await anonClient.from('virtual_codes').select('*').limit(1);

      expect(data?.length ?? 0).toBe(0);
    });
  });

  // ============================================================================
  // 세션 관리 테스트
  // ============================================================================
  describe('Session Management', () => {
    it('세션 갱신 후 조직 조회 유지', async () => {
      const client = createTestClient();

      // 로그인
      await client.auth.signInWithPassword({
        email: SEED_ACCOUNTS.manufacturer.email,
        password: SEED_ACCOUNTS.manufacturer.password,
      });

      // 세션 갱신
      const { data: refreshData, error: refreshError } = await client.auth.refreshSession();
      expect(refreshError).toBeNull();
      expect(refreshData.session).toBeDefined();

      // 갱신된 세션으로 조직 조회
      const { data: org, error: orgError } = await client
        .from('organizations')
        .select('type')
        .eq('auth_user_id', refreshData.user!.id)
        .single();

      expect(orgError).toBeNull();
      expect(org?.type).toBe('MANUFACTURER');
    });

    it('로그아웃 후 조직 조회 불가', async () => {
      const client = createTestClient();

      // 로그인
      const { data: authData } = await client.auth.signInWithPassword({
        email: SEED_ACCOUNTS.distributor.email,
        password: SEED_ACCOUNTS.distributor.password,
      });
      const userId = authData.user!.id;

      // 로그아웃
      await client.auth.signOut();

      // 로그아웃 후 조회 시도 (세션 없음)
      const { data: org } = await client
        .from('organizations')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      // 조회 불가
      expect(org).toBeNull();
    });
  });

  // ============================================================================
  // 신규 회원가입 플로우 테스트
  // ============================================================================
  describe('Registration Flow', () => {
    let testUserEmail: string;
    let testOrgId: string;

    it('새 조직 생성 후 로그인 성공', async () => {
      const result = await createTestOrganizationWithAuth({
        type: 'MANUFACTURER',
        password: 'NewUser123!',
      });

      testUserEmail = result.email;
      testOrgId = result.organization.id;

      // 새로 생성된 계정으로 로그인
      const client = createTestClient();
      const { data: authData, error: authError } = await client.auth.signInWithPassword({
        email: result.email,
        password: result.password,
      });

      expect(authError).toBeNull();
      expect(authData.user).toBeDefined();

      // 조직 정보 조회
      const { data: org, error: orgError } = await client
        .from('organizations')
        .select('*')
        .eq('auth_user_id', authData.user!.id)
        .single();

      expect(orgError).toBeNull();
      expect(org).toBeDefined();
      expect(org?.id).toBe(result.organization.id);
    });

    it('PENDING_APPROVAL 상태 조직도 조회 가능', async () => {
      const result = await createTestOrganizationWithAuth({
        type: 'DISTRIBUTOR',
        status: 'PENDING_APPROVAL',
        password: 'PendingUser123!',
      });

      const client = createTestClient();
      const { data: authData, error: authError } = await client.auth.signInWithPassword({
        email: result.email,
        password: result.password,
      });

      expect(authError).toBeNull();

      const { data: org, error: orgError } = await client
        .from('organizations')
        .select('status')
        .eq('auth_user_id', authData.user!.id)
        .single();

      expect(orgError).toBeNull();
      expect(org?.status).toBe('PENDING_APPROVAL');
    });
  });

  // ============================================================================
  // Auth Callback 시뮬레이션 테스트
  // 실제 auth callback route의 로직 검증
  // ============================================================================
  describe('Auth Callback Simulation', () => {
    it('exchangeCodeForSession 후 즉시 조직 조회 성공 시뮬레이션', async () => {
      // 실제 코드 교환은 테스트 불가하므로
      // signInWithPassword로 세션 생성 후 동일 패턴 테스트
      const client = createTestClient();

      // 세션 생성
      const { data: authData, error: authError } = await client.auth.signInWithPassword({
        email: SEED_ACCOUNTS.manufacturer.email,
        password: SEED_ACCOUNTS.manufacturer.password,
      });

      expect(authError).toBeNull();

      // auth/callback/route.ts와 동일한 패턴
      const {
        data: { user },
      } = await client.auth.getUser();

      if (user) {
        const { data: org, error: orgError } = await client
          .from('organizations')
          .select('type, status')
          .eq('auth_user_id', user.id)
          .single();

        expect(orgError).toBeNull();
        expect(org?.status).toBe('ACTIVE');
        expect(org?.type).toBe('MANUFACTURER');
      }
    });

    it('세션 없이 getUser 호출 시 null 반환', async () => {
      const client = createTestClient();

      // 로그인하지 않은 상태
      const {
        data: { user },
      } = await client.auth.getUser();

      expect(user).toBeNull();
    });
  });

  // ============================================================================
  // 교차 조직 접근 테스트
  // RLS 정책: ACTIVE 상태 조직은 인증된 모든 사용자가 조회 가능
  // (출하 대상 선택 등 비즈니스 요구사항 반영)
  // ============================================================================
  describe('Cross-Organization Access (RLS Policy Verification)', () => {
    it('인증된 사용자: ACTIVE 상태 다른 조직 조회 가능 (정책상 허용)', async () => {
      // 새 제조사 조직 생성 (ACTIVE 상태)
      const otherManufacturer = await createTestOrganizationWithAuth({
        type: 'MANUFACTURER',
        password: 'OtherMfr123!',
        status: 'ACTIVE',
      });

      // 기존 제조사로 로그인
      const client = createTestClient();
      await client.auth.signInWithPassword({
        email: SEED_ACCOUNTS.manufacturer.email,
        password: SEED_ACCOUNTS.manufacturer.password,
      });

      // 다른 ACTIVE 조직 조회 - RLS 정책상 허용됨
      const { data: org } = await client
        .from('organizations')
        .select('*')
        .eq('id', otherManufacturer.organization.id)
        .single();

      // ACTIVE 상태이므로 조회 가능
      expect(org).toBeDefined();
      expect(org?.status).toBe('ACTIVE');
    });

    it('인증된 사용자: PENDING_APPROVAL 상태 다른 조직 조회 불가', async () => {
      // 새 조직 생성 (PENDING_APPROVAL 상태)
      const pendingOrg = await createTestOrganizationWithAuth({
        type: 'DISTRIBUTOR',
        password: 'PendingOrg123!',
        status: 'PENDING_APPROVAL',
      });

      // 기존 제조사로 로그인
      const client = createTestClient();
      await client.auth.signInWithPassword({
        email: SEED_ACCOUNTS.manufacturer.email,
        password: SEED_ACCOUNTS.manufacturer.password,
      });

      // PENDING_APPROVAL 조직 조회 시도 - 본인이 아니면 불가
      const { data: org } = await client
        .from('organizations')
        .select('*')
        .eq('id', pendingOrg.organization.id)
        .single();

      // PENDING_APPROVAL은 본인 또는 admin만 조회 가능
      expect(org).toBeNull();
    });

    it('유통사: 다른 ACTIVE 조직 기본 정보 조회 가능', async () => {
      const client = createTestClient();
      await client.auth.signInWithPassword({
        email: SEED_ACCOUNTS.distributor.email,
        password: SEED_ACCOUNTS.distributor.password,
      });

      // 제조사 조회 시도 (ACTIVE 상태)
      const { data: org } = await client
        .from('organizations')
        .select('id, name, type, status')
        .eq('email', SEED_ACCOUNTS.manufacturer.email)
        .single();

      // ACTIVE 상태이므로 조회 가능
      expect(org).toBeDefined();
      expect(org?.type).toBe('MANUFACTURER');
    });
  });
});
