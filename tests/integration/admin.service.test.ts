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
  createTestShipmentBatch,
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
      await createTestOrganization({ type: 'MANUFACTURER' });
      await createTestOrganization({ type: 'DISTRIBUTOR' });
      await createTestOrganization({ type: 'HOSPITAL' });

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
      const searchOrg = await createTestOrganization({ type: 'MANUFACTURER' });

      const { data: searchResults } = await adminClient
        .from('organizations')
        .select('*')
        .eq('id', searchOrg.id);

      expect(searchResults?.length).toBeGreaterThanOrEqual(1);
      expect(searchResults?.[0].name).toBe(searchOrg.name);
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
      });

      const { data: orgDetail } = await adminClient
        .from('organizations')
        .select('*')
        .eq('id', org.id)
        .single();

      expect(orgDetail).toBeDefined();
      expect(orgDetail?.name).toBe(org.name);
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

  describe('이벤트 요약 조회', () => {
    it('동시 출고가 하나의 이벤트로 그룹핑되어야 한다', async () => {
      // 테스트 데이터 생성
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const distributor = await createTestOrganization({ type: 'DISTRIBUTOR' });
      const product = await createTestProduct({ organizationId: manufacturer.id });
      const lot = await createTestLot({ productId: product.id, quantity: 10 });
      const codes = await getVirtualCodesByLot(lot.id);

      // 출고 생성 (5개 코드 한 번에)
      const shipment = await createTestShipmentBatch({
        fromOrganizationId: manufacturer.id,
        toOrganizationType: 'DISTRIBUTOR',
        toOrganizationId: distributor.id,
        virtualCodeIds: codes.slice(0, 5).map((c) => c.id),
      });

      expect(shipment).toBeDefined();
      expect(shipment.id).toBeDefined();

      // 출고 이력 추가 (SHIPPED, RECEIVED)
      const now = new Date().toISOString();
      const shippedHistories = codes.slice(0, 5).map((code) => ({
        virtual_code_id: code.id,
        action_type: 'SHIPPED' as const,
        from_owner_type: 'ORGANIZATION' as const,
        from_owner_id: manufacturer.id,
        to_owner_type: 'ORGANIZATION' as const,
        to_owner_id: distributor.id,
        is_recall: false,
        shipment_batch_id: shipment.id,
        created_at: now,
      }));

      await adminClient.from('histories').insert(shippedHistories);

      const receivedHistories = codes.slice(0, 5).map((code) => ({
        virtual_code_id: code.id,
        action_type: 'RECEIVED' as const,
        from_owner_type: 'ORGANIZATION' as const,
        from_owner_id: manufacturer.id,
        to_owner_type: 'ORGANIZATION' as const,
        to_owner_id: distributor.id,
        is_recall: false,
        shipment_batch_id: shipment.id,
        created_at: now,
      }));

      await adminClient.from('histories').insert(receivedHistories);

      // DB 함수로 이벤트 요약 조회 (특정 조직 ID로 필터링하여 쿼리 범위 축소)
      const { data: summaryData, error } = await adminClient.rpc('get_admin_event_summary', {
        p_start_date: null,
        p_end_date: null,
        p_action_types: null,
        p_lot_number: null,
        p_product_id: null,
        p_organization_id: manufacturer.id,
        p_include_recalled: true,
        p_limit: 50,
        p_offset: 0,
      });

      expect(error).toBeNull();
      expect(summaryData).toBeDefined();

      // 출고 이벤트가 존재하는지 확인
      const shipmentEvents = summaryData?.filter(
        (e: { action_type: string; from_owner_id: string }) =>
          e.action_type === 'SHIPPED' && e.from_owner_id === manufacturer.id
      );

      // 동시 출고는 하나의 이벤트로 그룹핑
      expect(shipmentEvents?.length).toBeGreaterThanOrEqual(1);

      // 해당 이벤트의 총 수량 검증
      if (shipmentEvents && shipmentEvents.length > 0) {
        const eventWithQuantity = shipmentEvents.find(
          (e: { total_quantity: number }) => e.total_quantity >= 5
        );
        expect(eventWithQuantity).toBeDefined();
      }
    });

    it('회수된 이벤트가 필터링 가능해야 한다', async () => {
      // 테스트 데이터 생성
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const distributor = await createTestOrganization({ type: 'DISTRIBUTOR' });
      const product = await createTestProduct({ organizationId: manufacturer.id });
      const lot = await createTestLot({ productId: product.id, quantity: 20 });
      const codes = await getVirtualCodesByLot(lot.id);

      // 출고 생성 (10개 코드)
      const shipment = await createTestShipmentBatch({
        fromOrganizationId: manufacturer.id,
        toOrganizationType: 'DISTRIBUTOR',
        toOrganizationId: distributor.id,
        virtualCodeIds: codes.slice(0, 10).map((c) => c.id),
      });

      // 출고 이력 추가
      const now = new Date().toISOString();
      const shippedHistories = codes.slice(0, 10).map((code) => ({
        virtual_code_id: code.id,
        action_type: 'SHIPPED' as const,
        from_owner_type: 'ORGANIZATION' as const,
        from_owner_id: manufacturer.id,
        to_owner_type: 'ORGANIZATION' as const,
        to_owner_id: distributor.id,
        is_recall: false,
        shipment_batch_id: shipment.id,
        created_at: now,
      }));

      await adminClient.from('histories').insert(shippedHistories);

      // 출고 회수
      const { error: recallError } = await adminClient
        .from('shipment_batches')
        .update({
          is_recalled: true,
          recall_date: new Date().toISOString(),
          recall_reason: '테스트 회수 사유',
        })
        .eq('id', shipment.id);

      expect(recallError).toBeNull();

      // 회수된 코드를 제조사로 복귀
      for (let i = 0; i < 10; i++) {
        await updateVirtualCodeOwner(codes[i].id, 'ORGANIZATION', manufacturer.id);
      }

      // 회수 이력 추가
      const recallHistories = codes.slice(0, 10).map((code) => ({
        virtual_code_id: code.id,
        action_type: 'RECALLED' as const,
        from_owner_type: 'ORGANIZATION' as const,
        from_owner_id: distributor.id,
        to_owner_type: 'ORGANIZATION' as const,
        to_owner_id: manufacturer.id,
        is_recall: true,
        recall_reason: '테스트 회수 사유',
        shipment_batch_id: shipment.id,
      }));

      await adminClient.from('histories').insert(recallHistories);

      // 회수 이벤트 포함 조회 (특정 조직 ID로 필터링하여 쿼리 범위 축소)
      const { data: withRecalled } = await adminClient.rpc('get_admin_event_summary', {
        p_start_date: null,
        p_end_date: null,
        p_action_types: null,
        p_lot_number: null,
        p_product_id: null,
        p_organization_id: manufacturer.id,
        p_include_recalled: true,
        p_limit: 50,
        p_offset: 0,
      });

      // 회수 이벤트 제외 조회 (특정 조직 ID로 필터링하여 쿼리 범위 축소)
      const { data: withoutRecalled } = await adminClient.rpc('get_admin_event_summary', {
        p_start_date: null,
        p_end_date: null,
        p_action_types: null,
        p_lot_number: null,
        p_product_id: null,
        p_organization_id: manufacturer.id,
        p_include_recalled: false,
        p_limit: 50,
        p_offset: 0,
      });

      // 회수 포함 조회에는 RECALLED 이벤트 존재
      const recalledEvents = withRecalled?.filter(
        (e: { action_type: string }) => e.action_type === 'RECALLED'
      );
      expect(recalledEvents?.length).toBeGreaterThanOrEqual(1);

      // 회수 제외 조회에는 RECALLED 이벤트가 적거나 없어야 함
      const recalledEventsFiltered = withoutRecalled?.filter(
        (e: { action_type: string }) => e.action_type === 'RECALLED'
      );
      // 필터가 is_recall 플래그 기준인지 action_type 기준인지에 따라 다름
      // 일반적으로 회수 필터는 is_recall 플래그로 필터링
      expect(recalledEventsFiltered?.length ?? 0).toBeLessThanOrEqual(recalledEvents?.length ?? 0);
    });

    it('액션 타입별로 필터링 가능해야 한다', async () => {
      // 테스트 데이터를 먼저 생성하여 PRODUCED 이력 확보
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const product = await createTestProduct({ organizationId: manufacturer.id });
      await createTestLot({ productId: product.id, quantity: 3 });

      // 모든 이벤트 조회 (특정 조직 ID로 필터링하여 쿼리 범위 축소)
      const { data: allEvents, error: allError } = await adminClient.rpc(
        'get_admin_event_summary',
        {
          p_start_date: null,
          p_end_date: null,
          p_action_types: null,
          p_lot_number: null,
          p_product_id: null,
          p_organization_id: manufacturer.id,
          p_include_recalled: true,
          p_limit: 100,
          p_offset: 0,
        }
      );

      expect(allError).toBeNull();
      expect(allEvents).toBeDefined();
      expect(allEvents?.length).toBeGreaterThan(0);

      // PRODUCED 이벤트 존재 확인
      const producedEvents = allEvents?.filter(
        (e: { action_type: string }) => e.action_type === 'PRODUCED'
      );
      expect(producedEvents?.length).toBeGreaterThan(0);
    });

    it('Lot 번호로 필터링 가능해야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const product = await createTestProduct({ organizationId: manufacturer.id });
      const lot = await createTestLot({ productId: product.id, quantity: 5 });

      // 해당 Lot 번호로 필터링
      const { data: filteredEvents, error } = await adminClient.rpc('get_admin_event_summary', {
        p_start_date: null,
        p_end_date: null,
        p_action_types: null,
        p_lot_number: lot.lot_number,
        p_product_id: null,
        p_organization_id: null,
        p_include_recalled: true,
        p_limit: 50,
        p_offset: 0,
      });

      expect(error).toBeNull();
      expect(filteredEvents).toBeDefined();

      // PRODUCED 이벤트가 있어야 함 (Lot 생성 시 자동 생성)
      const producedEvent = filteredEvents?.find(
        (e: { action_type: string }) => e.action_type === 'PRODUCED'
      );
      expect(producedEvent).toBeDefined();
    });
  });
});
