/**
 * Inventory Service 통합 테스트
 *
 * 재고 조회 관련 기능을 테스트합니다.
 * 실제 Supabase 로컬 인스턴스를 사용합니다.
 */
import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import {
  createTestAdminClient,
  createTestOrganization,
  createTestProduct,
  createTestLot,
  getVirtualCodesByLot,
  updateVirtualCodeOwner,
  cleanupAllTestData,
} from '../helpers';

describe('Inventory Service Integration Tests', () => {
  const adminClient = createTestAdminClient();

  afterEach(async () => {
    await cleanupAllTestData();
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  describe('재고 요약 조회 (getInventorySummary)', () => {
    it('제품별 재고 요약을 조회할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const distributor = await createTestOrganization({ type: 'DISTRIBUTOR' });

      // 제품 2개 생성
      const product1 = await createTestProduct({
        organizationId: manufacturer.id,
        name: 'PDO 실 30G',
      });
      const product2 = await createTestProduct({
        organizationId: manufacturer.id,
        name: 'PLLA 필러',
      });

      // Lot 생성 (각각 10개)
      const lot1 = await createTestLot({
        productId: product1.id,
        quantity: 10,
      });
      const lot2 = await createTestLot({
        productId: product2.id,
        quantity: 5,
      });

      // 유통사에게 소유권 이전
      const codes1 = await getVirtualCodesByLot(lot1.id);
      const codes2 = await getVirtualCodesByLot(lot2.id);

      for (const code of [...codes1, ...codes2]) {
        await updateVirtualCodeOwner(code.id, 'ORGANIZATION', distributor.id);
      }

      // 재고 요약 조회 (가상 코드 기반)
      const { data: inventory } = await adminClient
        .from('virtual_codes')
        .select(
          `
          lot:lots!inner(
            product:products!inner(
              id,
              name
            )
          )
        `
        )
        .eq('owner_id', distributor.id)
        .eq('owner_type', 'ORGANIZATION')
        .eq('status', 'IN_STOCK');

      expect(inventory).toBeDefined();
      expect(inventory!.length).toBe(15); // 10 + 5

      // 제품별로 그룹화
      const productMap = new Map<string, number>();
      for (const item of inventory!) {
        const product = (item.lot as { product: { id: string; name: string } }).product;
        productMap.set(product.id, (productMap.get(product.id) || 0) + 1);
      }

      expect(productMap.get(product1.id)).toBe(10);
      expect(productMap.get(product2.id)).toBe(5);
    });

    it('재고가 없는 경우 빈 배열을 반환해야 한다', async () => {
      const distributor = await createTestOrganization({ type: 'DISTRIBUTOR' });

      const { data: inventory } = await adminClient
        .from('virtual_codes')
        .select('*')
        .eq('owner_id', distributor.id)
        .eq('owner_type', 'ORGANIZATION')
        .eq('status', 'IN_STOCK');

      expect(inventory).toEqual([]);
    });

    it('USED 상태의 코드는 재고에 포함되지 않아야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const hospital = await createTestOrganization({ type: 'HOSPITAL' });

      const product = await createTestProduct({ organizationId: manufacturer.id });
      const lot = await createTestLot({ productId: product.id, quantity: 10 });

      // 병원에게 소유권 이전
      const codes = await getVirtualCodesByLot(lot.id);
      for (const code of codes) {
        await updateVirtualCodeOwner(code.id, 'ORGANIZATION', hospital.id);
      }

      // 5개를 USED 상태로 변경
      for (let i = 0; i < 5; i++) {
        await updateVirtualCodeOwner(codes[i].id, 'ORGANIZATION', hospital.id, 'USED');
      }

      // 재고 조회 (IN_STOCK만)
      const { data: inventory } = await adminClient
        .from('virtual_codes')
        .select('*')
        .eq('owner_id', hospital.id)
        .eq('owner_type', 'ORGANIZATION')
        .eq('status', 'IN_STOCK');

      expect(inventory!.length).toBe(5); // 10 - 5 = 5
    });
  });

  describe('제품별 Lot 재고 상세 조회 (getProductInventoryDetail)', () => {
    it('RPC를 통해 Lot별 재고를 조회할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const distributor = await createTestOrganization({ type: 'DISTRIBUTOR' });

      const product = await createTestProduct({ organizationId: manufacturer.id });

      // Lot 2개 생성 (날짜 다르게)
      const lot1 = await createTestLot({
        productId: product.id,
        quantity: 10,
        manufactureDate: '2025-01-01',
      });
      const lot2 = await createTestLot({
        productId: product.id,
        quantity: 5,
        manufactureDate: '2025-02-01',
      });

      // 유통사에게 소유권 이전
      const codes1 = await getVirtualCodesByLot(lot1.id);
      const codes2 = await getVirtualCodesByLot(lot2.id);

      for (const code of [...codes1, ...codes2]) {
        await updateVirtualCodeOwner(code.id, 'ORGANIZATION', distributor.id);
      }

      // RPC로 Lot별 재고 조회
      const { data: lotInventory, error } = await adminClient.rpc('get_inventory_by_lot', {
        p_owner_id: distributor.id,
        p_product_id: product.id,
      });

      expect(error).toBeNull();
      expect(lotInventory).toBeDefined();
      expect(lotInventory.length).toBe(2);

      // 제조일 오래된 순으로 정렬되어 있어야 함 (FIFO)
      const sortedLots = [...lotInventory].sort(
        (a, b) =>
          new Date(a.manufacture_date).getTime() - new Date(b.manufacture_date).getTime()
      );

      expect(sortedLots[0].quantity).toBe(10);
      expect(sortedLots[1].quantity).toBe(5);
    });

    it('다른 제품의 Lot은 조회되지 않아야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const distributor = await createTestOrganization({ type: 'DISTRIBUTOR' });

      const product1 = await createTestProduct({
        organizationId: manufacturer.id,
        name: '제품1',
      });
      const product2 = await createTestProduct({
        organizationId: manufacturer.id,
        name: '제품2',
      });

      // 각 제품별 Lot 생성
      const lot1 = await createTestLot({ productId: product1.id, quantity: 10 });
      const lot2 = await createTestLot({ productId: product2.id, quantity: 5 });

      // 유통사에게 소유권 이전
      const codes1 = await getVirtualCodesByLot(lot1.id);
      const codes2 = await getVirtualCodesByLot(lot2.id);

      for (const code of [...codes1, ...codes2]) {
        await updateVirtualCodeOwner(code.id, 'ORGANIZATION', distributor.id);
      }

      // 제품1의 Lot만 조회
      const { data: lotInventory } = await adminClient.rpc('get_inventory_by_lot', {
        p_owner_id: distributor.id,
        p_product_id: product1.id,
      });

      expect(lotInventory.length).toBe(1);
      expect(lotInventory[0].lot_id).toBe(lot1.id);
    });
  });

  describe('재고 수량 조회 (getInventoryCount)', () => {
    it('RPC를 통해 특정 제품의 재고 수량을 조회할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const distributor = await createTestOrganization({ type: 'DISTRIBUTOR' });

      const product = await createTestProduct({ organizationId: manufacturer.id });

      // Lot 생성
      const lot = await createTestLot({ productId: product.id, quantity: 15 });

      // 유통사에게 소유권 이전
      const codes = await getVirtualCodesByLot(lot.id);
      for (const code of codes) {
        await updateVirtualCodeOwner(code.id, 'ORGANIZATION', distributor.id);
      }

      // 재고 수량 조회
      const { data: count, error } = await adminClient.rpc('get_inventory_count', {
        p_owner_id: distributor.id,
        p_product_id: product.id,
      });

      expect(error).toBeNull();
      expect(count).toBe(15);
    });

    it('재고가 없는 경우 0을 반환해야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const distributor = await createTestOrganization({ type: 'DISTRIBUTOR' });

      const product = await createTestProduct({ organizationId: manufacturer.id });

      // 재고 수량 조회 (재고 없음)
      const { data: count, error } = await adminClient.rpc('get_inventory_count', {
        p_owner_id: distributor.id,
        p_product_id: product.id,
      });

      expect(error).toBeNull();
      expect(count).toBe(0);
    });
  });

  describe('출고 가능 제품 조회', () => {
    it('재고가 있는 활성 제품만 조회되어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const distributor = await createTestOrganization({ type: 'DISTRIBUTOR' });

      // 활성 제품 (재고 있음)
      const activeProduct = await createTestProduct({
        organizationId: manufacturer.id,
        name: '활성 제품',
        isActive: true,
      });

      // 비활성 제품 (재고 있음)
      const inactiveProduct = await createTestProduct({
        organizationId: manufacturer.id,
        name: '비활성 제품',
        isActive: false,
      });

      // 활성 제품 (재고 없음)
      await createTestProduct({
        organizationId: manufacturer.id,
        name: '재고없는 제품',
        isActive: true,
      });

      // Lot 생성
      const lot1 = await createTestLot({ productId: activeProduct.id, quantity: 10 });
      const lot2 = await createTestLot({ productId: inactiveProduct.id, quantity: 5 });

      // 유통사에게 소유권 이전
      const codes1 = await getVirtualCodesByLot(lot1.id);
      const codes2 = await getVirtualCodesByLot(lot2.id);

      for (const code of [...codes1, ...codes2]) {
        await updateVirtualCodeOwner(code.id, 'ORGANIZATION', distributor.id);
      }

      // 재고가 있는 활성 제품 조회
      const { data: availableProducts } = await adminClient
        .from('products')
        .select('*')
        .eq('organization_id', manufacturer.id)
        .eq('is_active', true);

      // 이 중 실제 재고가 있는지 확인
      const productIds = availableProducts!.map((p) => p.id);

      const { data: inventory } = await adminClient
        .from('virtual_codes')
        .select(
          `
          lot:lots!inner(
            product_id
          )
        `
        )
        .eq('owner_id', distributor.id)
        .eq('owner_type', 'ORGANIZATION')
        .eq('status', 'IN_STOCK');

      const productsWithStock = new Set(
        inventory!.map((item) => (item.lot as { product_id: string }).product_id)
      );

      const availableForShipment = availableProducts!.filter((p) =>
        productsWithStock.has(p.id)
      );

      // 활성 제품 중 재고가 있는 것만
      expect(availableForShipment.length).toBe(1);
      expect(availableForShipment[0].name).toBe('활성 제품');
    });
  });

  describe('조직별 재고 격리', () => {
    it('다른 조직의 재고는 조회되지 않아야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const distributor1 = await createTestOrganization({
        type: 'DISTRIBUTOR',
        name: '유통사1',
      });
      const distributor2 = await createTestOrganization({
        type: 'DISTRIBUTOR',
        name: '유통사2',
      });

      const product = await createTestProduct({ organizationId: manufacturer.id });

      // Lot 생성 (20개)
      const lot = await createTestLot({ productId: product.id, quantity: 20 });
      const codes = await getVirtualCodesByLot(lot.id);

      // 유통사1에게 10개, 유통사2에게 10개
      for (let i = 0; i < 10; i++) {
        await updateVirtualCodeOwner(codes[i].id, 'ORGANIZATION', distributor1.id);
      }
      for (let i = 10; i < 20; i++) {
        await updateVirtualCodeOwner(codes[i].id, 'ORGANIZATION', distributor2.id);
      }

      // 유통사1 재고 조회
      const { data: dist1Inventory } = await adminClient
        .from('virtual_codes')
        .select('*')
        .eq('owner_id', distributor1.id)
        .eq('owner_type', 'ORGANIZATION')
        .eq('status', 'IN_STOCK');

      // 유통사2 재고 조회
      const { data: dist2Inventory } = await adminClient
        .from('virtual_codes')
        .select('*')
        .eq('owner_id', distributor2.id)
        .eq('owner_type', 'ORGANIZATION')
        .eq('status', 'IN_STOCK');

      expect(dist1Inventory!.length).toBe(10);
      expect(dist2Inventory!.length).toBe(10);

      // 서로의 재고가 섞이지 않았는지 확인
      const dist1Ids = new Set(dist1Inventory!.map((c) => c.id));
      const dist2Ids = new Set(dist2Inventory!.map((c) => c.id));

      for (const id of dist1Ids) {
        expect(dist2Ids.has(id)).toBe(false);
      }
    });
  });

  describe('get_inventory_summary DB 함수 테스트', () => {
    it('제품별 재고 요약을 정확히 집계해야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });

      // 제품 3개 생성
      const product1 = await createTestProduct({
        organizationId: manufacturer.id,
        name: '제품A',
      });
      const product2 = await createTestProduct({
        organizationId: manufacturer.id,
        name: '제품B',
      });
      const product3 = await createTestProduct({
        organizationId: manufacturer.id,
        name: '제품C',
      });

      // 각 제품별 Lot 생성 (여러 Lot에서 합산 테스트)
      await createTestLot({ productId: product1.id, quantity: 10 });
      await createTestLot({ productId: product1.id, quantity: 15 }); // 제품A 총 25개
      await createTestLot({ productId: product2.id, quantity: 8 }); // 제품B 8개
      await createTestLot({ productId: product3.id, quantity: 20 });
      await createTestLot({ productId: product3.id, quantity: 5 }); // 제품C 총 25개

      // DB 함수 호출
      const { data, error } = await adminClient.rpc('get_inventory_summary', {
        p_owner_id: manufacturer.id,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.length).toBe(3);

      // 제품별 수량 확인
      const productAData = data.find((d: { product_name: string }) => d.product_name === '제품A');
      const productBData = data.find((d: { product_name: string }) => d.product_name === '제품B');
      const productCData = data.find((d: { product_name: string }) => d.product_name === '제품C');

      expect(Number(productAData.quantity)).toBe(25);
      expect(Number(productBData.quantity)).toBe(8);
      expect(Number(productCData.quantity)).toBe(25);
    });

    it('재고가 없는 경우 빈 배열을 반환해야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });

      const { data, error } = await adminClient.rpc('get_inventory_summary', {
        p_owner_id: manufacturer.id,
      });

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it('USED 상태의 코드는 재고에서 제외해야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });

      const product = await createTestProduct({ organizationId: manufacturer.id });
      const lot = await createTestLot({ productId: product.id, quantity: 10 });

      // 5개를 USED로 변경
      const codes = await getVirtualCodesByLot(lot.id);
      for (let i = 0; i < 5; i++) {
        await adminClient
          .from('virtual_codes')
          .update({ status: 'USED' })
          .eq('id', codes[i].id);
      }

      const { data, error } = await adminClient.rpc('get_inventory_summary', {
        p_owner_id: manufacturer.id,
      });

      expect(error).toBeNull();
      expect(data.length).toBe(1);
      expect(Number(data[0].quantity)).toBe(5); // 10 - 5
    });

    it('다른 조직의 재고는 포함하지 않아야 한다', async () => {
      const manufacturer1 = await createTestOrganization({
        type: 'MANUFACTURER',
        name: '제조사1',
      });
      const manufacturer2 = await createTestOrganization({
        type: 'MANUFACTURER',
        name: '제조사2',
      });

      const product1 = await createTestProduct({
        organizationId: manufacturer1.id,
        name: '제조사1 제품',
      });
      const product2 = await createTestProduct({
        organizationId: manufacturer2.id,
        name: '제조사2 제품',
      });

      await createTestLot({ productId: product1.id, quantity: 100 });
      await createTestLot({ productId: product2.id, quantity: 50 });

      // 제조사1 재고만 조회
      const { data, error } = await adminClient.rpc('get_inventory_summary', {
        p_owner_id: manufacturer1.id,
      });

      expect(error).toBeNull();
      expect(data.length).toBe(1);
      expect(data[0].product_name).toBe('제조사1 제품');
      expect(Number(data[0].quantity)).toBe(100);
    });

    it('소유권 이전 후 새 소유자의 재고로 집계되어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const distributor = await createTestOrganization({ type: 'DISTRIBUTOR' });

      const product = await createTestProduct({ organizationId: manufacturer.id });
      const lot = await createTestLot({ productId: product.id, quantity: 30 });

      // 20개만 유통사에게 이전
      const codes = await getVirtualCodesByLot(lot.id);
      for (let i = 0; i < 20; i++) {
        await updateVirtualCodeOwner(codes[i].id, 'ORGANIZATION', distributor.id);
      }

      // 제조사 재고 확인 (10개 남음)
      const { data: manuData } = await adminClient.rpc('get_inventory_summary', {
        p_owner_id: manufacturer.id,
      });

      expect(Number(manuData[0].quantity)).toBe(10);

      // 유통사 재고 확인 (20개)
      const { data: distData } = await adminClient.rpc('get_inventory_summary', {
        p_owner_id: distributor.id,
      });

      expect(Number(distData[0].quantity)).toBe(20);
    });
  });

  describe('재고 관련 엣지케이스', () => {
    it('동일 제품의 여러 Lot에서 부분 사용 시 정확히 집계해야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });

      const product = await createTestProduct({ organizationId: manufacturer.id });

      // Lot 3개 생성
      const lot1 = await createTestLot({ productId: product.id, quantity: 10 });
      const lot2 = await createTestLot({ productId: product.id, quantity: 15 });
      const lot3 = await createTestLot({ productId: product.id, quantity: 20 });

      // 각 Lot에서 일부 사용
      const codes1 = await getVirtualCodesByLot(lot1.id);
      const codes2 = await getVirtualCodesByLot(lot2.id);
      const codes3 = await getVirtualCodesByLot(lot3.id);

      // lot1: 3개 사용 (7개 남음)
      for (let i = 0; i < 3; i++) {
        await adminClient.from('virtual_codes').update({ status: 'USED' }).eq('id', codes1[i].id);
      }

      // lot2: 10개 사용 (5개 남음)
      for (let i = 0; i < 10; i++) {
        await adminClient.from('virtual_codes').update({ status: 'USED' }).eq('id', codes2[i].id);
      }

      // lot3: 모두 사용 (0개 남음)
      for (const code of codes3) {
        await adminClient.from('virtual_codes').update({ status: 'USED' }).eq('id', code.id);
      }

      const { data, error } = await adminClient.rpc('get_inventory_summary', {
        p_owner_id: manufacturer.id,
      });

      expect(error).toBeNull();
      expect(data.length).toBe(1);
      expect(Number(data[0].quantity)).toBe(12); // 7 + 5 + 0
    });

    it('IN_STOCK 이외의 상태(USED/DISPOSED) 코드는 재고에서 제외해야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });

      const product = await createTestProduct({ organizationId: manufacturer.id });
      const lot = await createTestLot({ productId: product.id, quantity: 20 });

      const codes = await getVirtualCodesByLot(lot.id);

      // 5개를 USED 상태로 변경
      for (let i = 0; i < 5; i++) {
        await adminClient.from('virtual_codes').update({ status: 'USED' }).eq('id', codes[i].id);
      }

      // 5개를 DISPOSED 상태로 변경
      for (let i = 5; i < 10; i++) {
        await adminClient.from('virtual_codes').update({ status: 'DISPOSED' }).eq('id', codes[i].id);
      }

      // 제조사 재고 (IN_STOCK만 카운트되어야 함)
      const { data } = await adminClient.rpc('get_inventory_summary', {
        p_owner_id: manufacturer.id,
      });

      expect(Number(data[0].quantity)).toBe(10); // 20 - 5 (USED) - 5 (DISPOSED)
    });

    it('같은 제품 다른 Lot 번호를 정확히 합산해야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });

      const product = await createTestProduct({
        organizationId: manufacturer.id,
        name: '특정 제품',
      });

      // 날짜를 다르게 해서 Lot 번호가 다르게 생성되도록
      await createTestLot({
        productId: product.id,
        quantity: 50,
        manufactureDate: '2025-01-01',
      });
      await createTestLot({
        productId: product.id,
        quantity: 30,
        manufactureDate: '2025-02-01',
      });
      await createTestLot({
        productId: product.id,
        quantity: 20,
        manufactureDate: '2025-03-01',
      });

      const { data, error } = await adminClient.rpc('get_inventory_summary', {
        p_owner_id: manufacturer.id,
      });

      expect(error).toBeNull();
      expect(data.length).toBe(1);
      expect(data[0].product_name).toBe('특정 제품');
      expect(Number(data[0].quantity)).toBe(100); // 50 + 30 + 20
    });

    it('소유권 연쇄 이전 시 최종 소유자의 재고로 집계해야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const distributor = await createTestOrganization({ type: 'DISTRIBUTOR' });
      const hospital = await createTestOrganization({ type: 'HOSPITAL' });

      const product = await createTestProduct({ organizationId: manufacturer.id });
      const lot = await createTestLot({ productId: product.id, quantity: 10 });

      const codes = await getVirtualCodesByLot(lot.id);

      // 제조사 -> 유통사 -> 병원 순으로 이전
      for (const code of codes) {
        await updateVirtualCodeOwner(code.id, 'ORGANIZATION', distributor.id);
      }
      for (const code of codes) {
        await updateVirtualCodeOwner(code.id, 'ORGANIZATION', hospital.id);
      }

      // 제조사 재고: 0
      const { data: manuData } = await adminClient.rpc('get_inventory_summary', {
        p_owner_id: manufacturer.id,
      });
      expect(manuData).toEqual([]);

      // 유통사 재고: 0
      const { data: distData } = await adminClient.rpc('get_inventory_summary', {
        p_owner_id: distributor.id,
      });
      expect(distData).toEqual([]);

      // 병원 재고: 10
      const { data: hospData } = await adminClient.rpc('get_inventory_summary', {
        p_owner_id: hospital.id,
      });
      expect(hospData.length).toBe(1);
      expect(Number(hospData[0].quantity)).toBe(10);
    });

    it('존재하지 않는 조직 ID로 조회 시 빈 배열을 반환해야 한다', async () => {
      const fakeOrgId = '99999999-9999-9999-9999-999999999999';

      const { data, error } = await adminClient.rpc('get_inventory_summary', {
        p_owner_id: fakeOrgId,
      });

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it('제품이 비활성화되어도 기존 재고는 유지되어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });

      const product = await createTestProduct({
        organizationId: manufacturer.id,
        isActive: true,
      });
      await createTestLot({ productId: product.id, quantity: 10 });

      // 제품 비활성화
      await adminClient.from('products').update({ is_active: false }).eq('id', product.id);

      // 재고는 여전히 존재해야 함
      const { data, error } = await adminClient.rpc('get_inventory_summary', {
        p_owner_id: manufacturer.id,
      });

      expect(error).toBeNull();
      expect(data.length).toBe(1);
      expect(Number(data[0].quantity)).toBe(10);
    });
  });

  describe('경계값 테스트', () => {
    it('수량이 1인 최소 재고를 정확히 집계해야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });

      const product = await createTestProduct({ organizationId: manufacturer.id });
      await createTestLot({ productId: product.id, quantity: 1 });

      const { data, error } = await adminClient.rpc('get_inventory_summary', {
        p_owner_id: manufacturer.id,
      });

      expect(error).toBeNull();
      expect(data.length).toBe(1);
      expect(Number(data[0].quantity)).toBe(1);
    });

    it('대량 재고(1000개 이상)를 정확히 집계해야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });

      const product = await createTestProduct({ organizationId: manufacturer.id });

      // 1000개씩 2번 생성하여 2000개 테스트
      await createTestLot({ productId: product.id, quantity: 1000 });
      await createTestLot({ productId: product.id, quantity: 1000 });

      const { data, error } = await adminClient.rpc('get_inventory_summary', {
        p_owner_id: manufacturer.id,
      });

      expect(error).toBeNull();
      expect(data.length).toBe(1);
      expect(Number(data[0].quantity)).toBe(2000);
    });

    it('여러 제품에 걸쳐 총합이 정확해야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });

      // 10개 제품, 각각 100개씩
      const products = [];
      for (let i = 0; i < 10; i++) {
        const product = await createTestProduct({
          organizationId: manufacturer.id,
          name: `제품${i}`,
        });
        products.push(product);
        await createTestLot({ productId: product.id, quantity: 100 });
      }

      const { data, error } = await adminClient.rpc('get_inventory_summary', {
        p_owner_id: manufacturer.id,
      });

      expect(error).toBeNull();
      expect(data.length).toBe(10);

      const totalQuantity = data.reduce(
        (sum: number, item: { quantity: number }) => sum + Number(item.quantity),
        0
      );
      expect(totalQuantity).toBe(1000); // 10 * 100
    });
  });
});
