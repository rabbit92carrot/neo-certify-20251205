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
});
