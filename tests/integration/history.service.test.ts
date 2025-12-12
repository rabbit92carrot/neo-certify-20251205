/**
 * History Service 통합 테스트
 *
 * 거래 이력 및 조회 관련 기능을 테스트합니다.
 * 실제 Supabase 로컬 인스턴스를 사용합니다.
 *
 * 참고: 이력 생성 방식
 * - PRODUCED: 가상코드 생성 시 트리거로 자동 생성 (trg_production_history)
 * - SHIPPED/RECEIVED/TREATED: atomic 함수에서 직접 생성 (트리거 비활성화됨)
 * - RECALLED: 서비스 레이어에서 직접 생성
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
  trackTestData,
} from '../helpers';

describe('History Service Integration Tests', () => {
  const adminClient = createTestAdminClient();

  afterEach(async () => {
    await cleanupAllTestData();
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  describe('트리거 기반 자동 이력 생성', () => {
    it('Lot 생성 시 PRODUCED 이력이 트리거로 자동 생성되어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const product = await createTestProduct({ organizationId: manufacturer.id });

      // Lot 생성 (트리거가 PRODUCED 이력 자동 생성)
      const lot = await createTestLot({ productId: product.id, quantity: 5 });
      const codes = await getVirtualCodesByLot(lot.id);

      // 트리거로 생성된 PRODUCED 이력 확인
      const { data: histories } = await adminClient
        .from('histories')
        .select('*')
        .eq('action_type', 'PRODUCED')
        .in(
          'virtual_code_id',
          codes.map((c) => c.id)
        );

      expect(histories).toHaveLength(5);
      expect(histories?.every((h) => h.to_owner_id === manufacturer.id)).toBe(true);
    });

    // 참고: 소유권 변경 트리거가 비활성화되어 있습니다.
    // SHIPPED/RECEIVED 이력은 create_shipment_atomic_bulk 함수에서 직접 생성됩니다.
    it.skip('소유권 변경 시 SHIPPED 이력이 트리거로 자동 생성되어야 한다 (트리거 비활성화됨)', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const distributor = await createTestOrganization({ type: 'DISTRIBUTOR' });

      const product = await createTestProduct({ organizationId: manufacturer.id });
      const lot = await createTestLot({ productId: product.id, quantity: 3 });
      const codes = await getVirtualCodesByLot(lot.id);

      // 소유권 변경 (트리거가 SHIPPED 이력 자동 생성)
      for (const code of codes) {
        await updateVirtualCodeOwner(code.id, 'ORGANIZATION', distributor.id);
      }

      // 트리거로 생성된 SHIPPED 이력 확인
      const { data: histories } = await adminClient
        .from('histories')
        .select('*')
        .eq('action_type', 'SHIPPED')
        .in(
          'virtual_code_id',
          codes.map((c) => c.id)
        );

      expect(histories).toHaveLength(3);
      expect(histories?.every((h) => h.from_owner_id === manufacturer.id)).toBe(true);
      expect(histories?.every((h) => h.to_owner_id === distributor.id)).toBe(true);
    });

    // 참고: 소유권 변경 트리거가 비활성화되어 있습니다.
    // TREATED 이력은 create_treatment_atomic_bulk 함수에서 직접 생성됩니다.
    it.skip('환자에게 소유권 이전 시 TREATED 이력이 트리거로 자동 생성되어야 한다 (트리거 비활성화됨)', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const hospital = await createTestOrganization({ type: 'HOSPITAL' });

      const product = await createTestProduct({ organizationId: manufacturer.id });
      const lot = await createTestLot({ productId: product.id, quantity: 2 });
      const codes = await getVirtualCodesByLot(lot.id);

      // 병원에게 먼저 출고
      for (const code of codes) {
        await updateVirtualCodeOwner(code.id, 'ORGANIZATION', hospital.id);
      }

      // 환자에게 소유권 이전 (TREATED 트리거)
      const patientPhone = `010${Math.floor(10000000 + Math.random() * 90000000)}`;
      for (const code of codes) {
        await updateVirtualCodeOwner(code.id, 'PATIENT', patientPhone, 'USED');
      }

      // 트리거로 생성된 TREATED 이력 확인
      const { data: histories } = await adminClient
        .from('histories')
        .select('*')
        .eq('action_type', 'TREATED')
        .in(
          'virtual_code_id',
          codes.map((c) => c.id)
        );

      expect(histories).toHaveLength(2);
      expect(histories?.every((h) => h.from_owner_id === hospital.id)).toBe(true);
      expect(histories?.every((h) => h.to_owner_id === patientPhone)).toBe(true);
    });
  });

  describe('이력 조회 및 필터링', () => {
    it('조직 ID로 관련된 이력을 조회할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });

      const product = await createTestProduct({ organizationId: manufacturer.id });
      const lot = await createTestLot({ productId: product.id, quantity: 5 });
      const codes = await getVirtualCodesByLot(lot.id);

      // 참고: 소유권 변경 트리거가 비활성화되어 있으므로
      // PRODUCED 이력만 트리거로 자동 생성됩니다.
      // SHIPPED 이력은 atomic 함수를 통해서만 생성됩니다.

      // 제조사 관련 이력: PRODUCED(5)만 존재
      const { data: manufacturerHistories } = await adminClient
        .from('histories')
        .select('*')
        .or(`from_owner_id.eq.${manufacturer.id},to_owner_id.eq.${manufacturer.id}`)
        .in(
          'virtual_code_id',
          codes.map((c) => c.id)
        );

      expect(manufacturerHistories).toHaveLength(5); // PRODUCED 5
    });

    it('액션 타입으로 필터링할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });

      const product = await createTestProduct({ organizationId: manufacturer.id });
      const lot = await createTestLot({ productId: product.id, quantity: 3 });
      const codes = await getVirtualCodesByLot(lot.id);

      // 참고: 소유권 변경 트리거가 비활성화되어 있으므로
      // PRODUCED 이력만 트리거로 자동 생성됩니다.

      // PRODUCED만
      const { data: produced } = await adminClient
        .from('histories')
        .select('*')
        .eq('action_type', 'PRODUCED')
        .in(
          'virtual_code_id',
          codes.map((c) => c.id)
        );

      expect(produced).toHaveLength(3);
    });
  });

  describe('회수 이력 직접 생성', () => {
    it('is_recall=true, recall_reason과 함께 RECALLED 이력을 생성할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const distributor = await createTestOrganization({ type: 'DISTRIBUTOR' });

      const product = await createTestProduct({ organizationId: manufacturer.id });
      const lot = await createTestLot({ productId: product.id, quantity: 3 });
      const codes = await getVirtualCodesByLot(lot.id);

      // 소유권 이전 (출고 완료 상태)
      for (const code of codes) {
        await updateVirtualCodeOwner(code.id, 'ORGANIZATION', distributor.id);
      }

      // 회수 이력 직접 생성 (서비스 레이어에서 수동 생성)
      const recallHistories = codes.map((code) => ({
        virtual_code_id: code.id,
        action_type: 'RECALLED',
        from_owner_type: 'ORGANIZATION',
        from_owner_id: distributor.id,
        to_owner_type: 'ORGANIZATION',
        to_owner_id: manufacturer.id,
        is_recall: true,
        recall_reason: '테스트 회수 사유',
      }));

      const { error } = await adminClient.from('histories').insert(recallHistories);
      expect(error).toBeNull();

      // 회수 이력 조회
      const { data: histories } = await adminClient
        .from('histories')
        .select('*')
        .eq('is_recall', true)
        .eq('action_type', 'RECALLED')
        .in(
          'virtual_code_id',
          codes.map((c) => c.id)
        );

      expect(histories).toHaveLength(3);
      expect(histories?.every((h) => h.recall_reason === '테스트 회수 사유')).toBe(true);
    });

    it('is_recall=true인데 recall_reason 없으면 DB 제약조건 위반이어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const product = await createTestProduct({ organizationId: manufacturer.id });
      const lot = await createTestLot({ productId: product.id, quantity: 1 });
      const codes = await getVirtualCodesByLot(lot.id);

      const { error } = await adminClient.from('histories').insert({
        virtual_code_id: codes[0].id,
        action_type: 'RECALLED',
        from_owner_type: 'ORGANIZATION',
        from_owner_id: manufacturer.id,
        to_owner_type: 'ORGANIZATION',
        to_owner_id: manufacturer.id,
        is_recall: true,
        // recall_reason 생략
      });

      expect(error).toBeDefined();
      expect(error?.code).toBe('23514'); // check_violation
    });
  });

  describe('이력 조인 조회', () => {
    it('가상코드, Lot, 제품 정보와 함께 조회할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });

      const product = await createTestProduct({
        organizationId: manufacturer.id,
        name: 'PDO 실 30G',
      });
      const lot = await createTestLot({
        productId: product.id,
        quantity: 1,
        lotNumber: 'TEST-LOT-001',
      });
      const codes = await getVirtualCodesByLot(lot.id);

      // 트리거로 생성된 PRODUCED 이력을 조인 쿼리로 조회
      const { data: histories, error } = await adminClient
        .from('histories')
        .select(
          `
          *,
          virtual_code:virtual_codes!inner(
            id,
            code,
            lot:lots!inner(
              id,
              lot_number,
              product:products!inner(
                id,
                name
              )
            )
          )
        `
        )
        .eq('virtual_code_id', codes[0].id)
        .eq('action_type', 'PRODUCED')
        .limit(1);

      expect(error).toBeNull();
      expect(histories).toHaveLength(1);

      const history = histories?.[0];
      expect(history?.virtual_code).toBeDefined();

      const virtualCode = history?.virtual_code as {
        id: string;
        code: string;
        lot: {
          id: string;
          lot_number: string;
          product: { id: string; name: string };
        };
      };

      expect(virtualCode.lot.lot_number).toBe('TEST-LOT-001');
      expect(virtualCode.lot.product.name).toBe('PDO 실 30G');
    });
  });

  describe('출고 배치와 연결된 이력', () => {
    it('shipment_batch_id로 출고 배치 이력을 조회할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const distributor = await createTestOrganization({ type: 'DISTRIBUTOR' });

      const product = await createTestProduct({ organizationId: manufacturer.id });
      const lot = await createTestLot({ productId: product.id, quantity: 5 });
      const codes = await getVirtualCodesByLot(lot.id);

      // 출고 배치 생성
      const { data: batch } = await adminClient
        .from('shipment_batches')
        .insert({
          from_organization_id: manufacturer.id,
          to_organization_type: 'DISTRIBUTOR',
          to_organization_id: distributor.id,
        })
        .select()
        .single();

      trackTestData('shipmentBatches', batch!.id);

      // 출고 이력 생성 (배치 ID 연결)
      const historiesData = codes.map((code) => ({
        virtual_code_id: code.id,
        action_type: 'SHIPPED',
        from_owner_type: 'ORGANIZATION',
        from_owner_id: manufacturer.id,
        to_owner_type: 'ORGANIZATION',
        to_owner_id: distributor.id,
        shipment_batch_id: batch!.id,
      }));

      await adminClient.from('histories').insert(historiesData);

      // 배치 ID로 이력 조회
      const { data: batchHistories } = await adminClient
        .from('histories')
        .select('*')
        .eq('shipment_batch_id', batch!.id);

      expect(batchHistories).toHaveLength(5);
      expect(batchHistories?.every((h) => h.shipment_batch_id === batch!.id)).toBe(true);
    });
  });
});
