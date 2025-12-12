/**
 * Product Service 통합 테스트
 *
 * 제품 CRUD, 활성/비활성화 등을 테스트합니다.
 * 실제 Supabase 로컬 인스턴스를 사용합니다.
 */
import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import {
  createTestAdminClient,
  createTestOrganization,
  createTestProduct,
  cleanupAllTestData,
  generateTestId,
} from '../helpers';

describe('Product Service Integration Tests', () => {
  const adminClient = createTestAdminClient();

  afterEach(async () => {
    await cleanupAllTestData();
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  describe('제품 생성 (createProduct)', () => {
    it('제품이 정상적으로 생성되어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });

      const { data: product, error } = await adminClient
        .from('products')
        .insert({
          organization_id: manufacturer.id,
          name: 'PDO 실',
          udi_di: generateTestId('UDI'),
          model_name: 'PDO-001',
          is_active: true,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(product).toBeDefined();
      expect(product?.name).toBe('PDO 실');
      expect(product?.is_active).toBe(true);
    });

    it('같은 제조사 내 UDI-DI 중복 시 에러가 발생해야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const udiDi = generateTestId('UDI');

      // 첫 번째 제품 생성
      await adminClient.from('products').insert({
        organization_id: manufacturer.id,
        name: '제품1',
        udi_di: udiDi,
        model_name: 'MODEL-001',
      });

      // 중복 UDI-DI로 두 번째 제품 생성 시도
      const { error } = await adminClient
        .from('products')
        .insert({
          organization_id: manufacturer.id,
          name: '제품2',
          udi_di: udiDi, // 중복
          model_name: 'MODEL-002',
        })
        .select()
        .single();

      expect(error).toBeDefined();
      expect(error?.code).toBe('23505'); // unique_violation
    });

    it('다른 제조사의 같은 UDI-DI는 허용되어야 한다', async () => {
      const manufacturer1 = await createTestOrganization({ type: 'MANUFACTURER' });
      const manufacturer2 = await createTestOrganization({ type: 'MANUFACTURER' });
      const udiDi = generateTestId('UDI');

      // 제조사1 제품
      const { error: error1 } = await adminClient.from('products').insert({
        organization_id: manufacturer1.id,
        name: '제품1',
        udi_di: udiDi,
        model_name: 'MODEL-001',
      });

      // 제조사2 같은 UDI-DI 제품
      const { error: error2 } = await adminClient.from('products').insert({
        organization_id: manufacturer2.id,
        name: '제품1',
        udi_di: udiDi,
        model_name: 'MODEL-001',
      });

      expect(error1).toBeNull();
      expect(error2).toBeNull();
    });
  });

  describe('제품 조회', () => {
    let manufacturer: Awaited<ReturnType<typeof createTestOrganization>>;

    beforeEach(async () => {
      manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
    });

    it('제품 목록을 조회할 수 있어야 한다', async () => {
      // 제품 3개 생성
      await createTestProduct({ organizationId: manufacturer.id, name: '제품1' });
      await createTestProduct({ organizationId: manufacturer.id, name: '제품2' });
      await createTestProduct({ organizationId: manufacturer.id, name: '제품3' });

      const { data: products } = await adminClient
        .from('products')
        .select('*')
        .eq('organization_id', manufacturer.id);

      expect(products).toHaveLength(3);
    });

    it('활성 제품만 필터링할 수 있어야 한다', async () => {
      const product1 = await createTestProduct({ organizationId: manufacturer.id });
      await createTestProduct({ organizationId: manufacturer.id });

      // 하나를 비활성화
      await adminClient
        .from('products')
        .update({ is_active: false })
        .eq('id', product1.id);

      const { data: activeProducts } = await adminClient
        .from('products')
        .select('*')
        .eq('organization_id', manufacturer.id)
        .eq('is_active', true);

      expect(activeProducts).toHaveLength(1);
    });

    it('검색어로 제품을 필터링할 수 있어야 한다', async () => {
      await createTestProduct({ organizationId: manufacturer.id, name: 'PDO 실 30G' });
      await createTestProduct({ organizationId: manufacturer.id, name: 'PLLA 필러' });
      await createTestProduct({ organizationId: manufacturer.id, name: 'HA 필러' });

      // PDO 검색
      const { data: pdoProducts } = await adminClient
        .from('products')
        .select('*')
        .eq('organization_id', manufacturer.id)
        .ilike('name', '%PDO%');

      expect(pdoProducts).toHaveLength(1);
      expect(pdoProducts?.[0].name).toContain('PDO');

      // 필러 검색
      const { data: fillerProducts } = await adminClient
        .from('products')
        .select('*')
        .eq('organization_id', manufacturer.id)
        .ilike('name', '%필러%');

      expect(fillerProducts).toHaveLength(2);
    });

    it('제품 상세 조회가 정상적으로 동작해야 한다', async () => {
      const product = await createTestProduct({
        organizationId: manufacturer.id,
        name: '테스트 제품',
      });

      const { data: foundProduct } = await adminClient
        .from('products')
        .select('*')
        .eq('id', product.id)
        .eq('organization_id', manufacturer.id)
        .single();

      expect(foundProduct).toBeDefined();
      expect(foundProduct?.name).toBe('테스트 제품');
    });

    it('다른 제조사의 제품은 조회할 수 없어야 한다', async () => {
      const otherManufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const product = await createTestProduct({ organizationId: otherManufacturer.id });

      // 다른 제조사 ID로 조회 시도
      const { data: foundProduct } = await adminClient
        .from('products')
        .select('*')
        .eq('id', product.id)
        .eq('organization_id', manufacturer.id)
        .single();

      expect(foundProduct).toBeNull();
    });
  });

  describe('제품 수정 (updateProduct)', () => {
    it('제품 이름을 수정할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const product = await createTestProduct({
        organizationId: manufacturer.id,
        name: '원래 이름',
      });

      // 이름 수정
      await adminClient
        .from('products')
        .update({ name: '변경된 이름' })
        .eq('id', product.id);

      const { data: updatedProduct } = await adminClient
        .from('products')
        .select('name')
        .eq('id', product.id)
        .single();

      expect(updatedProduct?.name).toBe('변경된 이름');
    });

    it('UDI-DI를 수정할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const product = await createTestProduct({ organizationId: manufacturer.id });

      const newUdiDi = generateTestId('NEW_UDI');

      await adminClient
        .from('products')
        .update({ udi_di: newUdiDi })
        .eq('id', product.id);

      const { data: updatedProduct } = await adminClient
        .from('products')
        .select('udi_di')
        .eq('id', product.id)
        .single();

      expect(updatedProduct?.udi_di).toBe(newUdiDi);
    });
  });

  describe('제품 활성화/비활성화', () => {
    it('제품을 비활성화할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const product = await createTestProduct({ organizationId: manufacturer.id });

      // 초기 상태 확인
      expect(product.is_active).toBe(true);

      // 비활성화
      await adminClient
        .from('products')
        .update({ is_active: false })
        .eq('id', product.id);

      const { data: updatedProduct } = await adminClient
        .from('products')
        .select('is_active')
        .eq('id', product.id)
        .single();

      expect(updatedProduct?.is_active).toBe(false);
    });

    it('비활성화된 제품을 다시 활성화할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const product = await createTestProduct({ organizationId: manufacturer.id });

      // 비활성화
      await adminClient
        .from('products')
        .update({ is_active: false })
        .eq('id', product.id);

      // 다시 활성화
      await adminClient
        .from('products')
        .update({ is_active: true })
        .eq('id', product.id);

      const { data: updatedProduct } = await adminClient
        .from('products')
        .select('is_active')
        .eq('id', product.id)
        .single();

      expect(updatedProduct?.is_active).toBe(true);
    });
  });
});
