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

  // ============================================================================
  // 검증 로직 테스트 (DB 레벨 - 서비스 로직 시뮬레이션)
  // 참고: 서비스 함수는 Next.js 쿠키 컨텍스트 필요하므로, 동일한 검증 로직을 DB 레벨에서 테스트
  // ============================================================================

  describe('UDI-DI 전역 고유성 검증 로직', () => {
    it('다른 조직에서 동일한 UDI-DI가 있으면 쿼리로 탐지해야 한다', async () => {
      const manufacturer1 = await createTestOrganization({ type: 'MANUFACTURER' });
      const manufacturer2 = await createTestOrganization({ type: 'MANUFACTURER' });
      const udiDi = generateTestId('GLOBAL_UDI');

      // 제조사1에서 제품 생성
      await adminClient.from('products').insert({
        organization_id: manufacturer1.id,
        name: '제품1',
        udi_di: udiDi,
        model_name: 'MODEL-001',
      });

      // 전역 UDI-DI 중복 검사 쿼리 (서비스 로직과 동일)
      const { data: existingUdi } = await adminClient
        .from('products')
        .select('id')
        .eq('udi_di', udiDi)
        .limit(1)
        .maybeSingle();

      // 다른 조직이라도 전역으로 탐지되어야 함
      expect(existingUdi).not.toBeNull();
    });
  });

  describe('모델명 조직 내 고유성 검증 로직', () => {
    it('동일 조직 내 같은 모델명의 활성 제품이 있으면 탐지해야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const modelName = 'DUPLICATE-MODEL';

      // 활성 제품 생성
      await adminClient.from('products').insert({
        organization_id: manufacturer.id,
        name: '제품1',
        udi_di: generateTestId('UDI1'),
        model_name: modelName,
        is_active: true,
      });

      // 모델명 중복 검사 쿼리 (서비스 로직과 동일)
      const { data: existingModel } = await adminClient
        .from('products')
        .select('id')
        .eq('organization_id', manufacturer.id)
        .eq('model_name', modelName)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      expect(existingModel).not.toBeNull();
    });

    it('다른 조직의 같은 모델명은 탐지되지 않아야 한다', async () => {
      const manufacturer1 = await createTestOrganization({ type: 'MANUFACTURER' });
      const manufacturer2 = await createTestOrganization({ type: 'MANUFACTURER' });
      const modelName = 'SAME-MODEL';

      // 제조사1 제품
      await adminClient.from('products').insert({
        organization_id: manufacturer1.id,
        name: '제품1',
        udi_di: generateTestId('UDI1'),
        model_name: modelName,
        is_active: true,
      });

      // 제조사2에서 모델명 중복 검사 (해당 조직 범위)
      const { data: existingModel } = await adminClient
        .from('products')
        .select('id')
        .eq('organization_id', manufacturer2.id) // 다른 조직
        .eq('model_name', modelName)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      // 다른 조직이므로 탐지되지 않아야 함
      expect(existingModel).toBeNull();
    });

    it('비활성 제품의 모델명은 중복으로 탐지되지 않아야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const modelName = 'REUSABLE-MODEL';

      // 비활성 제품
      await adminClient.from('products').insert({
        organization_id: manufacturer.id,
        name: '비활성 제품',
        udi_di: generateTestId('UDI1'),
        model_name: modelName,
        is_active: false,
      });

      // 활성 제품만 검사하는 쿼리
      const { data: existingModel } = await adminClient
        .from('products')
        .select('id')
        .eq('organization_id', manufacturer.id)
        .eq('model_name', modelName)
        .eq('is_active', true) // 활성만
        .limit(1)
        .maybeSingle();

      // 비활성이므로 탐지되지 않아야 함
      expect(existingModel).toBeNull();
    });
  });

  describe('수정 시 자기 자신 제외 검증 로직', () => {
    it('수정 시 자기 자신의 ID를 제외한 중복 검사가 동작해야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });

      // 제품 생성
      const { data: product } = await adminClient
        .from('products')
        .insert({
          organization_id: manufacturer.id,
          name: '제품',
          udi_di: generateTestId('SELF_UDI'),
          model_name: 'SELF-MODEL',
          is_active: true,
        })
        .select()
        .single();

      // 자기 자신 제외 중복 검사 (서비스 로직과 동일)
      const { data: duplicate } = await adminClient
        .from('products')
        .select('id')
        .eq('organization_id', manufacturer.id)
        .eq('model_name', product!.model_name)
        .eq('is_active', true)
        .neq('id', product!.id) // 자기 자신 제외
        .limit(1)
        .maybeSingle();

      // 자기 자신만 있으므로 중복 없음
      expect(duplicate).toBeNull();
    });
  });

  describe('재활성화 검증 로직', () => {
    it('동일 모델명의 활성 제품이 있으면 재활성화 전 탐지해야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const modelName = 'REACTIVATE-MODEL';

      // 비활성 제품
      const { data: inactiveProduct } = await adminClient
        .from('products')
        .insert({
          organization_id: manufacturer.id,
          name: '비활성 제품',
          udi_di: generateTestId('INACTIVE_UDI'),
          model_name: modelName,
          is_active: false,
        })
        .select()
        .single();

      // 동일 모델명의 활성 제품
      await adminClient.from('products').insert({
        organization_id: manufacturer.id,
        name: '활성 제품',
        udi_di: generateTestId('ACTIVE_UDI'),
        model_name: modelName,
        is_active: true,
      });

      // 재활성화 전 검사 (서비스 로직과 동일)
      const { data: existingActive } = await adminClient
        .from('products')
        .select('id')
        .eq('organization_id', manufacturer.id)
        .eq('model_name', modelName)
        .eq('is_active', true)
        .neq('id', inactiveProduct!.id)
        .limit(1)
        .maybeSingle();

      // 다른 활성 제품이 탐지되어야 함
      expect(existingActive).not.toBeNull();
    });

    it('동일 모델명의 활성 제품이 없으면 재활성화 가능해야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const modelName = 'SAFE-MODEL';

      // 비활성 제품만 있음
      const { data: product } = await adminClient
        .from('products')
        .insert({
          organization_id: manufacturer.id,
          name: '제품',
          udi_di: generateTestId('SAFE_UDI'),
          model_name: modelName,
          is_active: false,
        })
        .select()
        .single();

      // 재활성화 전 검사
      const { data: existingActive } = await adminClient
        .from('products')
        .select('id')
        .eq('organization_id', manufacturer.id)
        .eq('model_name', modelName)
        .eq('is_active', true)
        .neq('id', product!.id)
        .limit(1)
        .maybeSingle();

      // 활성 제품 없음
      expect(existingActive).toBeNull();

      // 재활성화 수행
      await adminClient
        .from('products')
        .update({ is_active: true })
        .eq('id', product!.id);

      const { data: reactivated } = await adminClient
        .from('products')
        .select('is_active')
        .eq('id', product!.id)
        .single();

      expect(reactivated?.is_active).toBe(true);
    });
  });
});
