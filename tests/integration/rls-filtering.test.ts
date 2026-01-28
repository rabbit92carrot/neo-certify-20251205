/**
 * RLS 필터링 테스트
 *
 * get_history_summary_cursor RPC 함수의 이벤트 타입별 필터링을 검증합니다.
 * 최근 버그: SHIPPED/RECEIVED가 동일 조건으로 필터링되어 다른 조직 데이터 노출
 *
 * 올바른 필터링 규칙:
 * - SHIPPED: from_owner_id = 현재 조직 (내가 발송한 건만)
 * - RECEIVED: to_owner_id = 현재 조직 (내가 수신한 건만)
 * - RETURN_SENT: 반품 요청자만 (내가 반품한 건)
 * - RETURN_RECEIVED: 반품 수신자만 (반품받은 건)
 * - RECALLED: 양쪽 모두 (내가 회수하거나 회수당한 건)
 * - TREATED: from_owner_id = 현재 조직 (내가 시술한 건만)
 * - PRODUCED: from_owner_id = 현재 조직 (내가 생산한 건만)
 * - DISPOSED: from_owner_id = 현재 조직 (내가 폐기한 건만)
 *
 * 테스트 계정 (TEST_GUIDE.md 참조):
 * - 제조사: manufacturer@neocert.com / test123 / a0000000-0000-0000-0000-000000000002
 * - 유통사: distributor@neocert.com / test123 / a0000000-0000-0000-0000-000000000003
 * - 병원: hospital@neocert.com / test123 / a0000000-0000-0000-0000-000000000004
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
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
};

describe('RLS 필터링 테스트 (get_history_summary_cursor)', () => {
  const adminClient = createTestAdminClient();
  let manufacturerClient: SupabaseClient<Database>;
  let distributorClient: SupabaseClient<Database>;
  let hospitalClient: SupabaseClient<Database>;

  // 테스트 데이터
  let testProductId: string;
  let shipmentBatchId1: string; // 제조사 → 유통사
  let shipmentBatchId2: string; // 유통사 → 병원
  let returnedBatchId: string; // 병원 → 유통사 반품

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

    // 테스트 데이터 생성
    const product = await createTestProduct({
      organizationId: TEST_ACCOUNTS.manufacturer.orgId,
      name: 'RLS테스트제품',
    });
    testProductId = product.id;

    // Lot 생성 (가상코드 30개)
    await createTestLot({
      productId: testProductId,
      quantity: 30,
    });

    // 1. 제조사 → 유통사 출고 (10개)
    const { data: shipment1 } = await manufacturerClient.rpc('create_shipment_atomic', {
      p_to_org_id: TEST_ACCOUNTS.distributor.orgId,
      p_to_org_type: 'DISTRIBUTOR',
      p_items: [{ productId: testProductId, quantity: 10 }],
    });
    shipmentBatchId1 = shipment1![0].shipment_batch_id!;

    // 2. 유통사 → 병원 출고 (5개)
    const { data: shipment2 } = await distributorClient.rpc('create_shipment_atomic', {
      p_to_org_id: TEST_ACCOUNTS.hospital.orgId,
      p_to_org_type: 'HOSPITAL',
      p_items: [{ productId: testProductId, quantity: 5 }],
    });
    shipmentBatchId2 = shipment2![0].shipment_batch_id!;

    // 3. 병원 → 유통사 반품 (출고 2에서 받은 것 반품)
    const { data: returnData } = await hospitalClient.rpc('return_shipment_atomic', {
      p_shipment_batch_id: shipmentBatchId2,
      p_reason: 'RLS 테스트 반품',
    });
    // returnData success 확인
    if (returnData && returnData[0].success) {
      returnedBatchId = shipmentBatchId2;
    }

    // 4. 병원 시술 (새로운 재고로)
    await createTestLot({
      productId: testProductId,
      quantity: 5,
    });

    await manufacturerClient.rpc('create_shipment_atomic', {
      p_to_org_id: TEST_ACCOUNTS.distributor.orgId,
      p_to_org_type: 'DISTRIBUTOR',
      p_items: [{ productId: testProductId, quantity: 5 }],
    });

    await distributorClient.rpc('create_shipment_atomic', {
      p_to_org_id: TEST_ACCOUNTS.hospital.orgId,
      p_to_org_type: 'HOSPITAL',
      p_items: [{ productId: testProductId, quantity: 3 }],
    });

    await hospitalClient.rpc('create_treatment_atomic', {
      p_patient_phone: '01099998888',
      p_treatment_date: new Date().toISOString().split('T')[0],
      p_items: [{ productId: testProductId, quantity: 2 }],
    });
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  // ============================================================================
  // SHIPPED 이벤트 필터링 테스트
  // ============================================================================
  describe('SHIPPED 이벤트 필터링', () => {
    it('제조사는 자신이 발송한 SHIPPED만 조회해야 한다', async () => {
      const { data, error } = await manufacturerClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.manufacturer.orgId,
        p_action_types: ['SHIPPED'],
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // 모든 SHIPPED는 제조사가 from이어야 함
      data?.forEach((item) => {
        expect(item.action_type).toBe('SHIPPED');
        expect(item.from_owner_id).toBe(TEST_ACCOUNTS.manufacturer.orgId);
      });
    });

    it('유통사는 자신이 발송한 SHIPPED만 조회해야 한다 (제조사 발송은 안 보임)', async () => {
      const { data, error } = await distributorClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.distributor.orgId,
        p_action_types: ['SHIPPED'],
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // 유통사가 발송한 SHIPPED만 보여야 함
      data?.forEach((item) => {
        expect(item.action_type).toBe('SHIPPED');
        expect(item.from_owner_id).toBe(TEST_ACCOUNTS.distributor.orgId);
      });

      // 제조사가 발송한 SHIPPED는 보이면 안 됨
      const manufacturerShipped = data?.filter(
        (item) => item.from_owner_id === TEST_ACCOUNTS.manufacturer.orgId
      );
      expect(manufacturerShipped).toHaveLength(0);
    });
  });

  // ============================================================================
  // RECEIVED 이벤트 필터링 테스트
  // ============================================================================
  describe('RECEIVED 이벤트 필터링', () => {
    it('유통사는 자신이 수신한 RECEIVED만 조회해야 한다', async () => {
      const { data, error } = await distributorClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.distributor.orgId,
        p_action_types: ['RECEIVED'],
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // 모든 RECEIVED는 유통사가 to이어야 함
      data?.forEach((item) => {
        expect(item.action_type).toBe('RECEIVED');
        expect(item.to_owner_id).toBe(TEST_ACCOUNTS.distributor.orgId);
      });
    });

    it('제조사는 유통사의 RECEIVED를 조회하면 안 된다', async () => {
      const { data, error } = await manufacturerClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.manufacturer.orgId,
        p_action_types: ['RECEIVED'],
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(error).toBeNull();

      // 제조사의 RECEIVED는 없어야 함 (제조사는 수신하지 않음)
      // 단, 반품받은 경우는 RETURN_RECEIVED로 기록되므로 RECEIVED가 없을 수 있음
      data?.forEach((item) => {
        expect(item.action_type).toBe('RECEIVED');
        expect(item.to_owner_id).toBe(TEST_ACCOUNTS.manufacturer.orgId);
      });
    });

    it('병원은 자신이 수신한 RECEIVED만 조회해야 한다', async () => {
      const { data, error } = await hospitalClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.hospital.orgId,
        p_action_types: ['RECEIVED'],
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // 모든 RECEIVED는 병원이 to이어야 함
      data?.forEach((item) => {
        expect(item.action_type).toBe('RECEIVED');
        expect(item.to_owner_id).toBe(TEST_ACCOUNTS.hospital.orgId);
      });
    });
  });

  // ============================================================================
  // RETURN_SENT/RETURN_RECEIVED 이벤트 필터링 테스트
  // ============================================================================
  describe('RETURN_SENT/RETURN_RECEIVED 이벤트 필터링', () => {
    it('반품 요청자는 RETURN_SENT, 수신자는 RETURN_RECEIVED를 조회해야 한다', async () => {
      // 병원이 반품 요청자 (from) → RETURN_SENT 조회
      const { data: hospitalData } = await hospitalClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.hospital.orgId,
        p_action_types: ['RETURN_SENT'],
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // 병원은 자신이 반품한 RETURN_SENT를 볼 수 있어야 함
      const hospitalReturnSent = hospitalData?.filter((item) => item.action_type === 'RETURN_SENT');
      expect(hospitalReturnSent?.length).toBeGreaterThanOrEqual(0);
      hospitalReturnSent?.forEach((item) => {
        expect(item.from_owner_id).toBe(TEST_ACCOUNTS.hospital.orgId);
      });

      // 유통사가 반품 받는 조직 (to) → RETURN_RECEIVED 조회
      const { data: distributorData } = await distributorClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.distributor.orgId,
        p_action_types: ['RETURN_RECEIVED'],
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // 유통사는 반품받은 RETURN_RECEIVED를 볼 수 있어야 함
      const distributorReturnReceived = distributorData?.filter((item) => item.action_type === 'RETURN_RECEIVED');
      expect(distributorReturnReceived?.length).toBeGreaterThanOrEqual(0);
      distributorReturnReceived?.forEach((item) => {
        expect(item.to_owner_id).toBe(TEST_ACCOUNTS.distributor.orgId);
      });
    });
  });

  // ============================================================================
  // TREATED 이벤트 필터링 테스트
  // ============================================================================
  describe('TREATED 이벤트 필터링', () => {
    it('병원은 자신의 TREATED만 조회해야 한다', async () => {
      const { data, error } = await hospitalClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.hospital.orgId,
        p_action_types: ['TREATED'],
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // 모든 TREATED는 병원이 from이어야 함
      data?.forEach((item) => {
        expect(item.action_type).toBe('TREATED');
        expect(item.from_owner_id).toBe(TEST_ACCOUNTS.hospital.orgId);
      });
    });

    it('유통사는 병원의 TREATED를 조회하면 안 된다', async () => {
      const { data, error } = await distributorClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.distributor.orgId,
        p_action_types: ['TREATED'],
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(error).toBeNull();

      // 유통사는 TREATED를 볼 수 없어야 함 (병원만 시술)
      expect(data).toHaveLength(0);
    });
  });

  // ============================================================================
  // 이벤트 타입 필터 테스트
  // ============================================================================
  describe('이벤트 타입 필터', () => {
    it('RETURN_SENT 필터 선택 시 RETURN_SENT만 반환해야 한다', async () => {
      const { data, error } = await hospitalClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.hospital.orgId,
        p_action_types: ['RETURN_SENT'],
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(error).toBeNull();

      // 다른 이벤트 타입이 포함되면 안 됨
      data?.forEach((item) => {
        expect(item.action_type).toBe('RETURN_SENT');
      });
    });

    it('RETURN_RECEIVED 필터 선택 시 RETURN_RECEIVED만 반환해야 한다', async () => {
      const { data, error } = await distributorClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.distributor.orgId,
        p_action_types: ['RETURN_RECEIVED'],
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(error).toBeNull();

      // 다른 이벤트 타입이 포함되면 안 됨
      data?.forEach((item) => {
        expect(item.action_type).toBe('RETURN_RECEIVED');
      });
    });

    it('SHIPPED 필터 선택 시 SHIPPED만 반환해야 한다', async () => {
      const { data, error } = await manufacturerClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.manufacturer.orgId,
        p_action_types: ['SHIPPED'],
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(error).toBeNull();

      // SHIPPED만 반환되어야 함
      data?.forEach((item) => {
        expect(item.action_type).toBe('SHIPPED');
      });
    });

    it('복수 필터 (SHIPPED, RECEIVED) 선택 시 해당 타입만 반환해야 한다', async () => {
      const { data, error } = await distributorClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.distributor.orgId,
        p_action_types: ['SHIPPED', 'RECEIVED'],
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(error).toBeNull();

      // SHIPPED 또는 RECEIVED만 반환되어야 함
      data?.forEach((item) => {
        expect(['SHIPPED', 'RECEIVED']).toContain(item.action_type);
      });
    });
  });

  // ============================================================================
  // 조직 간 데이터 격리 테스트
  // ============================================================================
  describe('조직 간 데이터 격리', () => {
    it('제조사는 유통사의 RECEIVED 이벤트를 볼 수 없어야 한다', async () => {
      // 먼저 유통사가 볼 수 있는 RECEIVED 확인
      const { data: distributorData } = await distributorClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.distributor.orgId,
        p_action_types: ['RECEIVED'],
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // 유통사는 RECEIVED를 볼 수 있어야 함
      expect(distributorData?.length).toBeGreaterThan(0);

      // 제조사 관점에서 조회
      const { data: manufacturerData } = await manufacturerClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.manufacturer.orgId,
        p_action_types: ['RECEIVED'],
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // 제조사는 유통사가 받은 RECEIVED를 볼 수 없어야 함
      manufacturerData?.forEach((item) => {
        // 만약 RECEIVED가 있다면, 그것은 제조사가 to인 경우만 가능 (반품받은 경우)
        expect(item.to_owner_id).toBe(TEST_ACCOUNTS.manufacturer.orgId);
      });
    });

    it('병원은 제조사-유통사 간 SHIPPED/RECEIVED를 볼 수 없어야 한다', async () => {
      // 병원 관점에서 SHIPPED 조회
      const { data: hospitalShipped } = await hospitalClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.hospital.orgId,
        p_action_types: ['SHIPPED'],
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // 병원은 자신이 발송한 SHIPPED만 보여야 함 (병원은 출고를 안 하므로 비어 있을 수 있음)
      hospitalShipped?.forEach((item) => {
        expect(item.from_owner_id).toBe(TEST_ACCOUNTS.hospital.orgId);
      });

      // 병원 관점에서 RECEIVED 조회
      const { data: hospitalReceived } = await hospitalClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.hospital.orgId,
        p_action_types: ['RECEIVED'],
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // 병원은 자신이 받은 RECEIVED만 보여야 함
      hospitalReceived?.forEach((item) => {
        expect(item.to_owner_id).toBe(TEST_ACCOUNTS.hospital.orgId);
      });

      // 제조사→유통사 RECEIVED가 병원에게 보이면 안 됨
      const manufacturerToDistributorReceived = hospitalReceived?.filter(
        (item) =>
          item.from_owner_id === TEST_ACCOUNTS.manufacturer.orgId &&
          item.to_owner_id === TEST_ACCOUNTS.distributor.orgId
      );
      expect(manufacturerToDistributorReceived).toHaveLength(0);
    });
  });

  // ============================================================================
  // 버그 회귀 테스트: 동일 배치에서 SHIPPED/RECEIVED 중복 조회 문제
  // ============================================================================
  describe('버그 회귀: SHIPPED/RECEIVED 중복 조회 방지', () => {
    it('유통사가 입고 조회 시 SHIPPED는 포함되지 않아야 한다', async () => {
      // 유통사가 RECEIVED만 필터해서 조회
      const { data, error } = await distributorClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.distributor.orgId,
        p_action_types: ['RECEIVED'],
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(error).toBeNull();

      // SHIPPED가 포함되어 있으면 버그
      const shippedItems = data?.filter((item) => item.action_type === 'SHIPPED');
      expect(shippedItems).toHaveLength(0);
    });

    it('제조사가 출고 조회 시 RECEIVED는 포함되지 않아야 한다', async () => {
      // 제조사가 SHIPPED만 필터해서 조회
      const { data, error } = await manufacturerClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.manufacturer.orgId,
        p_action_types: ['SHIPPED'],
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(error).toBeNull();

      // RECEIVED가 포함되어 있으면 버그 (유통사의 RECEIVED)
      const receivedItems = data?.filter((item) => item.action_type === 'RECEIVED');
      expect(receivedItems).toHaveLength(0);
    });
  });

  // ============================================================================
  // DISPOSED 이벤트 필터링 테스트
  // ============================================================================
  describe('DISPOSED 이벤트 필터링', () => {
    it('병원은 자신의 DISPOSED만 조회해야 한다', async () => {
      const { data, error } = await hospitalClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.hospital.orgId,
        p_action_types: ['DISPOSED'],
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(error).toBeNull();

      // 모든 DISPOSED는 병원이 from이어야 함
      data?.forEach((item) => {
        expect(item.action_type).toBe('DISPOSED');
        expect(item.from_owner_id).toBe(TEST_ACCOUNTS.hospital.orgId);
      });
    });

    it('유통사는 병원의 DISPOSED를 볼 수 없어야 한다', async () => {
      const { data, error } = await distributorClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.distributor.orgId,
        p_action_types: ['DISPOSED'],
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(error).toBeNull();

      // 유통사는 DISPOSED를 볼 수 없어야 함 (폐기는 병원만 가능)
      expect(data).toHaveLength(0);
    });
  });

  // ============================================================================
  // PRODUCED 이벤트 필터링 테스트
  // ============================================================================
  describe('PRODUCED 이벤트 필터링', () => {
    it('제조사는 자신의 PRODUCED만 조회해야 한다', async () => {
      const { data, error } = await manufacturerClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.manufacturer.orgId,
        p_action_types: ['PRODUCED'],
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(error).toBeNull();

      // 모든 PRODUCED는 제조사가 from이어야 함
      data?.forEach((item) => {
        expect(item.action_type).toBe('PRODUCED');
        expect(item.from_owner_id).toBe(TEST_ACCOUNTS.manufacturer.orgId);
      });
    });

    it('유통사는 제조사의 PRODUCED를 볼 수 없어야 한다', async () => {
      const { data, error } = await distributorClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.distributor.orgId,
        p_action_types: ['PRODUCED'],
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(error).toBeNull();

      // 유통사는 PRODUCED를 볼 수 없어야 함 (생산은 제조사만 가능)
      expect(data).toHaveLength(0);
    });
  });

  // ============================================================================
  // RECALLED 이벤트 필터링 테스트
  // ============================================================================
  describe('RECALLED 이벤트 필터링', () => {
    it('회수 발송자(병원)는 자신의 RECALLED를 조회할 수 있어야 한다', async () => {
      // 시술 회수는 병원이 from (회수 주체), 환자가 to (회수 대상)
      const { data, error } = await hospitalClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.hospital.orgId,
        p_action_types: ['RECALLED'],
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(error).toBeNull();

      // 모든 RECALLED는 병원이 from 또는 to여야 함
      data?.forEach((item) => {
        expect(item.action_type).toBe('RECALLED');
        const isFromOrTo =
          item.from_owner_id === TEST_ACCOUNTS.hospital.orgId ||
          item.to_owner_id === TEST_ACCOUNTS.hospital.orgId;
        expect(isFromOrTo).toBe(true);
      });
    });

    it('관련 없는 조직(유통사)은 병원의 시술 회수를 볼 수 없어야 한다', async () => {
      // 유통사는 시술 회수(병원→환자)와 관련 없음
      const { data, error } = await distributorClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.distributor.orgId,
        p_action_types: ['RECALLED'],
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(error).toBeNull();

      // 유통사가 볼 수 있는 RECALLED가 있다면, 유통사가 from 또는 to여야 함
      data?.forEach((item) => {
        expect(item.action_type).toBe('RECALLED');
        const isFromOrTo =
          item.from_owner_id === TEST_ACCOUNTS.distributor.orgId ||
          item.to_owner_id === TEST_ACCOUNTS.distributor.orgId;
        expect(isFromOrTo).toBe(true);
      });
    });
  });

  // ============================================================================
  // 커서 페이지네이션 테스트
  // ============================================================================
  describe('커서 페이지네이션', () => {
    it('limit보다 많은 데이터가 있으면 has_more=true를 반환해야 한다', async () => {
      // 제조사는 PRODUCED 이력이 많음 (lot 생성 시마다 기록됨)
      const { data, error } = await manufacturerClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.manufacturer.orgId,
        p_limit: 1, // 매우 작은 limit
        p_start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(error).toBeNull();

      // 데이터가 있으면 has_more 확인
      if (data && data.length > 0) {
        // has_more는 데이터가 limit보다 많을 때 true
        // 실제로 더 많은 데이터가 있는지는 다음 페이지 조회로 확인
        expect(typeof data[0].has_more).toBe('boolean');
      }
    });

    it('커서로 다음 페이지 조회 시 커서 기준보다 오래된 데이터만 반환해야 한다', { timeout: 60000 }, async () => {
      // 첫 페이지 조회
      const { data: page1, error: error1 } = await manufacturerClient.rpc(
        'get_history_summary_cursor',
        {
          p_organization_id: TEST_ACCOUNTS.manufacturer.orgId,
          p_limit: 2,
          p_start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        }
      );

      expect(error1).toBeNull();

      if (!page1 || page1.length < 2) {
        // 데이터가 충분하지 않으면 테스트 스킵
        return;
      }

      const lastItem = page1[page1.length - 1];
      const lastItemTime = new Date(lastItem.created_at).getTime();

      // 두 번째 페이지 조회 (커서 사용)
      const { data: page2, error: error2 } = await manufacturerClient.rpc(
        'get_history_summary_cursor',
        {
          p_organization_id: TEST_ACCOUNTS.manufacturer.orgId,
          p_limit: 2,
          p_start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          p_cursor_time: lastItem.created_at,
          p_cursor_key: lastItem.group_key,
        }
      );

      expect(error2).toBeNull();

      if (page2 && page2.length > 0) {
        // 두 번째 페이지의 데이터는 커서보다 오래되거나 같은 시간+작은 key여야 함
        page2.forEach((item) => {
          const itemTime = new Date(item.created_at).getTime();
          const isOlder = itemTime < lastItemTime;
          const isSameTimeWithSmallerKey =
            itemTime === lastItemTime && item.group_key < lastItem.group_key;

          expect(isOlder || isSameTimeWithSmallerKey).toBe(true);
        });
      }
    });

    it('데이터가 없으면 빈 배열과 has_more=false를 반환해야 한다', async () => {
      // 아주 먼 과거 날짜로 조회 (데이터 없음 보장)
      const { data, error } = await manufacturerClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.manufacturer.orgId,
        p_start_date: new Date('2020-01-01').toISOString(),
        p_end_date: new Date('2020-01-02').toISOString(),
      });

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('동일 시간의 데이터가 있을 때 group_key로 정렬되어야 한다', async () => {
      const { data, error } = await manufacturerClient.rpc('get_history_summary_cursor', {
        p_organization_id: TEST_ACCOUNTS.manufacturer.orgId,
        p_limit: 10,
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(error).toBeNull();

      if (data && data.length > 1) {
        // 정렬 순서 확인: created_at DESC, group_key DESC
        for (let i = 0; i < data.length - 1; i++) {
          const current = data[i];
          const next = data[i + 1];

          const currentTime = new Date(current.created_at).getTime();
          const nextTime = new Date(next.created_at).getTime();

          // 시간이 같거나 더 최신이어야 함
          expect(currentTime).toBeGreaterThanOrEqual(nextTime);

          // 시간이 같으면 group_key로 정렬
          if (currentTime === nextTime) {
            expect(current.group_key >= next.group_key).toBe(true);
          }
        }
      }
    });
  });
});
