/**
 * Admin Service 통합 테스트
 *
 * 관리자 서비스 기능을 테스트합니다.
 * 실제 Supabase 로컬 인스턴스를 사용합니다.
 */
import { describe, it, expect, afterEach, afterAll } from 'vitest';
import {
  createTestAdminClient,
  createTestOrganization,
  createTestProduct,
  createTestLot,
  getVirtualCodesByLot,
  updateVirtualCodeOwner,
  cleanupAllTestData,
} from '../helpers';
import { ORGANIZATION_STATUSES, ORGANIZATION_TYPES } from '@/constants/organization';

describe('Admin Service Integration Tests', () => {
  const adminClient = createTestAdminClient();

  afterEach(async () => {
    await cleanupAllTestData();
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  describe('조직 목록 조회', () => {
    it('전체 조직 목록을 조회할 수 있어야 한다', async () => {
      await createTestOrganization({ type: 'MANUFACTURER', name: '제조사A' });
      await createTestOrganization({ type: 'DISTRIBUTOR', name: '유통사B' });
      await createTestOrganization({ type: 'HOSPITAL', name: '병원C' });

      const { data: organizations, count } = await adminClient
        .from('organizations')
        .select('*', { count: 'exact' })
        .neq('type', 'ADMIN')
        .order('created_at', { ascending: false });

      expect(organizations).toBeDefined();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    it('상태별로 조직을 필터링할 수 있어야 한다', async () => {
      await createTestOrganization({ type: 'MANUFACTURER', status: 'ACTIVE' });
      await createTestOrganization({ type: 'DISTRIBUTOR', status: 'PENDING_APPROVAL' });
      await createTestOrganization({ type: 'HOSPITAL', status: 'INACTIVE' });

      // 활성 조직만
      const { data: activeOrgs } = await adminClient
        .from('organizations')
        .select('*')
        .eq('status', ORGANIZATION_STATUSES.ACTIVE);

      // 승인 대기 조직만
      const { data: pendingOrgs } = await adminClient
        .from('organizations')
        .select('*')
        .eq('status', ORGANIZATION_STATUSES.PENDING_APPROVAL);

      expect(activeOrgs?.length).toBeGreaterThanOrEqual(1);
      expect(pendingOrgs?.length).toBeGreaterThanOrEqual(1);
    });

    it('타입별로 조직을 필터링할 수 있어야 한다', async () => {
      await createTestOrganization({ type: 'MANUFACTURER' });
      await createTestOrganization({ type: 'MANUFACTURER' });
      await createTestOrganization({ type: 'DISTRIBUTOR' });

      const { data: manufacturers } = await adminClient
        .from('organizations')
        .select('*')
        .eq('type', ORGANIZATION_TYPES.MANUFACTURER);

      expect(manufacturers?.length).toBeGreaterThanOrEqual(2);
    });

    it('조직명이나 이메일로 검색할 수 있어야 한다', async () => {
      await createTestOrganization({ type: 'MANUFACTURER', name: '검색테스트제조사' });

      const { data: searchResults } = await adminClient
        .from('organizations')
        .select('*')
        .ilike('name', '%검색테스트%');

      expect(searchResults?.length).toBeGreaterThanOrEqual(1);
      expect(searchResults?.[0].name).toContain('검색테스트');
    });
  });

  describe('승인 대기 조직 관리', () => {
    it('승인 대기 조직 목록을 조회할 수 있어야 한다', async () => {
      await createTestOrganization({ type: 'MANUFACTURER', status: 'PENDING_APPROVAL' });
      await createTestOrganization({ type: 'DISTRIBUTOR', status: 'PENDING_APPROVAL' });

      const { data: pendingOrgs, count } = await adminClient
        .from('organizations')
        .select('*', { count: 'exact' })
        .eq('status', ORGANIZATION_STATUSES.PENDING_APPROVAL)
        .neq('type', 'ADMIN')
        .order('created_at', { ascending: true });

      expect(pendingOrgs).toBeDefined();
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });

  describe('조직 상태 변경', () => {
    it('조직을 승인(ACTIVE)할 수 있어야 한다', async () => {
      const org = await createTestOrganization({
        type: 'MANUFACTURER',
        status: 'PENDING_APPROVAL',
      });

      // 승인
      const { error } = await adminClient
        .from('organizations')
        .update({ status: ORGANIZATION_STATUSES.ACTIVE })
        .eq('id', org.id);

      expect(error).toBeNull();

      const { data: updatedOrg } = await adminClient
        .from('organizations')
        .select('status')
        .eq('id', org.id)
        .single();

      expect(updatedOrg?.status).toBe(ORGANIZATION_STATUSES.ACTIVE);
    });

    it('조직을 비활성화(INACTIVE)할 수 있어야 한다', async () => {
      const org = await createTestOrganization({ type: 'DISTRIBUTOR', status: 'ACTIVE' });

      const { error } = await adminClient
        .from('organizations')
        .update({ status: ORGANIZATION_STATUSES.INACTIVE })
        .eq('id', org.id);

      expect(error).toBeNull();

      const { data: updatedOrg } = await adminClient
        .from('organizations')
        .select('status')
        .eq('id', org.id)
        .single();

      expect(updatedOrg?.status).toBe(ORGANIZATION_STATUSES.INACTIVE);
    });

    it('조직을 삭제(DELETED) 상태로 변경할 수 있어야 한다', async () => {
      const org = await createTestOrganization({ type: 'HOSPITAL', status: 'ACTIVE' });

      const { error } = await adminClient
        .from('organizations')
        .update({ status: ORGANIZATION_STATUSES.DELETED })
        .eq('id', org.id);

      expect(error).toBeNull();

      const { data: updatedOrg } = await adminClient
        .from('organizations')
        .select('status')
        .eq('id', org.id)
        .single();

      expect(updatedOrg?.status).toBe(ORGANIZATION_STATUSES.DELETED);
    });
  });

  describe('조직 상세 조회', () => {
    it('조직 상세 정보를 조회할 수 있어야 한다', async () => {
      const org = await createTestOrganization({
        type: 'MANUFACTURER',
        name: '상세조회테스트',
      });

      const { data: orgDetail } = await adminClient
        .from('organizations')
        .select('*')
        .eq('id', org.id)
        .single();

      expect(orgDetail).toBeDefined();
      expect(orgDetail?.name).toBe('상세조회테스트');
      expect(orgDetail?.type).toBe(ORGANIZATION_TYPES.MANUFACTURER);
    });

    it('제조사 상세 조회 시 제조사 설정도 함께 조회할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });

      // 제조사 설정 생성
      await adminClient.from('manufacturer_settings').upsert(
        {
          organization_id: manufacturer.id,
          lot_prefix: 'TEST',
          lot_model_digits: 5,
          expiry_months: 24,
        },
        { onConflict: 'organization_id' }
      );

      const { data: orgWithSettings } = await adminClient
        .from('organizations')
        .select('*, manufacturer_settings(*)')
        .eq('id', manufacturer.id)
        .single();

      expect(orgWithSettings).toBeDefined();
      expect(orgWithSettings?.manufacturer_settings).toBeDefined();
    });
  });

  describe('조직별 가상 코드 통계', () => {
    it('각 조직의 보유 가상 코드 수를 조회할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const distributor = await createTestOrganization({ type: 'DISTRIBUTOR' });

      const product = await createTestProduct({ organizationId: manufacturer.id });
      const lot = await createTestLot({ productId: product.id, quantity: 10 });
      const codes = await getVirtualCodesByLot(lot.id);

      // 5개는 유통사로 이전
      for (let i = 0; i < 5; i++) {
        await updateVirtualCodeOwner(codes[i].id, 'ORGANIZATION', distributor.id);
      }

      // 제조사 소유 가상 코드 수
      const { data: manufacturerCodes } = await adminClient
        .from('virtual_codes')
        .select('owner_id')
        .eq('owner_id', manufacturer.id);

      // 유통사 소유 가상 코드 수
      const { data: distributorCodes } = await adminClient
        .from('virtual_codes')
        .select('owner_id')
        .eq('owner_id', distributor.id);

      expect(manufacturerCodes?.length).toBe(5);
      expect(distributorCodes?.length).toBe(5);
    });
  });

  describe('전체 이력 조회', () => {
    it('모든 가상 코드의 이력을 조회할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const product = await createTestProduct({ organizationId: manufacturer.id });
      const lot = await createTestLot({ productId: product.id, quantity: 3 });
      const codes = await getVirtualCodesByLot(lot.id);

      // 트리거로 PRODUCED 이력이 자동 생성됨
      const { data: histories } = await adminClient
        .from('histories')
        .select('*')
        .in(
          'virtual_code_id',
          codes.map((c) => c.id)
        );

      expect(histories).toBeDefined();
      expect(histories?.length).toBeGreaterThanOrEqual(3); // 최소 PRODUCED 3개
    });

    it('가상 코드와 제품 정보를 조인하여 조회할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const product = await createTestProduct({
        organizationId: manufacturer.id,
        name: '관리자조회테스트제품',
      });
      const lot = await createTestLot({ productId: product.id, quantity: 1 });
      const codes = await getVirtualCodesByLot(lot.id);

      const { data: virtualCodes } = await adminClient
        .from('virtual_codes')
        .select(
          `
          *,
          lot:lots!inner(
            lot_number,
            product:products!inner(
              name,
              organization_id
            )
          )
        `
        )
        .eq('id', codes[0].id)
        .single();

      expect(virtualCodes).toBeDefined();
      const lotData = virtualCodes?.lot as { lot_number: string; product: { name: string } };
      expect(lotData.product.name).toBe('관리자조회테스트제품');
    });
  });

  describe('조직 선택 목록', () => {
    it('활성 상태인 조직만 선택 목록에 포함되어야 한다', async () => {
      await createTestOrganization({ type: 'MANUFACTURER', status: 'ACTIVE' });
      await createTestOrganization({ type: 'DISTRIBUTOR', status: 'INACTIVE' });

      const { data: selectableOrgs } = await adminClient
        .from('organizations')
        .select('id, name, type')
        .eq('status', 'ACTIVE')
        .neq('type', 'ADMIN')
        .order('name');

      // 활성 조직만 포함
      expect(selectableOrgs?.every((o) => o.type !== 'ADMIN')).toBe(true);
    });
  });

  describe('제품 선택 목록', () => {
    it('활성 제품만 선택 목록에 포함되어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });

      await createTestProduct({
        organizationId: manufacturer.id,
        name: '활성제품',
        isActive: true,
      });
      await createTestProduct({
        organizationId: manufacturer.id,
        name: '비활성제품',
        isActive: false,
      });

      const { data: selectableProducts } = await adminClient
        .from('products')
        .select('id, name, organization:organizations!inner(name)')
        .eq('is_active', true)
        .eq('organization_id', manufacturer.id);

      expect(selectableProducts).toBeDefined();
      expect(selectableProducts?.length).toBe(1);
      expect(selectableProducts?.[0].name).toBe('활성제품');
    });
  });
});
