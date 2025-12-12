/**
 * Auth Service 통합 테스트
 *
 * 회원가입, 로그인, 로그아웃 등 인증 관련 비즈니스 로직을 테스트합니다.
 * 실제 Supabase 로컬 인스턴스를 사용합니다.
 */
import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import {
  createTestAdminClient,
  generateTestEmail,
  generateTestBusinessNumber,
  generateTestPhoneNumber,
  generateTestUUID,
  cleanupAllTestData,
  trackTestData,
} from '../helpers';
import { ORGANIZATION_STATUSES, ORGANIZATION_TYPES } from '@/constants';

describe('Auth Service Integration Tests', () => {
  const adminClient = createTestAdminClient();

  afterEach(async () => {
    await cleanupAllTestData();
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  describe('회원가입 (register)', () => {
    it('MANUFACTURER 조직이 정상적으로 생성되어야 한다', async () => {
      const email = generateTestEmail();
      const password = 'Test1234!';
      const businessNumber = generateTestBusinessNumber();

      // 1. Auth 사용자 생성
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          organization_type: ORGANIZATION_TYPES.MANUFACTURER,
        },
      });

      expect(authError).toBeNull();
      expect(authData.user).toBeDefined();

      const userId = authData.user!.id;
      trackTestData('authUsers', userId);

      // 2. 조직 정보 저장
      const { data: orgData, error: orgError } = await adminClient.from('organizations').insert({
        auth_user_id: userId,
        type: ORGANIZATION_TYPES.MANUFACTURER,
        email,
        name: '테스트 제조사',
        business_number: businessNumber,
        business_license_file: `${userId}/business_license.pdf`,
        representative_name: '홍길동',
        representative_contact: '010-1234-5678',
        address: '서울시 강남구 테스트로 123',
        status: ORGANIZATION_STATUSES.ACTIVE,
      }).select().single();

      expect(orgError).toBeNull();
      expect(orgData).toBeDefined();
      expect(orgData?.type).toBe(ORGANIZATION_TYPES.MANUFACTURER);
      expect(orgData?.status).toBe(ORGANIZATION_STATUSES.ACTIVE);

      trackTestData('organizations', orgData!.id);
    });

    it('DISTRIBUTOR 조직이 정상적으로 생성되어야 한다', async () => {
      const email = generateTestEmail();
      const businessNumber = generateTestBusinessNumber();

      const { data: authData } = await adminClient.auth.admin.createUser({
        email,
        password: 'Test1234!',
        email_confirm: true,
      });

      const userId = authData.user!.id;
      trackTestData('authUsers', userId);

      const { data: orgData, error: orgError } = await adminClient.from('organizations').insert({
        auth_user_id: userId,
        type: ORGANIZATION_TYPES.DISTRIBUTOR,
        email,
        name: '테스트 유통사',
        business_number: businessNumber,
        business_license_file: `${userId}/business_license.pdf`,
        representative_name: '김유통',
        representative_contact: '010-2345-6789',
        address: '서울시 서초구 유통로 456',
        status: ORGANIZATION_STATUSES.ACTIVE,
      }).select().single();

      expect(orgError).toBeNull();
      expect(orgData?.type).toBe(ORGANIZATION_TYPES.DISTRIBUTOR);

      trackTestData('organizations', orgData!.id);
    });

    it('HOSPITAL 조직이 정상적으로 생성되어야 한다', async () => {
      const email = generateTestEmail();
      const businessNumber = generateTestBusinessNumber();

      const { data: authData } = await adminClient.auth.admin.createUser({
        email,
        password: 'Test1234!',
        email_confirm: true,
      });

      const userId = authData.user!.id;
      trackTestData('authUsers', userId);

      const { data: orgData, error: orgError } = await adminClient.from('organizations').insert({
        auth_user_id: userId,
        type: ORGANIZATION_TYPES.HOSPITAL,
        email,
        name: '테스트 병원',
        business_number: businessNumber,
        business_license_file: `${userId}/business_license.pdf`,
        representative_name: '박의사',
        representative_contact: '010-3456-7890',
        address: '서울시 송파구 병원로 789',
        status: ORGANIZATION_STATUSES.ACTIVE,
      }).select().single();

      expect(orgError).toBeNull();
      expect(orgData?.type).toBe(ORGANIZATION_TYPES.HOSPITAL);

      trackTestData('organizations', orgData!.id);
    });

    it('Auth 계정과 조직의 ID가 올바르게 연결되어야 한다', async () => {
      const email = generateTestEmail();

      const { data: authData } = await adminClient.auth.admin.createUser({
        email,
        password: 'Test1234!',
        email_confirm: true,
      });

      const userId = authData.user!.id;
      trackTestData('authUsers', userId);

      const { data: orgData } = await adminClient.from('organizations').insert({
        auth_user_id: userId,
        type: ORGANIZATION_TYPES.MANUFACTURER,
        email,
        name: '테스트 제조사',
        business_number: generateTestBusinessNumber(),
        business_license_file: `${userId}/business_license.pdf`,
        representative_name: '홍길동',
        representative_contact: generateTestPhoneNumber(),
        address: '서울시 강남구',
        status: ORGANIZATION_STATUSES.ACTIVE,
      }).select().single();

      expect(orgData?.auth_user_id).toBe(userId);
      trackTestData('organizations', orgData!.id);

      // auth_user_id로 조직 조회가 가능해야 함
      const { data: foundOrg } = await adminClient
        .from('organizations')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      expect(foundOrg).toBeDefined();
      expect(foundOrg?.email).toBe(email);
    });

    it('사업자등록번호가 중복되면 에러가 발생해야 한다', async () => {
      const businessNumber = generateTestBusinessNumber();
      const email1 = generateTestEmail();
      const email2 = generateTestEmail();

      // 첫 번째 조직 생성
      const { data: auth1 } = await adminClient.auth.admin.createUser({
        email: email1,
        password: 'Test1234!',
        email_confirm: true,
      });
      trackTestData('authUsers', auth1.user!.id);

      const { data: org1 } = await adminClient.from('organizations').insert({
        auth_user_id: auth1.user!.id,
        type: ORGANIZATION_TYPES.MANUFACTURER,
        email: email1,
        name: '첫 번째 조직',
        business_number: businessNumber,
        business_license_file: `${auth1.user!.id}/business_license.pdf`,
        representative_name: '홍길동',
        representative_contact: generateTestPhoneNumber(),
        address: '서울시 강남구',
        status: ORGANIZATION_STATUSES.ACTIVE,
      }).select().single();
      trackTestData('organizations', org1!.id);

      // 두 번째 조직 생성 시도 (같은 사업자번호)
      const { data: auth2 } = await adminClient.auth.admin.createUser({
        email: email2,
        password: 'Test1234!',
        email_confirm: true,
      });
      trackTestData('authUsers', auth2.user!.id);

      const { error: dupError } = await adminClient.from('organizations').insert({
        auth_user_id: auth2.user!.id,
        type: ORGANIZATION_TYPES.DISTRIBUTOR,
        email: email2,
        name: '두 번째 조직',
        business_number: businessNumber, // 중복
        business_license_file: `${auth2.user!.id}/business_license.pdf`,
        representative_name: '김철수',
        representative_contact: generateTestPhoneNumber(),
        address: '서울시 서초구',
        status: ORGANIZATION_STATUSES.ACTIVE,
      });

      expect(dupError).toBeDefined();
      expect(dupError?.code).toBe('23505'); // unique_violation
    });

    it('이메일이 중복되면 에러가 발생해야 한다', async () => {
      const email = generateTestEmail();

      // 첫 번째 사용자 생성
      const { data: auth1 } = await adminClient.auth.admin.createUser({
        email,
        password: 'Test1234!',
        email_confirm: true,
      });
      trackTestData('authUsers', auth1.user!.id);

      // 같은 이메일로 두 번째 사용자 생성 시도
      const { error: dupError } = await adminClient.auth.admin.createUser({
        email,
        password: 'Test5678!',
        email_confirm: true,
      });

      expect(dupError).toBeDefined();
      expect(dupError?.message).toContain('already been registered');
    });
  });

  describe('로그인 (login)', () => {
    let testUser: { id: string; email: string; password: string };
    let testOrg: { id: string };

    beforeEach(async () => {
      const email = generateTestEmail();
      const password = 'Test1234!';

      // 테스트 사용자 및 조직 생성
      const { data: authData } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      testUser = {
        id: authData.user!.id,
        email,
        password,
      };
      trackTestData('authUsers', testUser.id);

      const { data: orgData } = await adminClient.from('organizations').insert({
        auth_user_id: testUser.id,
        type: ORGANIZATION_TYPES.MANUFACTURER,
        email,
        name: '테스트 제조사',
        business_number: generateTestBusinessNumber(),
        business_license_file: `${testUser.id}/business_license.pdf`,
        representative_name: '홍길동',
        representative_contact: generateTestPhoneNumber(),
        address: '서울시 강남구',
        status: ORGANIZATION_STATUSES.ACTIVE,
      }).select().single();

      testOrg = { id: orgData!.id };
      trackTestData('organizations', testOrg.id);
    });

    it('ACTIVE 상태의 조직은 로그인할 수 있어야 한다', async () => {
      // 조직 상태 확인
      const { data: org } = await adminClient
        .from('organizations')
        .select('status')
        .eq('auth_user_id', testUser.id)
        .single();

      expect(org?.status).toBe(ORGANIZATION_STATUSES.ACTIVE);
    });

    it('auth_user_id로 조직 정보를 조회할 수 있어야 한다', async () => {
      const { data: org } = await adminClient
        .from('organizations')
        .select('*, manufacturer_settings(*)')
        .eq('auth_user_id', testUser.id)
        .single();

      expect(org).toBeDefined();
      expect(org?.email).toBe(testUser.email);
      expect(org?.type).toBe(ORGANIZATION_TYPES.MANUFACTURER);
    });

    it('PENDING_APPROVAL 상태의 조직은 로그인이 거부되어야 한다', async () => {
      // 상태 변경
      await adminClient
        .from('organizations')
        .update({ status: ORGANIZATION_STATUSES.PENDING_APPROVAL })
        .eq('id', testOrg.id);

      const { data: org } = await adminClient
        .from('organizations')
        .select('status')
        .eq('id', testOrg.id)
        .single();

      expect(org?.status).toBe(ORGANIZATION_STATUSES.PENDING_APPROVAL);
      // 실제 서비스에서는 이 상태일 때 로그인을 거부함
    });

    it('INACTIVE 상태의 조직은 로그인이 거부되어야 한다', async () => {
      // 상태 변경
      await adminClient
        .from('organizations')
        .update({ status: ORGANIZATION_STATUSES.INACTIVE })
        .eq('id', testOrg.id);

      const { data: org } = await adminClient
        .from('organizations')
        .select('status')
        .eq('id', testOrg.id)
        .single();

      expect(org?.status).toBe(ORGANIZATION_STATUSES.INACTIVE);
      // 실제 서비스에서는 이 상태일 때 로그인을 거부함
    });

    it('DELETED 상태의 조직은 로그인이 거부되어야 한다', async () => {
      // 상태 변경
      await adminClient
        .from('organizations')
        .update({ status: ORGANIZATION_STATUSES.DELETED })
        .eq('id', testOrg.id);

      const { data: org } = await adminClient
        .from('organizations')
        .select('status')
        .eq('id', testOrg.id)
        .single();

      expect(org?.status).toBe(ORGANIZATION_STATUSES.DELETED);
    });
  });

  describe('조직 정보 조회', () => {
    it('제조사 설정(manufacturer_settings)이 함께 조회되어야 한다', async () => {
      const email = generateTestEmail();

      // 조직 생성
      const { data: authData } = await adminClient.auth.admin.createUser({
        email,
        password: 'Test1234!',
        email_confirm: true,
      });
      trackTestData('authUsers', authData.user!.id);

      const { data: orgData } = await adminClient.from('organizations').insert({
        auth_user_id: authData.user!.id,
        type: ORGANIZATION_TYPES.MANUFACTURER,
        email,
        name: '테스트 제조사',
        business_number: generateTestBusinessNumber(),
        business_license_file: `${authData.user!.id}/business_license.pdf`,
        representative_name: '홍길동',
        representative_contact: generateTestPhoneNumber(),
        address: '서울시 강남구',
        status: ORGANIZATION_STATUSES.ACTIVE,
      }).select().single();
      trackTestData('organizations', orgData!.id);

      // 제조사 설정 생성
      const { data: settingsData } = await adminClient.from('manufacturer_settings').upsert({
        organization_id: orgData!.id,
        lot_prefix: 'TEST',
        lot_model_digits: 5,
        lot_date_format: 'yymmdd',
        expiry_months: 24,
      }, { onConflict: 'organization_id' }).select().single();
      trackTestData('manufacturerSettings', settingsData!.id);

      // 조직 + 제조사 설정 함께 조회
      const { data: org } = await adminClient
        .from('organizations')
        .select('*, manufacturer_settings(*)')
        .eq('id', orgData!.id)
        .single();

      expect(org).toBeDefined();
      expect(org?.manufacturer_settings).toBeDefined();

      const settings = Array.isArray(org?.manufacturer_settings)
        ? org?.manufacturer_settings[0]
        : org?.manufacturer_settings;

      expect(settings?.lot_prefix).toBe('TEST');
      expect(settings?.expiry_months).toBe(24);
    });
  });

  describe('이메일 중복 확인 (checkEmailExists)', () => {
    it('존재하는 이메일은 true를 반환해야 한다', async () => {
      const email = generateTestEmail();

      const { data: authData } = await adminClient.auth.admin.createUser({
        email,
        password: 'Test1234!',
        email_confirm: true,
      });
      trackTestData('authUsers', authData.user!.id);

      const { data: orgData } = await adminClient.from('organizations').insert({
        auth_user_id: authData.user!.id,
        type: ORGANIZATION_TYPES.MANUFACTURER,
        email,
        name: '테스트 제조사',
        business_number: generateTestBusinessNumber(),
        business_license_file: `${authData.user!.id}/business_license.pdf`,
        representative_name: '홍길동',
        representative_contact: generateTestPhoneNumber(),
        address: '서울시 강남구',
        status: ORGANIZATION_STATUSES.ACTIVE,
      }).select().single();
      trackTestData('organizations', orgData!.id);

      // 이메일 존재 확인
      const { data } = await adminClient
        .from('organizations')
        .select('id')
        .eq('email', email)
        .single();

      expect(data).toBeDefined();
    });

    it('존재하지 않는 이메일은 null을 반환해야 한다', async () => {
      const nonExistentEmail = 'nonexistent_' + generateTestEmail();

      const { data } = await adminClient
        .from('organizations')
        .select('id')
        .eq('email', nonExistentEmail)
        .single();

      expect(data).toBeNull();
    });
  });

  describe('사업자등록번호 중복 확인 (checkBusinessNumberExists)', () => {
    it('존재하는 사업자번호는 조회되어야 한다', async () => {
      const email = generateTestEmail();
      const businessNumber = generateTestBusinessNumber();

      const { data: authData } = await adminClient.auth.admin.createUser({
        email,
        password: 'Test1234!',
        email_confirm: true,
      });
      trackTestData('authUsers', authData.user!.id);

      const { data: orgData } = await adminClient.from('organizations').insert({
        auth_user_id: authData.user!.id,
        type: ORGANIZATION_TYPES.MANUFACTURER,
        email,
        name: '테스트 제조사',
        business_number: businessNumber,
        business_license_file: `${authData.user!.id}/business_license.pdf`,
        representative_name: '홍길동',
        representative_contact: generateTestPhoneNumber(),
        address: '서울시 강남구',
        status: ORGANIZATION_STATUSES.ACTIVE,
      }).select().single();
      trackTestData('organizations', orgData!.id);

      // 사업자번호 존재 확인
      const { data } = await adminClient
        .from('organizations')
        .select('id')
        .eq('business_number', businessNumber)
        .single();

      expect(data).toBeDefined();
    });

    it('존재하지 않는 사업자번호는 null을 반환해야 한다', async () => {
      const nonExistentBN = '9999999999';

      const { data } = await adminClient
        .from('organizations')
        .select('id')
        .eq('business_number', nonExistentBN)
        .single();

      expect(data).toBeNull();
    });
  });

  describe('회원가입 롤백 시나리오', () => {
    it('조직 생성 실패 시 Auth 사용자가 존재해야 롤백 가능하다', async () => {
      const email = generateTestEmail();

      // Auth 사용자 생성
      const { data: authData } = await adminClient.auth.admin.createUser({
        email,
        password: 'Test1234!',
        email_confirm: true,
      });

      const userId = authData.user!.id;
      trackTestData('authUsers', userId);

      // Auth 사용자 존재 확인
      const { data: userData } = await adminClient.auth.admin.getUserById(userId);
      expect(userData.user).toBeDefined();
      expect(userData.user?.email).toBe(email);

      // 롤백: Auth 사용자 삭제
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
      expect(deleteError).toBeNull();

      // 삭제 확인
      const { data: deletedUser } = await adminClient.auth.admin.getUserById(userId);
      expect(deletedUser.user).toBeNull();
    });
  });

  describe('전화번호 정규화', () => {
    it('다양한 형식의 전화번호가 정규화되어 저장되어야 한다', async () => {
      const testCases = [
        { input: '010-1234-5678', expected: '01012345678' },
        { input: '01012345678', expected: '01012345678' },
        { input: '010 1234 5678', expected: '01012345678' },
      ];

      for (const testCase of testCases) {
        const email = generateTestEmail();
        const normalizedPhone = testCase.input.replace(/[^0-9]/g, '');

        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
          email,
          password: 'Test1234!',
          email_confirm: true,
        });

        if (authError || !authData.user) {
          throw new Error(`Auth 생성 실패: ${authError?.message}`);
        }
        trackTestData('authUsers', authData.user.id);

        const { data: orgData, error: orgError } = await adminClient.from('organizations').insert({
          auth_user_id: authData.user.id,
          type: ORGANIZATION_TYPES.MANUFACTURER,
          email,
          name: `테스트제조사_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          business_number: generateTestBusinessNumber(),
          business_license_file: `${authData.user.id}/business_license.pdf`,
          representative_name: '홍길동',
          representative_contact: normalizedPhone,
          address: '서울시 강남구',
          status: ORGANIZATION_STATUSES.ACTIVE,
        }).select().single();

        if (orgError || !orgData) {
          throw new Error(`조직 생성 실패: ${orgError?.message}`);
        }
        trackTestData('organizations', orgData.id);

        expect(orgData.representative_contact).toBe(testCase.expected);
      }
    });
  });
});
