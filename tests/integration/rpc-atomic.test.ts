/**
 * 원자적 RPC 함수 직접 테스트
 *
 * 핵심 비즈니스 로직을 담은 RPC 함수들을 직접 호출하여 테스트합니다.
 * - create_shipment_atomic: 출고 생성
 * - return_shipment_atomic: 출고 반품 (수신자 주도)
 * - create_treatment_atomic: 시술 등록
 * - create_disposal_atomic: 폐기 등록
 *
 * 테스트 계정 (TEST_GUIDE.md 참조):
 * - 제조사: manufacturer@neocert.com / test123 / a0000000-0000-0000-0000-000000000002
 * - 유통사: distributor@neocert.com / test123 / a0000000-0000-0000-0000-000000000003
 * - 병원: hospital@neocert.com / test123 / a0000000-0000-0000-0000-000000000004
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createAuthenticatedTestClient,
  createTestAdminClient,
  createTestProduct,
  createTestLot,
  cleanupAllTestData,
} from '../helpers';
import type { Database } from '@/types/database.types';

// 테스트 계정 정보 (TEST_GUIDE.md)
const TEST_ACCOUNTS = {
  manufacturer: {
    email: 'manufacturer@neocert.com',
    password: 'test123',
    orgId: 'a0000000-0000-0000-0000-000000000002',
  },
  distributor: {
    email: 'distributor@neocert.com',
    password: 'test123',
    orgId: 'a0000000-0000-0000-0000-000000000003',
  },
  hospital: {
    email: 'hospital@neocert.com',
    password: 'test123',
    orgId: 'a0000000-0000-0000-0000-000000000004',
  },
  distributor2: {
    email: 'distributor2@neocert.com',
    password: 'test123',
    orgId: 'a0000000-0000-0000-0000-000000000005',
  },
};

describe('원자적 RPC 함수 직접 테스트', () => {
  const adminClient = createTestAdminClient();
  let manufacturerClient: SupabaseClient<Database>;
  let distributorClient: SupabaseClient<Database>;
  let hospitalClient: SupabaseClient<Database>;

  // 테스트 데이터 추적
  let testProductId: string;
  let testLotId: string;

  beforeAll(async () => {
    // 역할별 인증 클라이언트 생성
    manufacturerClient = await createAuthenticatedTestClient(
      TEST_ACCOUNTS.manufacturer.email,
      TEST_ACCOUNTS.manufacturer.password
    );
    distributorClient = await createAuthenticatedTestClient(
      TEST_ACCOUNTS.distributor.email,
      TEST_ACCOUNTS.distributor.password
    );
    hospitalClient = await createAuthenticatedTestClient(
      TEST_ACCOUNTS.hospital.email,
      TEST_ACCOUNTS.hospital.password
    );

    // 테스트 제품 생성 (제조사 소유)
    const product = await createTestProduct({
      organizationId: TEST_ACCOUNTS.manufacturer.orgId,
      name: 'RPC테스트제품',
    });
    testProductId = product.id;

    // 테스트 Lot 생성 (가상코드 10개 자동 생성됨)
    const lot = await createTestLot({
      productId: testProductId,
      quantity: 10,
    });
    testLotId = lot.id;
  });

  afterEach(async () => {
    // 테스트 후 상태 정리는 cleanupAllTestData에서 처리
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  // ============================================================================
  // create_shipment_atomic 테스트
  // ============================================================================
  describe('create_shipment_atomic RPC', () => {
    it('정상 출고 시 배치 ID와 수량을 반환해야 한다', async () => {
      // 새 Lot 생성하여 테스트
      const lot = await createTestLot({
        productId: testProductId,
        quantity: 5,
      });

      // 제조사 클라이언트로 3-param 버전 호출 (SECURITY DEFINER)
      const { data, error } = await manufacturerClient.rpc('create_shipment_atomic', {
        p_to_org_id: TEST_ACCOUNTS.distributor.orgId,
        p_to_org_type: 'DISTRIBUTOR',
        p_items: [{ productId: testProductId, quantity: 3 }],
      });

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].shipment_batch_id).not.toBeNull();
      expect(data![0].total_quantity).toBe(3);
      expect(data![0].error_code).toBeNull();
    });

    it('자기 자신에게 출고 시 SELF_SHIPMENT 에러를 반환해야 한다', async () => {
      const { data, error } = await manufacturerClient.rpc('create_shipment_atomic', {
        p_to_org_id: TEST_ACCOUNTS.manufacturer.orgId,
        p_to_org_type: 'MANUFACTURER',
        p_items: [{ productId: testProductId, quantity: 1 }],
      });

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].error_code).toBe('SELF_SHIPMENT');
      expect(data![0].shipment_batch_id).toBeNull();
    });

    it('존재하지 않는 조직에 출고 시 ORGANIZATION_NOT_FOUND 에러를 반환해야 한다', async () => {
      const fakeOrgId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

      const { data, error } = await manufacturerClient.rpc('create_shipment_atomic', {
        p_to_org_id: fakeOrgId,
        p_to_org_type: 'DISTRIBUTOR',
        p_items: [{ productId: testProductId, quantity: 1 }],
      });

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].error_code).toBe('ORGANIZATION_NOT_FOUND');
    });

    it('재고 부족 시 INSUFFICIENT_STOCK 에러를 반환해야 한다', async () => {
      // 테스트 격리: 이 테스트만의 고유 제품 생성
      const isolatedProduct = await createTestProduct({
        organizationId: TEST_ACCOUNTS.manufacturer.orgId,
        name: '재고부족테스트제품_' + Date.now(),
      });

      // 새 Lot (2개만)
      await createTestLot({
        productId: isolatedProduct.id,
        quantity: 2,
      });

      // 10개 요청 (2개만 있음)
      const { data, error } = await manufacturerClient.rpc('create_shipment_atomic', {
        p_to_org_id: TEST_ACCOUNTS.distributor.orgId,
        p_to_org_type: 'DISTRIBUTOR',
        p_items: [{ productId: isolatedProduct.id, quantity: 10 }],
      });

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].error_code).toBe('INSUFFICIENT_STOCK');
    });

    it('출고 시 SHIPPED 이력이 기록되어야 한다', async () => {
      // 새 Lot
      await createTestLot({
        productId: testProductId,
        quantity: 3,
      });

      // 출고
      const { data } = await manufacturerClient.rpc('create_shipment_atomic', {
        p_to_org_id: TEST_ACCOUNTS.distributor.orgId,
        p_to_org_type: 'DISTRIBUTOR',
        p_items: [{ productId: testProductId, quantity: 2 }],
      });

      const batchId = data![0].shipment_batch_id;

      // 이력 확인
      const { data: histories } = await adminClient
        .from('histories')
        .select('*')
        .eq('shipment_batch_id', batchId)
        .eq('action_type', 'SHIPPED');

      expect(histories).toHaveLength(2); // 2개 코드
      expect(histories![0].from_owner_id).toBe(TEST_ACCOUNTS.manufacturer.orgId);
      expect(histories![0].to_owner_id).toBe(TEST_ACCOUNTS.distributor.orgId);
    });

    it('출고 시 RECEIVED 이력도 함께 기록되어야 한다', async () => {
      // 새 Lot
      await createTestLot({
        productId: testProductId,
        quantity: 3,
      });

      // 출고
      const { data } = await manufacturerClient.rpc('create_shipment_atomic', {
        p_to_org_id: TEST_ACCOUNTS.distributor.orgId,
        p_to_org_type: 'DISTRIBUTOR',
        p_items: [{ productId: testProductId, quantity: 2 }],
      });

      const batchId = data![0].shipment_batch_id;

      // RECEIVED 이력 확인
      const { data: histories } = await adminClient
        .from('histories')
        .select('*')
        .eq('shipment_batch_id', batchId)
        .eq('action_type', 'RECEIVED');

      expect(histories).toHaveLength(2);
    });

    it('FIFO 순서로 코드가 선택되어야 한다', async () => {
      // 테스트 격리: 고유 제품 생성
      const fifoProduct = await createTestProduct({
        organizationId: TEST_ACCOUNTS.manufacturer.orgId,
        name: 'FIFO테스트제품_' + Date.now(),
      });

      // 1. 오래된 Lot 생성 (manufacture_date = 2025-01-01)
      const oldLot = await createTestLot({
        productId: fifoProduct.id,
        quantity: 3,
        manufactureDate: '2025-01-01',
      });

      // 2. 최신 Lot 생성 (manufacture_date = 2026-01-05)
      const newLot = await createTestLot({
        productId: fifoProduct.id,
        quantity: 3,
        manufactureDate: '2026-01-05',
      });

      // 3. 출고 실행 (3개) - 오래된 Lot에서 먼저 선택되어야 함
      const { data } = await manufacturerClient.rpc('create_shipment_atomic', {
        p_to_org_id: TEST_ACCOUNTS.distributor.orgId,
        p_to_org_type: 'DISTRIBUTOR',
        p_items: [{ productId: fifoProduct.id, quantity: 3 }],
      });

      expect(data![0].error_code).toBeNull();
      const batchId = data![0].shipment_batch_id!;

      // 4. 출고된 코드가 오래된 Lot에서 선택되었는지 확인
      const { data: details } = await adminClient
        .from('shipment_details')
        .select('virtual_code_id')
        .eq('shipment_batch_id', batchId);

      expect(details).toHaveLength(3);

      // 출고된 코드들의 lot_id 조회
      const codeIds = details!.map((d) => d.virtual_code_id);
      const { data: codes } = await adminClient
        .from('virtual_codes')
        .select('lot_id')
        .in('id', codeIds);

      // 모든 코드가 오래된 Lot에서 왔는지 확인
      codes!.forEach((code) => {
        expect(code.lot_id).toBe(oldLot.id);
      });

      // 새 Lot의 코드는 사용되지 않았는지 확인
      const { data: newLotCodes } = await adminClient
        .from('virtual_codes')
        .select('status')
        .eq('lot_id', newLot.id);

      newLotCodes!.forEach((code) => {
        expect(code.status).toBe('IN_STOCK'); // 아직 재고 상태
      });
    });
  });

  // ============================================================================
  // return_shipment_atomic 테스트
  // ============================================================================
  describe('return_shipment_atomic RPC', () => {
    let shipmentBatchId: string;

    // 반품 테스트를 위해 먼저 출고 생성
    beforeAll(async () => {
      // 새 Lot 생성
      await createTestLot({
        productId: testProductId,
        quantity: 5,
      });

      // 제조사 → 유통사 출고
      const { data } = await manufacturerClient.rpc('create_shipment_atomic', {
        p_to_org_id: TEST_ACCOUNTS.distributor.orgId,
        p_to_org_type: 'DISTRIBUTOR',
        p_items: [{ productId: testProductId, quantity: 3 }],
      });

      shipmentBatchId = data![0].shipment_batch_id!;
    });

    it('수신자가 반품 요청 시 성공해야 한다', async () => {
      // 유통사(수신자)가 반품 요청
      const { data, error } = await distributorClient.rpc('return_shipment_atomic', {
        p_shipment_batch_id: shipmentBatchId,
        p_reason: '품질 불량',
        p_product_quantities: null, // 전량 반품
      });

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].success).toBe(true);
      expect(data![0].returned_count).toBe(3);
      expect(data![0].error_code).toBeNull();
      expect(data![0].new_batch_id).not.toBeNull(); // 새 배치 생성 확인
    });

    it('발송자가 반품 시도 시 CODES_NOT_OWNED 에러를 반환해야 한다', async () => {
      // 새 출고 생성
      await createTestLot({
        productId: testProductId,
        quantity: 3,
      });

      const { data: shipmentData } = await manufacturerClient.rpc('create_shipment_atomic', {
        p_to_org_id: TEST_ACCOUNTS.distributor.orgId,
        p_to_org_type: 'DISTRIBUTOR',
        p_items: [{ productId: testProductId, quantity: 2 }],
      });

      const newBatchId = shipmentData![0].shipment_batch_id!;

      // 제조사(발송자)가 반품 시도 - 소유권이 없으므로 실패해야 함
      const { data, error } = await manufacturerClient.rpc('return_shipment_atomic', {
        p_shipment_batch_id: newBatchId,
        p_reason: '잘못 보냄',
        p_product_quantities: null,
      });

      expect(error).toBeNull();
      expect(data![0].success).toBe(false);
      expect(data![0].error_code).toBe('CODES_NOT_OWNED');
    });

    it('동일 배치로 두 번 반품 시도 시 두 번째는 CODES_NOT_OWNED 에러를 반환해야 한다', async () => {
      // 새 출고 생성 (테스트 격리)
      await createTestLot({
        productId: testProductId,
        quantity: 3,
      });

      const { data: shipmentData } = await manufacturerClient.rpc('create_shipment_atomic', {
        p_to_org_id: TEST_ACCOUNTS.distributor.orgId,
        p_to_org_type: 'DISTRIBUTOR',
        p_items: [{ productId: testProductId, quantity: 2 }],
      });

      const testBatchId = shipmentData![0].shipment_batch_id!;

      // 첫 번째 반품 (성공해야 함)
      const { data: firstReturn } = await distributorClient.rpc('return_shipment_atomic', {
        p_shipment_batch_id: testBatchId,
        p_reason: '첫 번째 반품',
        p_product_quantities: null,
      });
      expect(firstReturn![0].success).toBe(true);

      // 두 번째 반품 시도 (CODES_NOT_OWNED 에러)
      const { data: secondReturn, error } = await distributorClient.rpc('return_shipment_atomic', {
        p_shipment_batch_id: testBatchId,
        p_reason: '두 번째 반품 시도',
        p_product_quantities: null,
      });

      expect(error).toBeNull();
      expect(secondReturn![0].success).toBe(false);
      expect(secondReturn![0].error_code).toBe('CODES_NOT_OWNED');
    });

    it('반품 시 RETURNED 이력이 기록되어야 한다', async () => {
      // 새 출고 생성 후 반품
      await createTestLot({
        productId: testProductId,
        quantity: 3,
      });

      const { data: shipmentData } = await manufacturerClient.rpc('create_shipment_atomic', {
        p_to_org_id: TEST_ACCOUNTS.distributor.orgId,
        p_to_org_type: 'DISTRIBUTOR',
        p_items: [{ productId: testProductId, quantity: 2 }],
      });

      const batchId = shipmentData![0].shipment_batch_id!;

      // 반품 실행 (새 배치 ID 반환됨)
      const { data: returnData } = await distributorClient.rpc('return_shipment_atomic', {
        p_shipment_batch_id: batchId,
        p_reason: '테스트 반품',
        p_product_quantities: null,
      });

      const newBatchId = returnData![0].new_batch_id!;
      expect(newBatchId).not.toBeNull();

      // RETURNED 이력 확인 (새 배치 ID로 조회)
      const { data: histories } = await adminClient
        .from('histories')
        .select('*')
        .eq('shipment_batch_id', newBatchId)
        .eq('action_type', 'RETURNED');

      expect(histories).toHaveLength(2);
      expect(histories![0].is_recall).toBe(true);
      expect(histories![0].recall_reason).toBe('테스트 반품');
      expect(histories![0].from_owner_id).toBe(TEST_ACCOUNTS.distributor.orgId); // 반품 요청자
      expect(histories![0].to_owner_id).toBe(TEST_ACCOUNTS.manufacturer.orgId); // 반품 받는 조직
    });

    it('반품 시 소유권이 발송자에게 복귀되어야 한다', async () => {
      // 새 출고 생성 후 반품
      await createTestLot({
        productId: testProductId,
        quantity: 3,
      });

      const { data: shipmentData } = await manufacturerClient.rpc('create_shipment_atomic', {
        p_to_org_id: TEST_ACCOUNTS.distributor.orgId,
        p_to_org_type: 'DISTRIBUTOR',
        p_items: [{ productId: testProductId, quantity: 2 }],
      });

      const batchId = shipmentData![0].shipment_batch_id!;

      // 출고된 코드 조회
      const { data: shipmentDetails } = await adminClient
        .from('shipment_details')
        .select('virtual_code_id')
        .eq('shipment_batch_id', batchId);

      const codeIds = shipmentDetails!.map((d) => d.virtual_code_id);

      // 반품 전: 유통사 소유 확인
      const { data: beforeCodes } = await adminClient
        .from('virtual_codes')
        .select('owner_id')
        .in('id', codeIds);

      expect(beforeCodes!.every((c) => c.owner_id === TEST_ACCOUNTS.distributor.orgId)).toBe(true);

      // 반품 실행
      await distributorClient.rpc('return_shipment_atomic', {
        p_shipment_batch_id: batchId,
        p_reason: '소유권 복귀 테스트',
        p_product_quantities: null,
      });

      // 반품 후: 제조사 소유 확인
      const { data: afterCodes } = await adminClient
        .from('virtual_codes')
        .select('owner_id')
        .in('id', codeIds);

      expect(afterCodes!.every((c) => c.owner_id === TEST_ACCOUNTS.manufacturer.orgId)).toBe(true);
    });

    it('24시간 이후에도 반품 가능해야 한다 (시간 제한 없음)', async () => {
      // 새 출고 생성
      await createTestLot({
        productId: testProductId,
        quantity: 3,
      });

      const { data: shipmentData } = await manufacturerClient.rpc('create_shipment_atomic', {
        p_to_org_id: TEST_ACCOUNTS.distributor.orgId,
        p_to_org_type: 'DISTRIBUTOR',
        p_items: [{ productId: testProductId, quantity: 2 }],
      });

      const batchId = shipmentData![0].shipment_batch_id!;

      // 출고 시간을 48시간 전으로 변경 (adminClient 사용)
      await adminClient
        .from('shipment_batches')
        .update({
          shipment_date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', batchId);

      // 반품 시도 - 성공해야 함 (시간 제한 없음)
      const { data, error } = await distributorClient.rpc('return_shipment_atomic', {
        p_shipment_batch_id: batchId,
        p_reason: '48시간 후 반품',
        p_product_quantities: null,
      });

      expect(error).toBeNull();
      expect(data![0].success).toBe(true);
    });

    it('존재하지 않는 배치 ID로 반품 시 BATCH_NOT_FOUND 에러를 반환해야 한다', async () => {
      const fakeBatchId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

      const { data, error } = await distributorClient.rpc('return_shipment_atomic', {
        p_shipment_batch_id: fakeBatchId,
        p_reason: '테스트 반품',
        p_product_quantities: null,
      });

      expect(error).toBeNull();
      expect(data![0].success).toBe(false);
      expect(data![0].error_code).toBe('BATCH_NOT_FOUND');
    });
  });

  // ============================================================================
  // 재반품 체인 및 부분 반품 테스트
  // ============================================================================
  describe('재반품 체인 및 부분 반품 테스트', () => {
    it('A→B→C 체인 후 C→B→A 재반품이 성공해야 한다', async () => {
      // 테스트 격리: 고유 제품 생성
      const chainProduct = await createTestProduct({
        organizationId: TEST_ACCOUNTS.manufacturer.orgId,
        name: '재반품체인테스트_' + Date.now(),
      });

      // Lot 생성 (5개만 - 단순화)
      const chainLot = await createTestLot({
        productId: chainProduct.id,
        quantity: 5,
      });

      // 1. 제조사(A) → 유통사(B) 출고 (5개)
      const { data: shipment1 } = await manufacturerClient.rpc('create_shipment_atomic', {
        p_to_org_id: TEST_ACCOUNTS.distributor.orgId,
        p_to_org_type: 'DISTRIBUTOR',
        p_items: [{ productId: chainProduct.id, quantity: 5 }],
      });
      expect(shipment1![0].error_code).toBeNull();

      // 중간 확인: 유통사가 5개 소유
      const { count: distCount1 } = await adminClient
        .from('virtual_codes')
        .select('*', { count: 'exact', head: true })
        .eq('lot_id', chainLot.id)
        .eq('owner_id', TEST_ACCOUNTS.distributor.orgId);
      expect(distCount1).toBe(5);

      // 2. 유통사(B) → 병원(C) 출고 (5개)
      const { data: shipment2 } = await distributorClient.rpc('create_shipment_atomic', {
        p_to_org_id: TEST_ACCOUNTS.hospital.orgId,
        p_to_org_type: 'HOSPITAL',
        p_items: [{ productId: chainProduct.id, quantity: 5 }],
      });
      expect(shipment2![0].error_code).toBeNull();
      const batchBC = shipment2![0].shipment_batch_id!;

      // 중간 확인: 병원이 5개 소유
      const { count: hospitalCount } = await adminClient
        .from('virtual_codes')
        .select('*', { count: 'exact', head: true })
        .eq('lot_id', chainLot.id)
        .eq('owner_id', TEST_ACCOUNTS.hospital.orgId);
      expect(hospitalCount).toBe(5);

      // 3. 병원(C) → 유통사(B) 반품 (전량)
      const { data: return1 } = await hospitalClient.rpc('return_shipment_atomic', {
        p_shipment_batch_id: batchBC,
        p_reason: '품질 불량',
        p_product_quantities: null, // 전량 반품
      });
      expect(return1![0].success).toBe(true);
      expect(return1![0].returned_count).toBe(5);
      const batchCB = return1![0].new_batch_id!; // 새로 생성된 반품 배치

      // 반품 배치가 생성되었는지 확인
      expect(batchCB).not.toBeNull();
      expect(batchCB).not.toBe(batchBC);

      // 중간 확인: 유통사가 5개 소유
      const { count: distCount2 } = await adminClient
        .from('virtual_codes')
        .select('*', { count: 'exact', head: true })
        .eq('lot_id', chainLot.id)
        .eq('owner_id', TEST_ACCOUNTS.distributor.orgId);
      expect(distCount2).toBe(5);

      // 4. 유통사(B) → 제조사(A) 재반품 (반품 배치 사용)
      const { data: return2 } = await distributorClient.rpc('return_shipment_atomic', {
        p_shipment_batch_id: batchCB, // 반품 받은 배치로 재반품
        p_reason: '상위 반품',
        p_product_quantities: null,
      });
      expect(return2![0].success).toBe(true);
      expect(return2![0].returned_count).toBe(5);

      // 5. 최종 소유권 확인: 제조사가 모든 5개를 소유
      const { count: finalManufacturerCount } = await adminClient
        .from('virtual_codes')
        .select('*', { count: 'exact', head: true })
        .eq('lot_id', chainLot.id)
        .eq('owner_id', TEST_ACCOUNTS.manufacturer.orgId);

      expect(finalManufacturerCount).toBe(5);
    });

    it('부분 반품 시 지정된 수량만 반품되어야 한다', async () => {
      // 테스트 격리: 고유 제품 생성
      const partialProduct = await createTestProduct({
        organizationId: TEST_ACCOUNTS.manufacturer.orgId,
        name: '부분반품테스트_' + Date.now(),
      });

      // Lot 생성 (10개)
      await createTestLot({
        productId: partialProduct.id,
        quantity: 10,
      });

      // 제조사 → 유통사 출고 (5개)
      const { data: shipmentData } = await manufacturerClient.rpc('create_shipment_atomic', {
        p_to_org_id: TEST_ACCOUNTS.distributor.orgId,
        p_to_org_type: 'DISTRIBUTOR',
        p_items: [{ productId: partialProduct.id, quantity: 5 }],
      });
      const batchId = shipmentData![0].shipment_batch_id!;

      // 부분 반품 (2개만)
      const { data: returnResult } = await distributorClient.rpc('return_shipment_atomic', {
        p_shipment_batch_id: batchId,
        p_reason: '부분 반품 테스트',
        p_product_quantities: [{ productId: partialProduct.id, quantity: 2 }],
      });

      expect(returnResult![0].success).toBe(true);
      expect(returnResult![0].returned_count).toBe(2);
      expect(returnResult![0].new_batch_id).not.toBeNull();

      // 유통사에 3개 남아있는지 확인
      const { count: distributorCount } = await adminClient
        .from('virtual_codes')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', TEST_ACCOUNTS.distributor.orgId)
        .in('lot_id', (await adminClient.from('lots').select('id').eq('product_id', partialProduct.id)).data!.map((l) => l.id));

      expect(distributorCount).toBe(3);

      // 제조사에 7개 있는지 확인 (원래 5개 + 반품 2개 - 5개 + 5개 = 7개)
      // 실제로는: 원래 10개 중 5개 출고 → 제조사 5개, 유통사 5개 → 유통사가 2개 반품 → 제조사 7개, 유통사 3개
      const { count: manufacturerCount } = await adminClient
        .from('virtual_codes')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', TEST_ACCOUNTS.manufacturer.orgId)
        .in('lot_id', (await adminClient.from('lots').select('id').eq('product_id', partialProduct.id)).data!.map((l) => l.id));

      expect(manufacturerCount).toBe(7); // 5개(원래 남은 것) + 2개(반품)
    });

    it('부분 반품 시 FIFO 순서로 코드가 선택되어야 한다', async () => {
      // 테스트 격리: 고유 제품 생성
      const fifoReturnProduct = await createTestProduct({
        organizationId: TEST_ACCOUNTS.manufacturer.orgId,
        name: 'FIFO반품테스트_' + Date.now(),
      });

      // 1. 오래된 Lot 생성 (manufacture_date = 2025-01-01)
      const oldLot = await createTestLot({
        productId: fifoReturnProduct.id,
        quantity: 3,
        manufactureDate: '2025-01-01',
      });

      // 2. 최신 Lot 생성 (manufacture_date = 2026-01-05)
      const newLot = await createTestLot({
        productId: fifoReturnProduct.id,
        quantity: 3,
        manufactureDate: '2026-01-05',
      });

      // 출고 (6개 전체) - FIFO로 오래된 것부터 출고됨
      const { data: shipmentData } = await manufacturerClient.rpc('create_shipment_atomic', {
        p_to_org_id: TEST_ACCOUNTS.distributor.orgId,
        p_to_org_type: 'DISTRIBUTOR',
        p_items: [{ productId: fifoReturnProduct.id, quantity: 6 }],
      });
      const batchId = shipmentData![0].shipment_batch_id!;

      // 부분 반품 (2개만) - FIFO로 오래된 Lot의 코드가 선택되어야 함
      const { data: returnResult } = await distributorClient.rpc('return_shipment_atomic', {
        p_shipment_batch_id: batchId,
        p_reason: 'FIFO 부분 반품 테스트',
        p_product_quantities: [{ productId: fifoReturnProduct.id, quantity: 2 }],
      });

      expect(returnResult![0].success).toBe(true);
      expect(returnResult![0].returned_count).toBe(2);

      // 반품된 코드가 오래된 Lot에서 선택되었는지 확인
      const returnBatchId = returnResult![0].new_batch_id!;
      const { data: details } = await adminClient
        .from('shipment_details')
        .select('virtual_code_id')
        .eq('shipment_batch_id', returnBatchId);

      const codeIds = details!.map((d) => d.virtual_code_id);
      const { data: codes } = await adminClient
        .from('virtual_codes')
        .select('lot_id')
        .in('id', codeIds);

      // 반품된 코드가 오래된 Lot에서 선택되어야 함
      codes!.forEach((code) => {
        expect(code.lot_id).toBe(oldLot.id);
      });
    });

    it('반품 시 새 배치가 생성되어야 한다', async () => {
      // 새 Lot 생성
      await createTestLot({
        productId: testProductId,
        quantity: 3,
      });

      // 출고
      const { data: shipmentData } = await manufacturerClient.rpc('create_shipment_atomic', {
        p_to_org_id: TEST_ACCOUNTS.distributor.orgId,
        p_to_org_type: 'DISTRIBUTOR',
        p_items: [{ productId: testProductId, quantity: 2 }],
      });
      const originalBatchId = shipmentData![0].shipment_batch_id!;

      // 반품
      const { data: returnData } = await distributorClient.rpc('return_shipment_atomic', {
        p_shipment_batch_id: originalBatchId,
        p_reason: '새 배치 생성 테스트',
        p_product_quantities: null,
      });

      expect(returnData![0].success).toBe(true);
      expect(returnData![0].new_batch_id).not.toBeNull();
      expect(returnData![0].new_batch_id).not.toBe(originalBatchId);

      // 새 배치가 반품 배치로 표시되어 있는지 확인
      const { data: newBatch } = await adminClient
        .from('shipment_batches')
        .select('is_return_batch, parent_batch_id')
        .eq('id', returnData![0].new_batch_id!)
        .single();

      expect(newBatch!.is_return_batch).toBe(true);
      expect(newBatch!.parent_batch_id).toBe(originalBatchId);
    });

    it('빈 배열 전달 시 전량 반품으로 처리해야 한다', async () => {
      // 테스트 격리: 고유 제품 생성
      const emptyArrayProduct = await createTestProduct({
        organizationId: TEST_ACCOUNTS.manufacturer.orgId,
        name: '빈배열반품테스트_' + Date.now(),
      });

      // Lot 생성 (5개)
      const emptyArrayLot = await createTestLot({
        productId: emptyArrayProduct.id,
        quantity: 5,
      });

      // 제조사 → 유통사 출고 (3개)
      const { data: shipmentData } = await manufacturerClient.rpc('create_shipment_atomic', {
        p_to_org_id: TEST_ACCOUNTS.distributor.orgId,
        p_to_org_type: 'DISTRIBUTOR',
        p_items: [{ productId: emptyArrayProduct.id, quantity: 3 }],
      });
      const batchId = shipmentData![0].shipment_batch_id!;

      // 빈 배열로 반품 요청 - 전량 반품으로 처리되어야 함
      const { data: returnResult, error } = await distributorClient.rpc('return_shipment_atomic', {
        p_shipment_batch_id: batchId,
        p_reason: '빈 배열 테스트',
        p_product_quantities: '[]', // 빈 배열 (JSON 문자열)
      });

      expect(error).toBeNull();
      expect(returnResult![0].success).toBe(true);
      expect(returnResult![0].returned_count).toBe(3); // 전량 반품
      expect(returnResult![0].new_batch_id).not.toBeNull();

      // 제조사가 모든 5개를 다시 소유하는지 확인 (원래 2개 + 반품 3개)
      const { count: manufacturerCount } = await adminClient
        .from('virtual_codes')
        .select('*', { count: 'exact', head: true })
        .eq('lot_id', emptyArrayLot.id)
        .eq('owner_id', TEST_ACCOUNTS.manufacturer.orgId);

      expect(manufacturerCount).toBe(5); // 전량 복귀
    });

    it('스칼라 JSONB 값 전달 시 전량 반품으로 처리해야 한다', async () => {
      // 테스트 격리: 고유 제품 생성
      const scalarProduct = await createTestProduct({
        organizationId: TEST_ACCOUNTS.manufacturer.orgId,
        name: '스칼라반품테스트_' + Date.now(),
      });

      // Lot 생성 (4개)
      const scalarLot = await createTestLot({
        productId: scalarProduct.id,
        quantity: 4,
      });

      // 제조사 → 유통사 출고 (3개)
      const { data: shipmentData } = await manufacturerClient.rpc('create_shipment_atomic', {
        p_to_org_id: TEST_ACCOUNTS.distributor.orgId,
        p_to_org_type: 'DISTRIBUTOR',
        p_items: [{ productId: scalarProduct.id, quantity: 3 }],
      });
      const batchId = shipmentData![0].shipment_batch_id!;

      // 스칼라 값으로 반품 요청 - 전량 반품으로 처리되어야 함
      // (배열이 아닌 값은 jsonb_typeof로 감지되어 NULL로 정규화됨)
      const { data: returnResult, error } = await distributorClient.rpc('return_shipment_atomic', {
        p_shipment_batch_id: batchId,
        p_reason: '스칼라 값 테스트',
        p_product_quantities: '"invalid"', // 스칼라 문자열 (JSON 문자열)
      });

      expect(error).toBeNull();
      expect(returnResult![0].success).toBe(true);
      expect(returnResult![0].returned_count).toBe(3); // 전량 반품
      expect(returnResult![0].new_batch_id).not.toBeNull();

      // 제조사가 모든 4개를 다시 소유하는지 확인 (원래 1개 + 반품 3개)
      const { count: manufacturerCount } = await adminClient
        .from('virtual_codes')
        .select('*', { count: 'exact', head: true })
        .eq('lot_id', scalarLot.id)
        .eq('owner_id', TEST_ACCOUNTS.manufacturer.orgId);

      expect(manufacturerCount).toBe(4); // 전량 복귀
    });
  });

  // ============================================================================
  // create_treatment_atomic 테스트
  // ============================================================================
  describe('create_treatment_atomic RPC', () => {
    // 병원에 재고 준비
    beforeAll(async () => {
      // 새 Lot 생성
      await createTestLot({
        productId: testProductId,
        quantity: 10,
      });

      // 제조사 → 유통사 출고
      await manufacturerClient.rpc('create_shipment_atomic', {
        p_to_org_id: TEST_ACCOUNTS.distributor.orgId,
        p_to_org_type: 'DISTRIBUTOR',
        p_items: [{ productId: testProductId, quantity: 8 }],
      });

      // 유통사 → 병원 출고
      await distributorClient.rpc('create_shipment_atomic', {
        p_to_org_id: TEST_ACCOUNTS.hospital.orgId,
        p_to_org_type: 'HOSPITAL',
        p_items: [{ productId: testProductId, quantity: 6 }],
      });
    });

    it('병원이 시술 등록 시 성공해야 한다', async () => {
      const { data, error } = await hospitalClient.rpc('create_treatment_atomic', {
        p_patient_phone: '01012345678',
        p_treatment_date: new Date().toISOString().split('T')[0],
        p_items: [{ productId: testProductId, quantity: 2 }],
      });

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].treatment_id).not.toBeNull();
      expect(data![0].total_quantity).toBe(2);
      expect(data![0].error_code).toBeNull();
    });

    it('병원이 아닌 조직이 시술 등록 시 FORBIDDEN 에러를 반환해야 한다', async () => {
      // 유통사가 시술 시도
      const { data, error } = await distributorClient.rpc('create_treatment_atomic', {
        p_patient_phone: '01012345679',
        p_treatment_date: new Date().toISOString().split('T')[0],
        p_items: [{ productId: testProductId, quantity: 1 }],
      });

      expect(error).toBeNull();
      expect(data![0].error_code).toBe('FORBIDDEN');
      expect(data![0].treatment_id).toBeNull();
    });

    it('재고 부족 시 INSUFFICIENT_STOCK 에러를 반환해야 한다', async () => {
      // 병원 재고보다 많이 요청
      const { data, error } = await hospitalClient.rpc('create_treatment_atomic', {
        p_patient_phone: '01012345680',
        p_treatment_date: new Date().toISOString().split('T')[0],
        p_items: [{ productId: testProductId, quantity: 100 }],
      });

      expect(error).toBeNull();
      expect(data![0].error_code).toBe('INSUFFICIENT_STOCK');
    });

    it('시술 시 TREATED 이력이 기록되어야 한다', async () => {
      const { data } = await hospitalClient.rpc('create_treatment_atomic', {
        p_patient_phone: '01098765432',
        p_treatment_date: new Date().toISOString().split('T')[0],
        p_items: [{ productId: testProductId, quantity: 1 }],
      });

      const treatmentId = data![0].treatment_id;

      // TREATED 이력 확인
      const { data: histories } = await adminClient
        .from('histories')
        .select('*')
        .eq('treatment_id', treatmentId)
        .eq('action_type', 'TREATED');

      expect(histories).toHaveLength(1);
      expect(histories![0].from_owner_id).toBe(TEST_ACCOUNTS.hospital.orgId);
      expect(histories![0].to_owner_type).toBe('PATIENT');
    });

    it('시술 후 코드 상태가 USED로 변경되어야 한다', async () => {
      const { data } = await hospitalClient.rpc('create_treatment_atomic', {
        p_patient_phone: '01011112222',
        p_treatment_date: new Date().toISOString().split('T')[0],
        p_items: [{ productId: testProductId, quantity: 1 }],
      });

      const treatmentId = data![0].treatment_id;

      // 시술에 사용된 코드 조회
      const { data: details } = await adminClient
        .from('treatment_details')
        .select('virtual_code_id')
        .eq('treatment_id', treatmentId);

      const codeId = details![0].virtual_code_id;

      // 코드 상태 확인
      const { data: code } = await adminClient
        .from('virtual_codes')
        .select('status, owner_type')
        .eq('id', codeId)
        .single();

      expect(code!.status).toBe('USED');
      expect(code!.owner_type).toBe('PATIENT');
    });
  });

  // ============================================================================
  // create_disposal_atomic 테스트
  // ============================================================================
  describe('create_disposal_atomic RPC', () => {
    // 병원에 폐기할 재고 준비
    beforeAll(async () => {
      // 새 Lot 생성
      await createTestLot({
        productId: testProductId,
        quantity: 10,
      });

      // 제조사 → 유통사 → 병원 출고 체인
      await manufacturerClient.rpc('create_shipment_atomic', {
        p_to_org_id: TEST_ACCOUNTS.distributor.orgId,
        p_to_org_type: 'DISTRIBUTOR',
        p_items: [{ productId: testProductId, quantity: 8 }],
      });

      await distributorClient.rpc('create_shipment_atomic', {
        p_to_org_id: TEST_ACCOUNTS.hospital.orgId,
        p_to_org_type: 'HOSPITAL',
        p_items: [{ productId: testProductId, quantity: 6 }],
      });
    });

    it('병원이 폐기 등록 시 성공해야 한다', async () => {
      const { data, error } = await hospitalClient.rpc('create_disposal_atomic', {
        p_disposal_date: new Date().toISOString().split('T')[0],
        p_disposal_reason_type: 'TREATMENT_LOSS',
        p_disposal_reason_custom: null,
        p_items: [{ productId: testProductId, quantity: 2 }],
      });

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].disposal_id).not.toBeNull();
      expect(data![0].total_quantity).toBe(2);
      expect(data![0].error_code).toBeNull();
    });

    it('병원이 아닌 조직이 폐기 등록 시 FORBIDDEN 에러를 반환해야 한다', async () => {
      const { data, error } = await distributorClient.rpc('create_disposal_atomic', {
        p_disposal_date: new Date().toISOString().split('T')[0],
        p_disposal_reason_type: 'EXPIRED',
        p_disposal_reason_custom: null,
        p_items: [{ productId: testProductId, quantity: 1 }],
      });

      expect(error).toBeNull();
      expect(data![0].error_code).toBe('FORBIDDEN');
    });

    it('OTHER 사유 선택 시 custom 사유가 필수여야 한다', async () => {
      const { data, error } = await hospitalClient.rpc('create_disposal_atomic', {
        p_disposal_date: new Date().toISOString().split('T')[0],
        p_disposal_reason_type: 'OTHER',
        p_disposal_reason_custom: null, // 비어있음 - 에러
        p_items: [{ productId: testProductId, quantity: 1 }],
      });

      expect(error).toBeNull();
      expect(data![0].error_code).toBe('REASON_REQUIRED');
    });

    it('OTHER 사유와 함께 custom 사유가 있으면 성공해야 한다', async () => {
      const { data, error } = await hospitalClient.rpc('create_disposal_atomic', {
        p_disposal_date: new Date().toISOString().split('T')[0],
        p_disposal_reason_type: 'OTHER',
        p_disposal_reason_custom: '테스트 폐기 사유',
        p_items: [{ productId: testProductId, quantity: 1 }],
      });

      expect(error).toBeNull();
      expect(data![0].disposal_id).not.toBeNull();
      expect(data![0].error_code).toBeNull();
    });

    it('폐기 시 DISPOSED 이력이 기록되어야 한다', async () => {
      const { data } = await hospitalClient.rpc('create_disposal_atomic', {
        p_disposal_date: new Date().toISOString().split('T')[0],
        p_disposal_reason_type: 'DEFECTIVE',
        p_disposal_reason_custom: null,
        p_items: [{ productId: testProductId, quantity: 1 }],
      });

      const disposalId = data![0].disposal_id;

      // DISPOSED 이력 확인
      const { data: histories } = await adminClient
        .from('histories')
        .select('*')
        .eq('disposal_id', disposalId)
        .eq('action_type', 'DISPOSED');

      expect(histories).toHaveLength(1);
      expect(histories![0].from_owner_id).toBe(TEST_ACCOUNTS.hospital.orgId);
    });

    it('폐기 후 코드 상태가 DISPOSED로 변경되어야 한다', async () => {
      const { data } = await hospitalClient.rpc('create_disposal_atomic', {
        p_disposal_date: new Date().toISOString().split('T')[0],
        p_disposal_reason_type: 'EXPIRED',
        p_disposal_reason_custom: null,
        p_items: [{ productId: testProductId, quantity: 1 }],
      });

      const disposalId = data![0].disposal_id;

      // 폐기된 코드 조회
      const { data: details } = await adminClient
        .from('disposal_details')
        .select('virtual_code_id')
        .eq('disposal_id', disposalId);

      const codeId = details![0].virtual_code_id;

      // 코드 상태 확인
      const { data: code } = await adminClient
        .from('virtual_codes')
        .select('status')
        .eq('id', codeId)
        .single();

      expect(code!.status).toBe('DISPOSED');
    });
  });
});
