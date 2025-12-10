/**
 * Manufacturer Settings Service 통합 테스트
 *
 * 제조사 설정 관련 기능을 테스트합니다.
 * 실제 Supabase 로컬 인스턴스를 사용합니다.
 *
 * 참고: 제조사 조직 생성 시 DB 트리거에 의해 manufacturer_settings가 자동 생성됨
 */
import { describe, it, expect, afterEach, afterAll } from 'vitest';
import { createTestAdminClient, createTestOrganization, cleanupAllTestData } from '../helpers';

describe('Manufacturer Settings Service Integration Tests', () => {
  const adminClient = createTestAdminClient();

  afterEach(async () => {
    await cleanupAllTestData();
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  describe('제조사 설정 자동 생성', () => {
    it('제조사 조직 생성 시 기본 설정이 트리거로 자동 생성되어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });

      // 트리거에 의해 생성된 설정 조회
      const { data: settings, error } = await adminClient
        .from('manufacturer_settings')
        .select('*')
        .eq('organization_id', manufacturer.id)
        .single();

      expect(error).toBeNull();
      expect(settings).toBeDefined();
      expect(settings?.organization_id).toBe(manufacturer.id);
    });

    it('유통사/병원 조직은 제조사 설정이 생성되지 않아야 한다', async () => {
      const distributor = await createTestOrganization({ type: 'DISTRIBUTOR' });
      const hospital = await createTestOrganization({ type: 'HOSPITAL' });

      // 유통사 설정 조회
      const { data: distSettings } = await adminClient
        .from('manufacturer_settings')
        .select('*')
        .eq('organization_id', distributor.id)
        .single();

      // 병원 설정 조회
      const { data: hospSettings } = await adminClient
        .from('manufacturer_settings')
        .select('*')
        .eq('organization_id', hospital.id)
        .single();

      expect(distSettings).toBeNull();
      expect(hospSettings).toBeNull();
    });
  });

  describe('제조사 설정 조회', () => {
    it('조직 ID로 제조사 설정을 조회할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });

      // 설정 조회
      const { data: settings, error } = await adminClient
        .from('manufacturer_settings')
        .select('*')
        .eq('organization_id', manufacturer.id)
        .single();

      expect(error).toBeNull();
      expect(settings).toBeDefined();
      expect(settings?.organization_id).toBe(manufacturer.id);
      // 기본값 확인
      expect(settings?.lot_model_digits).toBeDefined();
      expect(settings?.expiry_months).toBeDefined();
    });

    it('존재하지 않는 조직 ID로 조회하면 에러가 발생해야 한다', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const { data, error } = await adminClient
        .from('manufacturer_settings')
        .select('*')
        .eq('organization_id', nonExistentId)
        .single();

      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });
  });

  describe('제조사 설정 수정', () => {
    it('Lot 접두사를 수정할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });

      // 접두사 수정
      const { error } = await adminClient
        .from('manufacturer_settings')
        .update({ lot_prefix: 'NEW' })
        .eq('organization_id', manufacturer.id);

      expect(error).toBeNull();

      // 수정 확인
      const { data: updated } = await adminClient
        .from('manufacturer_settings')
        .select('*')
        .eq('organization_id', manufacturer.id)
        .single();

      expect(updated?.lot_prefix).toBe('NEW');
    });

    it('모든 설정 필드를 동시에 수정할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });

      // 전체 설정 수정
      const newSettings = {
        lot_prefix: 'UPDATED',
        lot_model_digits: 6,
        expiry_months: 36,
        lot_date_format: 'YYMM',
      };

      const { error } = await adminClient
        .from('manufacturer_settings')
        .update(newSettings)
        .eq('organization_id', manufacturer.id);

      expect(error).toBeNull();

      // 수정 확인
      const { data: updated } = await adminClient
        .from('manufacturer_settings')
        .select('*')
        .eq('organization_id', manufacturer.id)
        .single();

      expect(updated?.lot_prefix).toBe('UPDATED');
      expect(updated?.lot_model_digits).toBe(6);
      expect(updated?.expiry_months).toBe(36);
      expect(updated?.lot_date_format).toBe('YYMM');
    });

    it('사용기한(expiry_months)을 수정할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });

      // 사용기한 수정 (제약 조건 내의 값으로 수정)
      const { error } = await adminClient
        .from('manufacturer_settings')
        .update({ expiry_months: 36 })
        .eq('organization_id', manufacturer.id);

      expect(error).toBeNull();

      // 수정 확인
      const { data: updated } = await adminClient
        .from('manufacturer_settings')
        .select('*')
        .eq('organization_id', manufacturer.id)
        .single();

      expect(updated?.expiry_months).toBe(36);
    });

    it('Lot 모델 자릿수(lot_model_digits)를 수정할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });

      // 자릿수 수정
      const { error } = await adminClient
        .from('manufacturer_settings')
        .update({ lot_model_digits: 4 })
        .eq('organization_id', manufacturer.id);

      expect(error).toBeNull();

      // 수정 확인
      const { data: updated } = await adminClient
        .from('manufacturer_settings')
        .select('*')
        .eq('organization_id', manufacturer.id)
        .single();

      expect(updated?.lot_model_digits).toBe(4);
    });
  });

  describe('조직과 제조사 설정 조인 조회', () => {
    it('조직 정보와 제조사 설정을 함께 조회할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({
        type: 'MANUFACTURER',
        name: '테스트제조사',
      });

      // 조인 조회
      const { data: orgWithSettings, error } = await adminClient
        .from('organizations')
        .select('*, manufacturer_settings(*)')
        .eq('id', manufacturer.id)
        .single();

      expect(error).toBeNull();
      expect(orgWithSettings).toBeDefined();
      expect(orgWithSettings?.name).toBe('테스트제조사');
      expect(orgWithSettings?.manufacturer_settings).toBeDefined();
    });
  });

  describe('설정 기본값 확인', () => {
    it('트리거 생성 시 기본값이 올바르게 설정되어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });

      const { data: settings } = await adminClient
        .from('manufacturer_settings')
        .select('*')
        .eq('organization_id', manufacturer.id)
        .single();

      // 기본값 확인 (DB 스키마에 정의된 기본값)
      expect(settings).toBeDefined();
      expect(typeof settings?.lot_prefix).toBe('string');
      expect(typeof settings?.lot_model_digits).toBe('number');
      expect(typeof settings?.expiry_months).toBe('number');
      expect(typeof settings?.lot_date_format).toBe('string');
    });
  });
});
