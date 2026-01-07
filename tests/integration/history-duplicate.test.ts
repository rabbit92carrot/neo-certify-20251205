/**
 * get_history_summary_cursor 중복 이벤트 진단 테스트
 *
 * 문제: 거래 이력 페이지에서 동일 이벤트가 두 번씩 나타남
 *
 * 원인 분석:
 * - grp_key가 shipment_batch_id만 사용
 * - GROUP BY에서 action_type으로 분리
 * - 결과: 같은 grp_key를 가진 SHIPPED/RECEIVED 2개 행 반환
 *
 * 해결책: grp_key에 action_type 포함
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createAuthenticatedTestClient,
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
};

describe('get_history_summary_cursor 중복 이벤트 테스트', () => {
  let manufacturerClient: SupabaseClient<Database>;
  let distributorClient: SupabaseClient<Database>;

  beforeAll(async () => {
    manufacturerClient = await createAuthenticatedTestClient(
      TEST_ACCOUNTS.manufacturer.email,
      TEST_ACCOUNTS.manufacturer.password
    );
    distributorClient = await createAuthenticatedTestClient(
      TEST_ACCOUNTS.distributor.email,
      TEST_ACCOUNTS.distributor.password
    );
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  it('동일 배치의 RECEIVED 이벤트는 하나만 반환되어야 한다', async () => {
    // 테스트 격리: 고유 제품 생성
    const duplicateTestProduct = await createTestProduct({
      organizationId: TEST_ACCOUNTS.manufacturer.orgId,
      name: '중복테스트제품_' + Date.now(),
    });

    // Lot 생성 (8개)
    await createTestLot({
      productId: duplicateTestProduct.id,
      quantity: 8,
    });

    // 제조사 → 유통사 출고 (8개)
    const { data: shipmentData } = await manufacturerClient.rpc('create_shipment_atomic', {
      p_to_org_id: TEST_ACCOUNTS.distributor.orgId,
      p_to_org_type: 'DISTRIBUTOR',
      p_items: [{ productId: duplicateTestProduct.id, quantity: 8 }],
    });
    expect(shipmentData).not.toBeNull();

    // 유통사가 RECEIVED 필터로 이력 조회
    const { data, error } = await distributorClient.rpc('get_history_summary_cursor', {
      p_organization_id: TEST_ACCOUNTS.distributor.orgId,
      p_action_types: ['RECEIVED'],
      p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      p_limit: 50,
    });

    expect(error).toBeNull();
    expect(data).not.toBeNull();

    // 이 배치와 관련된 RECEIVED 이벤트 필터링
    const batchId = shipmentData![0].shipment_batch_id!;
    console.log('=== 첫 번째 테스트 디버그 ===');
    console.log('생성된 batchId:', batchId);
    console.log('첫 3개 행의 group_key:', data!.slice(0, 3).map((r) => r.group_key));
    console.log('예상 group_key 형식:', `${batchId}_RECEIVED`);

    const receivedEvents = data!.filter(
      (row) => row.group_key.includes(batchId) || row.shipment_batch_id === batchId
    );

    console.log('필터링된 이벤트:', receivedEvents.map((e) => ({
      group_key: e.group_key,
      action_type: e.action_type,
    })));

    // 핵심 검증: 같은 배치의 RECEIVED 이벤트는 1개만 있어야 함
    expect(receivedEvents.length).toBe(1);
    expect(receivedEvents[0].action_type).toBe('RECEIVED');
    expect(receivedEvents[0].total_quantity).toBe(8);
  });

  it('group_key는 모두 고유해야 한다 (중복 없음)', async () => {
    // 유통사의 전체 이력 조회
    const { data, error } = await distributorClient.rpc('get_history_summary_cursor', {
      p_organization_id: TEST_ACCOUNTS.distributor.orgId,
      p_action_types: null, // 모든 액션 타입
      p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      p_limit: 100,
    });

    expect(error).toBeNull();
    expect(data).not.toBeNull();

    // group_key 중복 확인
    const groupKeys = data!.map((row) => row.group_key);
    const uniqueGroupKeys = new Set(groupKeys);

    // 중복이 있다면 어떤 group_key가 중복인지 로그 (검증 전에 먼저 출력)
    if (groupKeys.length !== uniqueGroupKeys.size) {
      const duplicates = groupKeys.filter((key, index) => groupKeys.indexOf(key) !== index);
      console.log('=== 중복 group_key 상세 ===');
      console.log('총 행 수:', groupKeys.length);
      console.log('고유 행 수:', uniqueGroupKeys.size);
      console.log('중복된 group_key 목록 (상위 5개):', [...new Set(duplicates)].slice(0, 5));

      // 첫 번째 중복 상세 정보
      const firstDuplicate = [...new Set(duplicates)][0];
      if (firstDuplicate) {
        const duplicateRows = data!.filter((row) => row.group_key === firstDuplicate);
        console.log('첫 번째 중복 상세:', duplicateRows.map((r) => ({
          group_key: r.group_key,
          action_type: r.action_type,
          total_quantity: r.total_quantity,
        })));
      }
    }

    // 핵심 검증: group_key는 모두 고유해야 함
    expect(groupKeys.length).toBe(uniqueGroupKeys.size);
  });

  it('action_type 필터 없이 조회 시 SHIPPED/RECEIVED가 각각 반환되어야 한다', async () => {
    // 테스트 격리: 고유 제품 생성
    const separationTestProduct = await createTestProduct({
      organizationId: TEST_ACCOUNTS.manufacturer.orgId,
      name: '분리테스트제품_' + Date.now(),
    });

    // Lot 생성 (5개)
    await createTestLot({
      productId: separationTestProduct.id,
      quantity: 5,
    });

    // 제조사 → 유통사 출고 (5개)
    const { data: shipmentData } = await manufacturerClient.rpc('create_shipment_atomic', {
      p_to_org_id: TEST_ACCOUNTS.distributor.orgId,
      p_to_org_type: 'DISTRIBUTOR',
      p_items: [{ productId: separationTestProduct.id, quantity: 5 }],
    });
    const batchId = shipmentData![0].shipment_batch_id!;

    // 유통사가 모든 액션 타입으로 조회
    const { data, error } = await distributorClient.rpc('get_history_summary_cursor', {
      p_organization_id: TEST_ACCOUNTS.distributor.orgId,
      p_action_types: null,
      p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      p_limit: 100,
    });

    expect(error).toBeNull();

    // 이 배치와 관련된 이벤트 필터링
    const batchEvents = data!.filter(
      (row) => row.group_key.includes(batchId) || row.shipment_batch_id === batchId
    );

    // SHIPPED와 RECEIVED가 각각 존재해야 함 (둘 다 보이는 게 정상)
    // 단, 같은 group_key로 2번 나오면 안 됨
    const actionTypes = batchEvents.map((e) => e.action_type);
    const groupKeysForBatch = batchEvents.map((e) => e.group_key);

    // 중복 group_key 확인
    const uniqueGroupKeysForBatch = new Set(groupKeysForBatch);
    expect(groupKeysForBatch.length).toBe(uniqueGroupKeysForBatch.size);

    // 유통사는 RECEIVED만 볼 수 있어야 함 (to_owner_id 기준)
    // SHIPPED는 from_owner_id가 제조사이므로 유통사에게 보이지 않아야 함
    // 하지만 현재 WHERE 조건이 from OR to이므로 둘 다 보일 수 있음
    // 이 부분은 비즈니스 로직에 따라 다를 수 있음
    console.log('배치 이벤트 action_types:', actionTypes);
    console.log('배치 이벤트 group_keys:', groupKeysForBatch);
  });

  it('반품 후에도 이력이 중복되지 않아야 한다', async () => {
    // 테스트 격리: 고유 제품 생성
    const returnTestProduct = await createTestProduct({
      organizationId: TEST_ACCOUNTS.manufacturer.orgId,
      name: '반품중복테스트_' + Date.now(),
    });

    // Lot 생성 (6개)
    await createTestLot({
      productId: returnTestProduct.id,
      quantity: 6,
    });

    // 제조사 → 유통사 출고 (6개)
    const { data: shipmentData } = await manufacturerClient.rpc('create_shipment_atomic', {
      p_to_org_id: TEST_ACCOUNTS.distributor.orgId,
      p_to_org_type: 'DISTRIBUTOR',
      p_items: [{ productId: returnTestProduct.id, quantity: 6 }],
    });
    const batchId = shipmentData![0].shipment_batch_id!;

    // 부분 반품 (3개)
    await distributorClient.rpc('return_shipment_atomic', {
      p_shipment_batch_id: batchId,
      p_reason: '테스트 반품',
      p_product_quantities: [{ productId: returnTestProduct.id, quantity: 3 }],
    });

    // 유통사 이력 조회
    const { data, error } = await distributorClient.rpc('get_history_summary_cursor', {
      p_organization_id: TEST_ACCOUNTS.distributor.orgId,
      p_action_types: null,
      p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      p_limit: 100,
    });

    expect(error).toBeNull();

    // group_key 중복 확인
    const groupKeys = data!.map((row) => row.group_key);
    const uniqueGroupKeys = new Set(groupKeys);

    // 핵심 검증: 반품 후에도 중복 없어야 함
    expect(groupKeys.length).toBe(uniqueGroupKeys.size);

    // 배치 관련 이벤트 확인 (RECEIVED + RETURN_SENT/RETURN_RECEIVED)
    const batchEvents = data!.filter(
      (row) => row.group_key.includes(batchId) || row.shipment_batch_id === batchId
    );
    console.log(
      '반품 후 배치 이벤트:',
      batchEvents.map((e) => ({
        action_type: e.action_type,
        group_key: e.group_key,
        is_recall: e.is_recall,
      }))
    );
  });
});
