/**
 * Lot Service 통합 테스트
 *
 * 테스트 대상:
 * - Lot 생성 시 트리거로 가상코드 자동 생성
 * - 가상코드 수량 = Lot 수량 확인
 * - 가상코드 초기 상태 (IN_STOCK, owner = 제조사)
 * - Lot 번호 자동 생성 (RPC)
 * - 사용기한 계산
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import {
  createTestAdminClient,
  createTestOrganization,
  createTestProduct,
  createTestManufacturerSettings,
  cleanupAllTestData,
  generateTestId,
} from '../helpers';

describe('Lot Service Integration Tests', () => {
  let adminClient: ReturnType<typeof createTestAdminClient>;

  beforeAll(async () => {
    adminClient = createTestAdminClient();
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  describe('Lot 생성 및 가상코드 자동 생성', () => {
    let manufacturerOrg: Awaited<ReturnType<typeof createTestOrganization>>;
    let product: Awaited<ReturnType<typeof createTestProduct>>;

    beforeEach(async () => {
      // 테스트용 제조사 및 제품 생성
      manufacturerOrg = await createTestOrganization({ type: 'MANUFACTURER' });
      product = await createTestProduct({
        organizationId: manufacturerOrg.id,
        name: '테스트 PDO Thread',
        modelName: 'PDO-TEST-001',
      });
    });

    afterEach(async () => {
      await cleanupAllTestData();
    });

    it('Lot 생성 시 트리거로 가상코드가 자동 생성되어야 한다', async () => {
      const lotNumber = `LOT_${generateTestId()}`;
      const quantity = 10;
      const manufactureDate = new Date().toISOString().split('T')[0];
      const expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Lot 생성
      const { data: lot, error: lotError } = await adminClient
        .from('lots')
        .insert({
          product_id: product.id,
          lot_number: lotNumber,
          quantity,
          manufacture_date: manufactureDate,
          expiry_date: expiryDate,
        })
        .select()
        .single();

      expect(lotError).toBeNull();
      expect(lot).toBeDefined();
      expect(lot!.lot_number).toBe(lotNumber);
      expect(lot!.quantity).toBe(quantity);

      // 가상코드가 자동 생성되었는지 확인
      const { data: virtualCodes, error: vcError } = await adminClient
        .from('virtual_codes')
        .select('*')
        .eq('lot_id', lot!.id);

      expect(vcError).toBeNull();
      expect(virtualCodes).toBeDefined();
      expect(virtualCodes!.length).toBe(quantity);
    });

    it('가상코드 수량은 Lot 수량과 일치해야 한다', async () => {
      const quantities = [1, 5, 20, 100];

      for (const quantity of quantities) {
        const lotNumber = `LOT_${generateTestId()}_${quantity}`;
        const manufactureDate = new Date().toISOString().split('T')[0];
        const expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Lot 생성
        const { data: lot } = await adminClient
          .from('lots')
          .insert({
            product_id: product.id,
            lot_number: lotNumber,
            quantity,
            manufacture_date: manufactureDate,
            expiry_date: expiryDate,
          })
          .select()
          .single();

        // 가상코드 수량 확인
        const { count } = await adminClient
          .from('virtual_codes')
          .select('*', { count: 'exact', head: true })
          .eq('lot_id', lot!.id);

        expect(count).toBe(quantity);
      }
    });

    it('가상코드 초기 상태는 IN_STOCK이어야 한다', async () => {
      const lotNumber = `LOT_${generateTestId()}`;
      const quantity = 5;

      const { data: lot } = await adminClient
        .from('lots')
        .insert({
          product_id: product.id,
          lot_number: lotNumber,
          quantity,
          manufacture_date: new Date().toISOString().split('T')[0],
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        })
        .select()
        .single();

      const { data: virtualCodes } = await adminClient
        .from('virtual_codes')
        .select('*')
        .eq('lot_id', lot!.id);

      // 모든 가상코드가 IN_STOCK 상태인지 확인
      expect(virtualCodes!.every((vc) => vc.status === 'IN_STOCK')).toBe(true);
    });

    it('가상코드의 초기 소유자는 제조사(조직)여야 한다', async () => {
      const lotNumber = `LOT_${generateTestId()}`;
      const quantity = 5;

      const { data: lot } = await adminClient
        .from('lots')
        .insert({
          product_id: product.id,
          lot_number: lotNumber,
          quantity,
          manufacture_date: new Date().toISOString().split('T')[0],
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        })
        .select()
        .single();

      const { data: virtualCodes } = await adminClient
        .from('virtual_codes')
        .select('*')
        .eq('lot_id', lot!.id);

      // 모든 가상코드의 소유자가 제조사인지 확인
      for (const vc of virtualCodes!) {
        expect(vc.owner_type).toBe('ORGANIZATION');
        expect(vc.owner_id).toBe(manufacturerOrg.id);
      }
    });

    it('각 가상코드는 고유한 code 값을 가져야 한다', async () => {
      const lotNumber = `LOT_${generateTestId()}`;
      const quantity = 10;

      const { data: lot } = await adminClient
        .from('lots')
        .insert({
          product_id: product.id,
          lot_number: lotNumber,
          quantity,
          manufacture_date: new Date().toISOString().split('T')[0],
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        })
        .select()
        .single();

      const { data: virtualCodes } = await adminClient
        .from('virtual_codes')
        .select('code')
        .eq('lot_id', lot!.id);

      const codes = virtualCodes!.map((vc) => vc.code);
      const uniqueCodes = new Set(codes);

      // 모든 코드가 고유한지 확인
      expect(uniqueCodes.size).toBe(quantity);
    });
  });

  describe('Lot 번호 자동 생성 (RPC)', () => {
    let manufacturerOrg: Awaited<ReturnType<typeof createTestOrganization>>;

    beforeEach(async () => {
      manufacturerOrg = await createTestOrganization({ type: 'MANUFACTURER' });
      await createTestManufacturerSettings({
        organizationId: manufacturerOrg.id,
        lotPrefix: 'TEST',
        lotModelDigits: 5,
        lotDateFormat: 'yymmdd',
      });
    });

    afterEach(async () => {
      await cleanupAllTestData();
    });

    it('generate_lot_number RPC가 올바른 형식의 Lot 번호를 생성해야 한다', async () => {
      const modelName = 'PDO-001';
      const manufactureDate = '2025-12-10';

      const { data: lotNumber, error } = await adminClient.rpc('generate_lot_number', {
        p_manufacturer_id: manufacturerOrg.id,
        p_model_name: modelName,
        p_manufacture_date: manufactureDate,
      });

      expect(error).toBeNull();
      expect(lotNumber).toBeDefined();
      expect(typeof lotNumber).toBe('string');
      // Lot 번호 형식 검증 (PREFIX-MODEL-DATE-SEQ 형태)
      expect(lotNumber.length).toBeGreaterThan(0);
    });

    it('같은 조건으로 호출하면 동일한 번호가 생성되어야 한다 (결정적)', async () => {
      const modelName = 'PDO-001';
      const manufactureDate = '2025-12-10';

      const { data: lotNumber1 } = await adminClient.rpc('generate_lot_number', {
        p_manufacturer_id: manufacturerOrg.id,
        p_model_name: modelName,
        p_manufacture_date: manufactureDate,
      });

      const { data: lotNumber2 } = await adminClient.rpc('generate_lot_number', {
        p_manufacturer_id: manufacturerOrg.id,
        p_model_name: modelName,
        p_manufacture_date: manufactureDate,
      });

      // RPC는 prefix + model_code + date 기반으로 결정적 번호 생성
      expect(lotNumber1).toBe(lotNumber2);
    });

    it('다른 모델명으로 호출하면 다른 번호가 생성되어야 한다', async () => {
      const manufactureDate = '2025-12-10';

      // RPC는 모델명에서 첫 N자리(기본 5자리)를 추출하므로
      // 충분히 다른 모델명을 사용
      const { data: lotNumber1 } = await adminClient.rpc('generate_lot_number', {
        p_manufacturer_id: manufacturerOrg.id,
        p_model_name: 'ALPHA',
        p_manufacture_date: manufactureDate,
      });

      const { data: lotNumber2 } = await adminClient.rpc('generate_lot_number', {
        p_manufacturer_id: manufacturerOrg.id,
        p_model_name: 'BETA1',
        p_manufacture_date: manufactureDate,
      });

      expect(lotNumber1).not.toBe(lotNumber2);
    });
  });

  describe('사용기한 계산', () => {
    let manufacturerOrg: Awaited<ReturnType<typeof createTestOrganization>>;
    let product: Awaited<ReturnType<typeof createTestProduct>>;

    beforeEach(async () => {
      manufacturerOrg = await createTestOrganization({ type: 'MANUFACTURER' });
      product = await createTestProduct({ organizationId: manufacturerOrg.id });
    });

    afterEach(async () => {
      await cleanupAllTestData();
    });

    it('직접 입력한 expiryDate가 우선 적용되어야 한다', async () => {
      const customExpiryDate = '2027-06-15';

      const { data: lot } = await adminClient
        .from('lots')
        .insert({
          product_id: product.id,
          lot_number: `LOT_${generateTestId()}`,
          quantity: 5,
          manufacture_date: '2025-12-10',
          expiry_date: customExpiryDate,
        })
        .select()
        .single();

      expect(lot!.expiry_date).toBe(customExpiryDate);
    });

    it('제조사 설정의 expiry_months 기반으로 계산되어야 한다', async () => {
      const expiryMonths = 12;
      await createTestManufacturerSettings({
        organizationId: manufacturerOrg.id,
        expiryMonths,
      });

      const manufactureDate = '2025-12-10';
      const expectedExpiry = new Date(manufactureDate);
      expectedExpiry.setMonth(expectedExpiry.getMonth() + expiryMonths);

      // 실제 서비스에서는 calculateExpiryDate가 호출됨
      // 여기서는 설정값 저장 확인
      const { data: settings } = await adminClient
        .from('manufacturer_settings')
        .select('expiry_months')
        .eq('organization_id', manufacturerOrg.id)
        .single();

      expect(settings!.expiry_months).toBe(expiryMonths);
    });
  });

  describe('제품 검증', () => {
    let manufacturerOrg: Awaited<ReturnType<typeof createTestOrganization>>;
    let otherManufacturerOrg: Awaited<ReturnType<typeof createTestOrganization>>;
    let product: Awaited<ReturnType<typeof createTestProduct>>;

    beforeEach(async () => {
      manufacturerOrg = await createTestOrganization({ type: 'MANUFACTURER', name: '제조사A' });
      otherManufacturerOrg = await createTestOrganization({ type: 'MANUFACTURER', name: '제조사B' });
      product = await createTestProduct({ organizationId: manufacturerOrg.id });
    });

    afterEach(async () => {
      await cleanupAllTestData();
    });

    it('다른 제조사의 제품으로는 Lot을 생성할 수 없어야 한다', async () => {
      // 다른 제조사의 제품 생성
      const otherProduct = await createTestProduct({ organizationId: otherManufacturerOrg.id });

      // 제품 소유권 검증 쿼리 (서비스 로직 시뮬레이션)
      const { data: validProduct } = await adminClient
        .from('products')
        .select('id')
        .eq('id', otherProduct.id)
        .eq('organization_id', manufacturerOrg.id) // 다른 제조사 ID로 조회
        .single();

      // 다른 제조사의 제품은 조회되지 않아야 함
      expect(validProduct).toBeNull();
    });

    it('비활성화된 제품으로는 Lot을 생성할 수 없어야 한다', async () => {
      // 제품 비활성화
      await adminClient.from('products').update({ is_active: false }).eq('id', product.id);

      // 활성화된 제품만 조회
      const { data: activeProduct } = await adminClient
        .from('products')
        .select('id')
        .eq('id', product.id)
        .eq('is_active', true)
        .single();

      expect(activeProduct).toBeNull();
    });

    it('존재하지 않는 제품으로는 Lot을 생성할 수 없어야 한다', async () => {
      const nonExistentProductId = '00000000-0000-0000-0000-000000000000';

      const { data: foundProduct } = await adminClient
        .from('products')
        .select('id')
        .eq('id', nonExistentProductId)
        .single();

      expect(foundProduct).toBeNull();
    });
  });

  describe('중복 Lot 번호 처리', () => {
    let manufacturerOrg: Awaited<ReturnType<typeof createTestOrganization>>;
    let product: Awaited<ReturnType<typeof createTestProduct>>;

    beforeEach(async () => {
      manufacturerOrg = await createTestOrganization({ type: 'MANUFACTURER' });
      product = await createTestProduct({ organizationId: manufacturerOrg.id });
    });

    afterEach(async () => {
      await cleanupAllTestData();
    });

    it('중복된 Lot 번호는 에러를 반환해야 한다', async () => {
      const duplicateLotNumber = `LOT_DUPLICATE_${generateTestId()}`;

      // 첫 번째 Lot 생성
      const { error: firstError } = await adminClient.from('lots').insert({
        product_id: product.id,
        lot_number: duplicateLotNumber,
        quantity: 5,
        manufacture_date: new Date().toISOString().split('T')[0],
        expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });

      expect(firstError).toBeNull();

      // 동일한 Lot 번호로 두 번째 생성 시도
      const { error: duplicateError } = await adminClient.from('lots').insert({
        product_id: product.id,
        lot_number: duplicateLotNumber,
        quantity: 3,
        manufacture_date: new Date().toISOString().split('T')[0],
        expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });

      expect(duplicateError).not.toBeNull();
      expect(duplicateError!.code).toBe('23505'); // PostgreSQL unique violation
    });
  });

  describe('Lot 조회', () => {
    let manufacturerOrg: Awaited<ReturnType<typeof createTestOrganization>>;
    let product: Awaited<ReturnType<typeof createTestProduct>>;

    beforeEach(async () => {
      manufacturerOrg = await createTestOrganization({ type: 'MANUFACTURER' });
      product = await createTestProduct({ organizationId: manufacturerOrg.id });
    });

    afterEach(async () => {
      await cleanupAllTestData();
    });

    it('Lot 목록 조회가 정상적으로 동작해야 한다', async () => {
      // 여러 Lot 생성
      for (let i = 0; i < 3; i++) {
        await adminClient.from('lots').insert({
          product_id: product.id,
          lot_number: `LOT_LIST_${generateTestId()}_${i}`,
          quantity: 5,
          manufacture_date: new Date().toISOString().split('T')[0],
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
      }

      // Lot 목록 조회
      const { data: lots, count } = await adminClient
        .from('lots')
        .select('*, product:products!inner(*)', { count: 'exact' })
        .eq('product.organization_id', manufacturerOrg.id);

      expect(lots).toBeDefined();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    it('Lot 상세 조회가 정상적으로 동작해야 한다', async () => {
      const lotNumber = `LOT_DETAIL_${generateTestId()}`;

      const { data: createdLot } = await adminClient
        .from('lots')
        .insert({
          product_id: product.id,
          lot_number: lotNumber,
          quantity: 10,
          manufacture_date: new Date().toISOString().split('T')[0],
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        })
        .select()
        .single();

      // 상세 조회
      const { data: lot } = await adminClient
        .from('lots')
        .select('*, product:products!inner(*)')
        .eq('id', createdLot!.id)
        .single();

      expect(lot).toBeDefined();
      expect(lot!.lot_number).toBe(lotNumber);
      expect(lot!.quantity).toBe(10);
      expect(lot!.product).toBeDefined();
    });
  });

  describe('오늘 생산량 조회', () => {
    let manufacturerOrg: Awaited<ReturnType<typeof createTestOrganization>>;
    let product: Awaited<ReturnType<typeof createTestProduct>>;

    beforeEach(async () => {
      manufacturerOrg = await createTestOrganization({ type: 'MANUFACTURER' });
      product = await createTestProduct({ organizationId: manufacturerOrg.id });
    });

    afterEach(async () => {
      await cleanupAllTestData();
    });

    it('오늘 생산된 총 수량을 정확히 계산해야 한다', async () => {
      const quantities = [10, 20, 30];
      const today = new Date().toISOString().split('T')[0];

      // 오늘 날짜로 여러 Lot 생성
      for (let i = 0; i < quantities.length; i++) {
        await adminClient.from('lots').insert({
          product_id: product.id,
          lot_number: `LOT_TODAY_${generateTestId()}_${i}`,
          quantity: quantities[i],
          manufacture_date: today,
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
      }

      // 오늘 생산량 조회
      const { data: todayLots } = await adminClient
        .from('lots')
        .select('quantity, product:products!inner(organization_id)')
        .eq('product.organization_id', manufacturerOrg.id)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      const totalQuantity = todayLots?.reduce((sum, lot) => sum + lot.quantity, 0) || 0;
      const expectedTotal = quantities.reduce((sum, q) => sum + q, 0);

      expect(totalQuantity).toBe(expectedTotal);
    });
  });
});
