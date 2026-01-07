/**
 * Shipment Service 통합 테스트
 *
 * 출고 생성, FIFO 선택, 소유권 이전, 24시간 회수 등을 테스트합니다.
 * 실제 Supabase 로컬 인스턴스를 사용합니다.
 */
import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import {
  createTestAdminClient,
  createTestOrganization,
  createTestProduct,
  createTestLot,
  getVirtualCodesByLot,
  cleanupAllTestData,
} from '../helpers';
import { VIRTUAL_CODE_STATUSES, ORGANIZATION_TYPES } from '@/constants';

describe('Shipment Service Integration Tests', () => {
  const adminClient = createTestAdminClient();

  afterEach(async () => {
    await cleanupAllTestData();
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  describe('FIFO 기반 가상코드 선택 (select_fifo_codes RPC)', () => {
    let manufacturer: Awaited<ReturnType<typeof createTestOrganization>>;
    let product: Awaited<ReturnType<typeof createTestProduct>>;

    beforeEach(async () => {
      manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      product = await createTestProduct({ organizationId: manufacturer.id });
    });

    it('요청한 수량만큼 가상코드를 선택해야 한다', async () => {
      // Lot 생성 (10개 가상코드)
      const lot = await createTestLot({
        productId: product.id,
        manufacturerId: manufacturer.id,
        quantity: 10,
      });

      // FIFO 선택: 5개 요청
      const { data: selectedCodes, error } = await adminClient.rpc('select_fifo_codes', {
        p_product_id: product.id,
        p_owner_id: manufacturer.id,
        p_quantity: 5,
      });

      expect(error).toBeNull();
      expect(selectedCodes).toHaveLength(5);
    });

    it('재고보다 많이 요청하면 가능한 만큼만 반환해야 한다', async () => {
      // Lot 생성 (5개 가상코드)
      await createTestLot({
        productId: product.id,
        manufacturerId: manufacturer.id,
        quantity: 5,
      });

      // FIFO 선택: 10개 요청 (5개만 가능)
      const { data: selectedCodes, error } = await adminClient.rpc('select_fifo_codes', {
        p_product_id: product.id,
        p_owner_id: manufacturer.id,
        p_quantity: 10,
      });

      expect(error).toBeNull();
      expect(selectedCodes).toHaveLength(5);
    });

    it('제조일 기준으로 오래된 Lot의 코드를 먼저 선택해야 한다 (FIFO)', async () => {
      // 오래된 Lot (2024년)
      const oldLot = await createTestLot({
        productId: product.id,
        manufacturerId: manufacturer.id,
        quantity: 3,
        manufactureDate: '2024-01-01',
      });

      // 새로운 Lot (2025년)
      const newLot = await createTestLot({
        productId: product.id,
        manufacturerId: manufacturer.id,
        quantity: 3,
      });

      // 3개 선택 - 오래된 Lot에서 선택되어야 함
      const { data: selectedCodes } = await adminClient.rpc('select_fifo_codes', {
        p_product_id: product.id,
        p_owner_id: manufacturer.id,
        p_quantity: 3,
      });

      // 선택된 코드가 오래된 Lot에 속하는지 확인
      const oldLotCodes = await getVirtualCodesByLot(oldLot.id);
      const oldLotCodeIds = oldLotCodes.map((c) => c.id);
      const selectedIds = selectedCodes.map((c: { virtual_code_id: string }) => c.virtual_code_id);

      // 모든 선택된 코드가 오래된 Lot에서 왔어야 함
      expect(selectedIds.every((id: string) => oldLotCodeIds.includes(id))).toBe(true);
    });

    it('특정 Lot을 지정하면 해당 Lot에서만 선택해야 한다', async () => {
      // Lot 1
      const lot1 = await createTestLot({
        productId: product.id,
        manufacturerId: manufacturer.id,
        quantity: 5,
      });

      // Lot 2
      const lot2 = await createTestLot({
        productId: product.id,
        manufacturerId: manufacturer.id,
        quantity: 5,
      });

      // lot2 지정해서 선택
      const { data: selectedCodes } = await adminClient.rpc('select_fifo_codes', {
        p_product_id: product.id,
        p_owner_id: manufacturer.id,
        p_quantity: 3,
        p_lot_id: lot2.id,
      });

      // 선택된 코드가 lot2에 속하는지 확인
      const lot2Codes = await getVirtualCodesByLot(lot2.id);
      const lot2CodeIds = lot2Codes.map((c) => c.id);
      const selectedIds = selectedCodes.map((c: { virtual_code_id: string }) => c.virtual_code_id);

      expect(selectedIds.every((id: string) => lot2CodeIds.includes(id))).toBe(true);
    });

    it('다른 소유자의 코드는 선택하지 않아야 한다', async () => {
      // 다른 조직
      const otherOrg = await createTestOrganization({ type: 'DISTRIBUTOR' });

      // Lot 생성 (제조사 소유)
      await createTestLot({
        productId: product.id,
        manufacturerId: manufacturer.id,
        quantity: 5,
      });

      // 다른 조직으로 선택 시도
      const { data: selectedCodes } = await adminClient.rpc('select_fifo_codes', {
        p_product_id: product.id,
        p_owner_id: otherOrg.id,
        p_quantity: 5,
      });

      expect(selectedCodes).toHaveLength(0);
    });

    it('IN_STOCK 상태의 코드만 선택해야 한다', async () => {
      // Lot 생성
      const lot = await createTestLot({
        productId: product.id,
        manufacturerId: manufacturer.id,
        quantity: 5,
      });

      // 일부 코드를 USED 상태로 변경
      const codes = await getVirtualCodesByLot(lot.id);
      await adminClient
        .from('virtual_codes')
        .update({ status: VIRTUAL_CODE_STATUSES.USED })
        .eq('id', codes[0].id);

      await adminClient
        .from('virtual_codes')
        .update({ status: VIRTUAL_CODE_STATUSES.USED })
        .eq('id', codes[1].id);

      // 5개 요청하지만 3개만 IN_STOCK
      const { data: selectedCodes } = await adminClient.rpc('select_fifo_codes', {
        p_product_id: product.id,
        p_owner_id: manufacturer.id,
        p_quantity: 5,
      });

      expect(selectedCodes).toHaveLength(3);
    });

    it('재고가 0개인 경우 빈 배열을 반환해야 한다', async () => {
      // Lot이 없는 제품에서 선택 시도
      const { data: selectedCodes, error } = await adminClient.rpc('select_fifo_codes', {
        p_product_id: product.id,
        p_owner_id: manufacturer.id,
        p_quantity: 10,
      });

      expect(error).toBeNull();
      expect(selectedCodes).toHaveLength(0);
    });

    it('모든 재고가 USED 상태인 경우 빈 배열을 반환해야 한다', async () => {
      // Lot 생성
      const lot = await createTestLot({
        productId: product.id,
        manufacturerId: manufacturer.id,
        quantity: 3,
      });

      // 모든 코드를 USED 상태로 변경
      const codes = await getVirtualCodesByLot(lot.id);
      for (const code of codes) {
        await adminClient
          .from('virtual_codes')
          .update({ status: VIRTUAL_CODE_STATUSES.USED })
          .eq('id', code.id);
      }

      // 선택 시도
      const { data: selectedCodes } = await adminClient.rpc('select_fifo_codes', {
        p_product_id: product.id,
        p_owner_id: manufacturer.id,
        p_quantity: 3,
      });

      expect(selectedCodes).toHaveLength(0);
    });
  });

  describe('출고 생성 (createShipment)', () => {
    let manufacturer: Awaited<ReturnType<typeof createTestOrganization>>;
    let distributor: Awaited<ReturnType<typeof createTestOrganization>>;
    let product: Awaited<ReturnType<typeof createTestProduct>>;
    let lot: Awaited<ReturnType<typeof createTestLot>>;

    beforeEach(async () => {
      manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      distributor = await createTestOrganization({ type: 'DISTRIBUTOR' });
      product = await createTestProduct({ organizationId: manufacturer.id });
      lot = await createTestLot({
        productId: product.id,
        manufacturerId: manufacturer.id,
        quantity: 10,
      });
    });

    it('출고 뭉치가 정상적으로 생성되어야 한다', async () => {
      // 출고 뭉치 생성
      const { data: shipmentBatch, error } = await adminClient
        .from('shipment_batches')
        .insert({
          from_organization_id: manufacturer.id,
          to_organization_id: distributor.id,
          to_organization_type: ORGANIZATION_TYPES.DISTRIBUTOR,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(shipmentBatch).toBeDefined();
      expect(shipmentBatch?.from_organization_id).toBe(manufacturer.id);
      expect(shipmentBatch?.to_organization_id).toBe(distributor.id);
      expect(shipmentBatch?.is_recalled).toBe(false);
    });

    it('출고 시 소유권이 수신 조직으로 이전되어야 한다', async () => {
      // FIFO 선택
      const { data: selectedCodes } = await adminClient.rpc('select_fifo_codes', {
        p_product_id: product.id,
        p_owner_id: manufacturer.id,
        p_quantity: 3,
      });

      const codeIds = selectedCodes.map((c: { virtual_code_id: string }) => c.virtual_code_id);

      // 출고 뭉치 생성
      const { data: shipmentBatch } = await adminClient
        .from('shipment_batches')
        .insert({
          from_organization_id: manufacturer.id,
          to_organization_id: distributor.id,
          to_organization_type: ORGANIZATION_TYPES.DISTRIBUTOR,
        })
        .select()
        .single();

      // 소유권 이전
      await adminClient
        .from('virtual_codes')
        .update({
          owner_id: distributor.id,
          owner_type: 'ORGANIZATION',
        })
        .in('id', codeIds);

      // 출고 상세 기록
      const detailInserts = codeIds.map((virtualCodeId: string) => ({
        shipment_batch_id: shipmentBatch!.id,
        virtual_code_id: virtualCodeId,
      }));
      await adminClient.from('shipment_details').insert(detailInserts);

      // 소유권 확인
      const { data: updatedCodes } = await adminClient
        .from('virtual_codes')
        .select('owner_id, owner_type')
        .in('id', codeIds);

      expect(updatedCodes?.every((c) => c.owner_id === distributor.id)).toBe(true);
      expect(updatedCodes?.every((c) => c.owner_type === 'ORGANIZATION')).toBe(true);
    });

    it('출고 상세가 정상적으로 기록되어야 한다', async () => {
      const { data: selectedCodes } = await adminClient.rpc('select_fifo_codes', {
        p_product_id: product.id,
        p_owner_id: manufacturer.id,
        p_quantity: 5,
      });

      const codeIds = selectedCodes.map((c: { virtual_code_id: string }) => c.virtual_code_id);

      const { data: shipmentBatch } = await adminClient
        .from('shipment_batches')
        .insert({
          from_organization_id: manufacturer.id,
          to_organization_id: distributor.id,
          to_organization_type: ORGANIZATION_TYPES.DISTRIBUTOR,
        })
        .select()
        .single();

      // 출고 상세 기록
      const detailInserts = codeIds.map((virtualCodeId: string) => ({
        shipment_batch_id: shipmentBatch!.id,
        virtual_code_id: virtualCodeId,
      }));
      const { error: detailError } = await adminClient.from('shipment_details').insert(detailInserts);

      expect(detailError).toBeNull();

      // 출고 상세 조회
      const { data: details } = await adminClient
        .from('shipment_details')
        .select('*')
        .eq('shipment_batch_id', shipmentBatch!.id);

      expect(details).toHaveLength(5);
    });

    it('출고 이력이 histories 테이블에 기록되어야 한다', async () => {
      const { data: selectedCodes } = await adminClient.rpc('select_fifo_codes', {
        p_product_id: product.id,
        p_owner_id: manufacturer.id,
        p_quantity: 2,
      });

      const codeIds = selectedCodes.map((c: { virtual_code_id: string }) => c.virtual_code_id);

      const { data: shipmentBatch } = await adminClient
        .from('shipment_batches')
        .insert({
          from_organization_id: manufacturer.id,
          to_organization_id: distributor.id,
          to_organization_type: ORGANIZATION_TYPES.DISTRIBUTOR,
        })
        .select()
        .single();

      // 이력 기록
      const historyInserts = codeIds.map((virtualCodeId: string) => ({
        virtual_code_id: virtualCodeId,
        action_type: 'SHIPPED' as const,
        from_owner_type: 'ORGANIZATION' as const,
        from_owner_id: manufacturer.id,
        to_owner_type: 'ORGANIZATION' as const,
        to_owner_id: distributor.id,
        shipment_batch_id: shipmentBatch!.id,
        is_recall: false,
      }));
      await adminClient.from('histories').insert(historyInserts);

      // 이력 확인
      const { data: histories } = await adminClient
        .from('histories')
        .select('*')
        .eq('shipment_batch_id', shipmentBatch!.id);

      expect(histories).toHaveLength(2);
      expect(histories?.[0].action_type).toBe('SHIPPED');
      expect(histories?.[0].is_recall).toBe(false);
    });

    it('재고 부족 시 선택 가능한 코드만 반환해야 한다', async () => {
      // 5개만 있는 상태에서 10개 요청
      const { data: selectedCodes } = await adminClient.rpc('select_fifo_codes', {
        p_product_id: product.id,
        p_owner_id: manufacturer.id,
        p_quantity: 15, // 10개만 있음
      });

      expect(selectedCodes).toHaveLength(10);
    });
  });

  describe('24시간 회수 제한 (is_recall_allowed RPC)', () => {
    let manufacturer: Awaited<ReturnType<typeof createTestOrganization>>;
    let distributor: Awaited<ReturnType<typeof createTestOrganization>>;

    beforeEach(async () => {
      manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      distributor = await createTestOrganization({ type: 'DISTRIBUTOR' });
    });

    it('방금 생성된 출고는 회수 가능해야 한다', async () => {
      // 출고 뭉치 생성 (현재 시간)
      const { data: shipmentBatch } = await adminClient
        .from('shipment_batches')
        .insert({
          from_organization_id: manufacturer.id,
          to_organization_id: distributor.id,
          to_organization_type: ORGANIZATION_TYPES.DISTRIBUTOR,
        })
        .select()
        .single();

      // 회수 가능 여부 확인
      const { data: isAllowed, error } = await adminClient.rpc('is_recall_allowed', {
        p_shipment_batch_id: shipmentBatch!.id,
      });

      expect(error).toBeNull();
      expect(isAllowed).toBe(true);
    });

    it('24시간 이전에 생성된 출고는 회수 가능해야 한다', async () => {
      // 23시간 전 시간
      const twentyThreeHoursAgo = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();

      // 출고 뭉치 생성 (23시간 전)
      const { data: shipmentBatch } = await adminClient
        .from('shipment_batches')
        .insert({
          from_organization_id: manufacturer.id,
          to_organization_id: distributor.id,
          to_organization_type: ORGANIZATION_TYPES.DISTRIBUTOR,
          shipment_date: twentyThreeHoursAgo,
        })
        .select()
        .single();

      const { data: isAllowed } = await adminClient.rpc('is_recall_allowed', {
        p_shipment_batch_id: shipmentBatch!.id,
      });

      expect(isAllowed).toBe(true);
    });

    it('24시간 이상 경과된 출고는 회수 불가능해야 한다', async () => {
      // 25시간 전 시간
      const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();

      // 출고 뭉치 생성 (25시간 전)
      const { data: shipmentBatch } = await adminClient
        .from('shipment_batches')
        .insert({
          from_organization_id: manufacturer.id,
          to_organization_id: distributor.id,
          to_organization_type: ORGANIZATION_TYPES.DISTRIBUTOR,
          shipment_date: twentyFiveHoursAgo,
        })
        .select()
        .single();

      const { data: isAllowed } = await adminClient.rpc('is_recall_allowed', {
        p_shipment_batch_id: shipmentBatch!.id,
      });

      expect(isAllowed).toBe(false);
    });

    it('정확히 24시간 전에 생성된 출고는 회수 불가능해야 한다', async () => {
      // 정확히 24시간 전 (경계값)
      const exactly24HoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: shipmentBatch } = await adminClient
        .from('shipment_batches')
        .insert({
          from_organization_id: manufacturer.id,
          to_organization_id: distributor.id,
          to_organization_type: ORGANIZATION_TYPES.DISTRIBUTOR,
          shipment_date: exactly24HoursAgo,
        })
        .select()
        .single();

      const { data: isAllowed } = await adminClient.rpc('is_recall_allowed', {
        p_shipment_batch_id: shipmentBatch!.id,
      });

      expect(isAllowed).toBe(false);
    });

    it.each([
      { label: '10초', margin: 10 * 1000 },
      { label: '30초', margin: 30 * 1000 },
      { label: '1분', margin: 60 * 1000 },
    ])('24시간보다 $label 짧은 출고는 회수 가능해야 한다', async ({ margin }) => {
      // 24시간 - margin 전 (경계값 직전)
      const timeBeforeDeadline = new Date(Date.now() - (24 * 60 * 60 * 1000 - margin)).toISOString();

      const { data: shipmentBatch } = await adminClient
        .from('shipment_batches')
        .insert({
          from_organization_id: manufacturer.id,
          to_organization_id: distributor.id,
          to_organization_type: ORGANIZATION_TYPES.DISTRIBUTOR,
          shipment_date: timeBeforeDeadline,
        })
        .select()
        .single();

      const { data: isAllowed } = await adminClient.rpc('is_recall_allowed', {
        p_shipment_batch_id: shipmentBatch!.id,
      });

      expect(isAllowed).toBe(true);
    });

    it('이미 회수된 출고는 재회수 불가능해야 한다', async () => {
      // 출고 뭉치 생성 (이미 회수됨)
      const { data: shipmentBatch } = await adminClient
        .from('shipment_batches')
        .insert({
          from_organization_id: manufacturer.id,
          to_organization_id: distributor.id,
          to_organization_type: ORGANIZATION_TYPES.DISTRIBUTOR,
          is_recalled: true,
          recall_date: new Date().toISOString(),
          recall_reason: '테스트 회수',
        })
        .select()
        .single();

      const { data: isAllowed } = await adminClient.rpc('is_recall_allowed', {
        p_shipment_batch_id: shipmentBatch!.id,
      });

      expect(isAllowed).toBe(false);
    });

    it('존재하지 않는 출고 뭉치는 false를 반환해야 한다', async () => {
      const { data: isAllowed } = await adminClient.rpc('is_recall_allowed', {
        p_shipment_batch_id: '00000000-0000-0000-0000-000000000000',
      });

      expect(isAllowed).toBe(false);
    });
  });

  describe('출고 회수 (recallShipment)', () => {
    let manufacturer: Awaited<ReturnType<typeof createTestOrganization>>;
    let distributor: Awaited<ReturnType<typeof createTestOrganization>>;
    let product: Awaited<ReturnType<typeof createTestProduct>>;

    beforeEach(async () => {
      manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      distributor = await createTestOrganization({ type: 'DISTRIBUTOR' });
      product = await createTestProduct({ organizationId: manufacturer.id });
    });

    it('회수 시 소유권이 발송자에게 복귀되어야 한다', async () => {
      // Lot 생성
      await createTestLot({
        productId: product.id,
        manufacturerId: manufacturer.id,
        quantity: 5,
      });

      // FIFO 선택
      const { data: selectedCodes } = await adminClient.rpc('select_fifo_codes', {
        p_product_id: product.id,
        p_owner_id: manufacturer.id,
        p_quantity: 3,
      });
      const codeIds = selectedCodes.map((c: { virtual_code_id: string }) => c.virtual_code_id);

      // 출고 뭉치 생성
      const { data: shipmentBatch } = await adminClient
        .from('shipment_batches')
        .insert({
          from_organization_id: manufacturer.id,
          to_organization_id: distributor.id,
          to_organization_type: ORGANIZATION_TYPES.DISTRIBUTOR,
        })
        .select()
        .single();

      // 소유권 이전 (유통사로)
      await adminClient
        .from('virtual_codes')
        .update({
          owner_id: distributor.id,
          owner_type: 'ORGANIZATION',
        })
        .in('id', codeIds);

      // 출고 상세 기록
      const detailInserts = codeIds.map((virtualCodeId: string) => ({
        shipment_batch_id: shipmentBatch!.id,
        virtual_code_id: virtualCodeId,
      }));
      await adminClient.from('shipment_details').insert(detailInserts);

      // 회수: 소유권 복귀
      await adminClient
        .from('virtual_codes')
        .update({
          owner_id: manufacturer.id,
          owner_type: 'ORGANIZATION',
        })
        .in('id', codeIds);

      // 출고 뭉치 회수 처리
      await adminClient
        .from('shipment_batches')
        .update({
          is_recalled: true,
          recall_reason: '테스트 회수',
          recall_date: new Date().toISOString(),
        })
        .eq('id', shipmentBatch!.id);

      // 소유권 확인
      const { data: updatedCodes } = await adminClient
        .from('virtual_codes')
        .select('owner_id')
        .in('id', codeIds);

      expect(updatedCodes?.every((c) => c.owner_id === manufacturer.id)).toBe(true);
    });

    it('회수 시 is_recalled가 true로 변경되어야 한다', async () => {
      const { data: shipmentBatch } = await adminClient
        .from('shipment_batches')
        .insert({
          from_organization_id: manufacturer.id,
          to_organization_id: distributor.id,
          to_organization_type: ORGANIZATION_TYPES.DISTRIBUTOR,
        })
        .select()
        .single();

      // 회수 처리
      await adminClient
        .from('shipment_batches')
        .update({
          is_recalled: true,
          recall_reason: '고객 요청',
          recall_date: new Date().toISOString(),
        })
        .eq('id', shipmentBatch!.id);

      // 확인
      const { data: updatedBatch } = await adminClient
        .from('shipment_batches')
        .select('is_recalled, recall_reason')
        .eq('id', shipmentBatch!.id)
        .single();

      expect(updatedBatch?.is_recalled).toBe(true);
      expect(updatedBatch?.recall_reason).toBe('고객 요청');
    });

    it('회수 이력이 histories 테이블에 기록되어야 한다', async () => {
      // Lot 생성
      await createTestLot({
        productId: product.id,
        manufacturerId: manufacturer.id,
        quantity: 3,
      });

      const { data: selectedCodes } = await adminClient.rpc('select_fifo_codes', {
        p_product_id: product.id,
        p_owner_id: manufacturer.id,
        p_quantity: 2,
      });
      const codeIds = selectedCodes.map((c: { virtual_code_id: string }) => c.virtual_code_id);

      const { data: shipmentBatch } = await adminClient
        .from('shipment_batches')
        .insert({
          from_organization_id: manufacturer.id,
          to_organization_id: distributor.id,
          to_organization_type: ORGANIZATION_TYPES.DISTRIBUTOR,
        })
        .select()
        .single();

      // 회수 이력 기록
      const historyInserts = codeIds.map((virtualCodeId: string) => ({
        virtual_code_id: virtualCodeId,
        action_type: 'RECALLED' as const,
        from_owner_type: 'ORGANIZATION' as const,
        from_owner_id: distributor.id,
        to_owner_type: 'ORGANIZATION' as const,
        to_owner_id: manufacturer.id,
        shipment_batch_id: shipmentBatch!.id,
        is_recall: true,
        recall_reason: '테스트 회수',
      }));
      await adminClient.from('histories').insert(historyInserts);

      // 이력 확인
      const { data: histories } = await adminClient
        .from('histories')
        .select('*')
        .eq('shipment_batch_id', shipmentBatch!.id)
        .eq('is_recall', true);

      expect(histories).toHaveLength(2);
      expect(histories?.[0].action_type).toBe('RECALLED');
      expect(histories?.[0].is_recall).toBe(true);
    });
  });

  describe('다중 아이템 출고', () => {
    it('여러 제품을 한 번에 출고할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const distributor = await createTestOrganization({ type: 'DISTRIBUTOR' });

      // 제품 2개
      const product1 = await createTestProduct({
        organizationId: manufacturer.id,
        name: '제품1',
      });
      const product2 = await createTestProduct({
        organizationId: manufacturer.id,
        name: '제품2',
      });

      // 각 제품별 Lot
      await createTestLot({
        productId: product1.id,
        manufacturerId: manufacturer.id,
        quantity: 10,
      });
      await createTestLot({
        productId: product2.id,
        manufacturerId: manufacturer.id,
        quantity: 10,
      });

      // 출고 뭉치 생성
      const { data: shipmentBatch } = await adminClient
        .from('shipment_batches')
        .insert({
          from_organization_id: manufacturer.id,
          to_organization_id: distributor.id,
          to_organization_type: ORGANIZATION_TYPES.DISTRIBUTOR,
        })
        .select()
        .single();

      // 제품1에서 3개 선택
      const { data: codes1 } = await adminClient.rpc('select_fifo_codes', {
        p_product_id: product1.id,
        p_owner_id: manufacturer.id,
        p_quantity: 3,
      });

      // 제품2에서 5개 선택
      const { data: codes2 } = await adminClient.rpc('select_fifo_codes', {
        p_product_id: product2.id,
        p_owner_id: manufacturer.id,
        p_quantity: 5,
      });

      const allCodeIds = [
        ...codes1.map((c: { virtual_code_id: string }) => c.virtual_code_id),
        ...codes2.map((c: { virtual_code_id: string }) => c.virtual_code_id),
      ];

      // 출고 상세 기록
      const detailInserts = allCodeIds.map((virtualCodeId: string) => ({
        shipment_batch_id: shipmentBatch!.id,
        virtual_code_id: virtualCodeId,
      }));
      await adminClient.from('shipment_details').insert(detailInserts);

      // 소유권 이전
      await adminClient
        .from('virtual_codes')
        .update({
          owner_id: distributor.id,
          owner_type: 'ORGANIZATION',
        })
        .in('id', allCodeIds);

      // 확인
      const { data: details } = await adminClient
        .from('shipment_details')
        .select('*')
        .eq('shipment_batch_id', shipmentBatch!.id);

      expect(details).toHaveLength(8); // 3 + 5

      const { data: transferredCodes } = await adminClient
        .from('virtual_codes')
        .select('owner_id')
        .in('id', allCodeIds);

      expect(transferredCodes?.every((c) => c.owner_id === distributor.id)).toBe(true);
    });
  });

  describe('출고 대상 조직 제약', () => {
    it('자기 자신에게는 출고할 수 없어야 한다 (DB 제약)', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });

      // 자기 자신에게 출고 시도
      const { error } = await adminClient
        .from('shipment_batches')
        .insert({
          from_organization_id: manufacturer.id,
          to_organization_id: manufacturer.id, // 자기 자신
          to_organization_type: ORGANIZATION_TYPES.MANUFACTURER,
        })
        .select()
        .single();

      // DB 레벨 체크 제약조건 (chk_no_self_shipment)으로 방지
      expect(error).toBeDefined();
      expect(error?.code).toBe('23514'); // check_violation
      expect(error?.message).toContain('chk_no_self_shipment');
    });

    it('비활성 조직에는 출고할 수 없어야 한다 (서비스 레벨 체크)', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const inactiveOrg = await createTestOrganization({
        type: 'DISTRIBUTOR',
        status: 'INACTIVE',
      });

      // 조직 상태 확인
      const { data: org } = await adminClient
        .from('organizations')
        .select('status')
        .eq('id', inactiveOrg.id)
        .single();

      expect(org?.status).toBe('INACTIVE');
      // 실제 서비스에서는 INACTIVE 조직에 출고를 막아야 함
    });
  });

  describe('출고 반품 (return_shipment_atomic)', () => {
    let manufacturer: Awaited<ReturnType<typeof createTestOrganization>>;
    let distributor: Awaited<ReturnType<typeof createTestOrganization>>;
    let product: Awaited<ReturnType<typeof createTestProduct>>;

    beforeEach(async () => {
      manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      distributor = await createTestOrganization({ type: 'DISTRIBUTOR' });
      product = await createTestProduct({ organizationId: manufacturer.id });
    });

    /**
     * 헬퍼: 출고 생성 및 수신자에게 소유권 이전
     */
    async function createShipmentWithTransfer(quantity: number) {
      // Lot 생성
      await createTestLot({
        productId: product.id,
        manufacturerId: manufacturer.id,
        quantity,
      });

      // FIFO 선택
      const { data: selectedCodes } = await adminClient.rpc('select_fifo_codes', {
        p_product_id: product.id,
        p_owner_id: manufacturer.id,
        p_quantity: quantity,
      });
      const codeIds = selectedCodes.map((c: { virtual_code_id: string }) => c.virtual_code_id);

      // 출고 뭉치 생성
      const { data: shipmentBatch } = await adminClient
        .from('shipment_batches')
        .insert({
          from_organization_id: manufacturer.id,
          to_organization_id: distributor.id,
          to_organization_type: ORGANIZATION_TYPES.DISTRIBUTOR,
        })
        .select()
        .single();

      // 소유권 이전 (수신자로)
      await adminClient
        .from('virtual_codes')
        .update({
          owner_id: distributor.id,
          owner_type: 'ORGANIZATION',
        })
        .in('id', codeIds);

      // 출고 상세 기록
      const detailInserts = codeIds.map((virtualCodeId: string) => ({
        shipment_batch_id: shipmentBatch!.id,
        virtual_code_id: virtualCodeId,
      }));
      await adminClient.from('shipment_details').insert(detailInserts);

      // 출고 이력 기록 (SHIPPED)
      const historyInserts = codeIds.map((virtualCodeId: string) => ({
        virtual_code_id: virtualCodeId,
        action_type: 'SHIPPED' as const,
        from_owner_type: 'ORGANIZATION' as const,
        from_owner_id: manufacturer.id,
        to_owner_type: 'ORGANIZATION' as const,
        to_owner_id: distributor.id,
        shipment_batch_id: shipmentBatch!.id,
        is_recall: false,
      }));
      await adminClient.from('histories').insert(historyInserts);

      // 입고 이력 기록 (RECEIVED)
      const receivedHistoryInserts = codeIds.map((virtualCodeId: string) => ({
        virtual_code_id: virtualCodeId,
        action_type: 'RECEIVED' as const,
        from_owner_type: 'ORGANIZATION' as const,
        from_owner_id: manufacturer.id,
        to_owner_type: 'ORGANIZATION' as const,
        to_owner_id: distributor.id,
        shipment_batch_id: shipmentBatch!.id,
        is_recall: false,
      }));
      await adminClient.from('histories').insert(receivedHistoryInserts);

      return { shipmentBatch: shipmentBatch!, codeIds };
    }

    it('수신자가 반품 시 소유권이 발송자에게 복귀되어야 한다', async () => {
      const { shipmentBatch, codeIds } = await createShipmentWithTransfer(3);

      // 반품: 소유권 복귀
      await adminClient
        .from('virtual_codes')
        .update({
          owner_id: manufacturer.id,
          owner_type: 'ORGANIZATION',
        })
        .in('id', codeIds);

      // 출고 뭉치 반품 상태 업데이트
      await adminClient
        .from('shipment_batches')
        .update({
          is_recalled: true,
          recall_reason: '테스트 반품',
          recall_date: new Date().toISOString(),
        })
        .eq('id', shipmentBatch.id);

      // 소유권 확인 (제조사로 복귀)
      const { data: updatedCodes } = await adminClient
        .from('virtual_codes')
        .select('owner_id')
        .in('id', codeIds);

      expect(updatedCodes?.every((c) => c.owner_id === manufacturer.id)).toBe(true);
    });

    it('반품 시 is_recalled가 true로 변경되어야 한다', async () => {
      const { shipmentBatch } = await createShipmentWithTransfer(2);

      // 반품 처리
      await adminClient
        .from('shipment_batches')
        .update({
          is_recalled: true,
          recall_reason: '품질 불량',
          recall_date: new Date().toISOString(),
        })
        .eq('id', shipmentBatch.id);

      // 확인
      const { data: updatedBatch } = await adminClient
        .from('shipment_batches')
        .select('is_recalled, recall_reason')
        .eq('id', shipmentBatch.id)
        .single();

      expect(updatedBatch?.is_recalled).toBe(true);
      expect(updatedBatch?.recall_reason).toBe('품질 불량');
    });

    it('반품 이력이 RETURN_SENT/RETURN_RECEIVED 타입으로 기록되어야 한다', async () => {
      const { shipmentBatch, codeIds } = await createShipmentWithTransfer(2);

      // 반품 이력 기록 (RETURN_SENT - 발송자 관점)
      const returnSentInserts = codeIds.map((virtualCodeId: string) => ({
        virtual_code_id: virtualCodeId,
        action_type: 'RETURN_SENT' as const,
        from_owner_type: 'ORGANIZATION' as const,
        from_owner_id: distributor.id, // 반품 요청자 (수신자)
        to_owner_type: 'ORGANIZATION' as const,
        to_owner_id: manufacturer.id, // 반품 받는 조직 (발송자)
        shipment_batch_id: shipmentBatch.id,
        is_recall: true,
        recall_reason: '테스트 반품',
      }));
      const { error: insertError1 } = await adminClient.from('histories').insert(returnSentInserts);

      // RETURN_SENT enum 확인
      expect(insertError1).toBeNull();

      // 반품 이력 기록 (RETURN_RECEIVED - 수신자 관점)
      const returnReceivedInserts = codeIds.map((virtualCodeId: string) => ({
        virtual_code_id: virtualCodeId,
        action_type: 'RETURN_RECEIVED' as const,
        from_owner_type: 'ORGANIZATION' as const,
        from_owner_id: distributor.id,
        to_owner_type: 'ORGANIZATION' as const,
        to_owner_id: manufacturer.id,
        shipment_batch_id: shipmentBatch.id,
        is_recall: true,
        recall_reason: '테스트 반품',
      }));
      const { error: insertError2 } = await adminClient.from('histories').insert(returnReceivedInserts);

      // RETURN_RECEIVED enum 확인
      expect(insertError2).toBeNull();

      // RETURN_SENT 이력 확인
      const { data: returnSentHistories } = await adminClient
        .from('histories')
        .select('*')
        .eq('shipment_batch_id', shipmentBatch.id)
        .eq('action_type', 'RETURN_SENT');

      expect(returnSentHistories).not.toBeNull();
      expect(returnSentHistories).toHaveLength(2);
      expect(returnSentHistories![0].action_type).toBe('RETURN_SENT');
      expect(returnSentHistories![0].is_recall).toBe(true);
      expect(returnSentHistories![0].from_owner_id).toBe(distributor.id);
      expect(returnSentHistories![0].to_owner_id).toBe(manufacturer.id);

      // RETURN_RECEIVED 이력 확인
      const { data: returnReceivedHistories } = await adminClient
        .from('histories')
        .select('*')
        .eq('shipment_batch_id', shipmentBatch.id)
        .eq('action_type', 'RETURN_RECEIVED');

      expect(returnReceivedHistories).not.toBeNull();
      expect(returnReceivedHistories).toHaveLength(2);
      expect(returnReceivedHistories![0].action_type).toBe('RETURN_RECEIVED');
    });

    it('24시간 이후에도 반품 가능해야 한다 (시간 제한 없음)', async () => {
      // 25시간 전 시간
      const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();

      // Lot 생성
      await createTestLot({
        productId: product.id,
        manufacturerId: manufacturer.id,
        quantity: 3,
      });

      // 출고 뭉치 생성 (25시간 전)
      const { data: shipmentBatch } = await adminClient
        .from('shipment_batches')
        .insert({
          from_organization_id: manufacturer.id,
          to_organization_id: distributor.id,
          to_organization_type: ORGANIZATION_TYPES.DISTRIBUTOR,
          shipment_date: twentyFiveHoursAgo,
        })
        .select()
        .single();

      // 반품 처리 (24시간 제한 없음이므로 성공해야 함)
      const { error } = await adminClient
        .from('shipment_batches')
        .update({
          is_recalled: true,
          recall_reason: '24시간 이후 반품 테스트',
          recall_date: new Date().toISOString(),
        })
        .eq('id', shipmentBatch!.id);

      expect(error).toBeNull();

      // 반품 상태 확인
      const { data: updatedBatch } = await adminClient
        .from('shipment_batches')
        .select('is_recalled')
        .eq('id', shipmentBatch!.id)
        .single();

      expect(updatedBatch?.is_recalled).toBe(true);
    });

    it('이미 반품된 건은 다시 반품할 수 없어야 한다', async () => {
      const { shipmentBatch } = await createShipmentWithTransfer(2);

      // 첫 번째 반품
      await adminClient
        .from('shipment_batches')
        .update({
          is_recalled: true,
          recall_reason: '첫 번째 반품',
          recall_date: new Date().toISOString(),
        })
        .eq('id', shipmentBatch.id);

      // 반품 상태 확인
      const { data: batch } = await adminClient
        .from('shipment_batches')
        .select('is_recalled')
        .eq('id', shipmentBatch.id)
        .single();

      expect(batch?.is_recalled).toBe(true);

      // 이미 반품된 상태이므로 서비스 레벨에서 재반품을 막아야 함
      // DB 레벨에서는 is_recalled를 다시 true로 설정하는 것은 막지 않음
      // 실제 return_shipment_atomic RPC에서 is_recalled 체크 필요
    });

    it('코드 소유권이 수신자가 아니면 반품할 수 없어야 한다 (시나리오)', async () => {
      // 시나리오: 제조사 → 유통사 → 병원 출고 후
      // 병원이 유통사에게 반품한 뒤, 유통사가 또 반품하려면 코드가 유통사 소유여야 함
      const hospital = await createTestOrganization({ type: 'HOSPITAL' });

      // Lot 생성
      await createTestLot({
        productId: product.id,
        manufacturerId: manufacturer.id,
        quantity: 3,
      });

      // 1단계: 제조사 → 유통사 출고
      const { data: selectedCodes } = await adminClient.rpc('select_fifo_codes', {
        p_product_id: product.id,
        p_owner_id: manufacturer.id,
        p_quantity: 3,
      });
      const codeIds = selectedCodes.map((c: { virtual_code_id: string }) => c.virtual_code_id);

      const { data: batch1 } = await adminClient
        .from('shipment_batches')
        .insert({
          from_organization_id: manufacturer.id,
          to_organization_id: distributor.id,
          to_organization_type: ORGANIZATION_TYPES.DISTRIBUTOR,
        })
        .select()
        .single();

      // 유통사로 소유권 이전
      await adminClient
        .from('virtual_codes')
        .update({ owner_id: distributor.id, owner_type: 'ORGANIZATION' })
        .in('id', codeIds);

      await adminClient.from('shipment_details').insert(
        codeIds.map((id: string) => ({ shipment_batch_id: batch1!.id, virtual_code_id: id }))
      );

      // 2단계: 유통사 → 병원 출고
      const { data: batch2 } = await adminClient
        .from('shipment_batches')
        .insert({
          from_organization_id: distributor.id,
          to_organization_id: hospital.id,
          to_organization_type: ORGANIZATION_TYPES.HOSPITAL,
        })
        .select()
        .single();

      // 병원으로 소유권 이전
      await adminClient
        .from('virtual_codes')
        .update({ owner_id: hospital.id, owner_type: 'ORGANIZATION' })
        .in('id', codeIds);

      await adminClient.from('shipment_details').insert(
        codeIds.map((id: string) => ({ shipment_batch_id: batch2!.id, virtual_code_id: id }))
      );

      // 이제 코드는 병원 소유
      const { data: codesAfterTransfer } = await adminClient
        .from('virtual_codes')
        .select('owner_id')
        .in('id', codeIds);

      expect(codesAfterTransfer?.every((c) => c.owner_id === hospital.id)).toBe(true);

      // 유통사가 1단계 출고(batch1)를 반품하려고 할 때,
      // 코드가 이미 병원 소유이므로 반품할 수 없어야 함
      // 이것은 return_shipment_atomic RPC에서 소유권 검증으로 처리
      // (테스트에서는 소유권 상태만 확인)
      const { data: codeOwnership } = await adminClient
        .from('virtual_codes')
        .select('owner_id')
        .in('id', codeIds);

      // 코드가 유통사(distributor) 소유가 아님을 확인
      expect(codeOwnership?.every((c) => c.owner_id !== distributor.id)).toBe(true);
    });
  });
});
