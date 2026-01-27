/**
 * Dashboard Service 통합 테스트
 *
 * 대시보드 통계 조회 기능을 테스트합니다.
 * 실제 Supabase 로컬 인스턴스를 사용합니다.
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

describe('Dashboard Service Integration Tests', () => {
  const adminClient = createTestAdminClient();

  afterEach(async () => {
    await cleanupAllTestData();
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  describe('제조사 대시보드 통계', () => {
    it('총 재고량을 조회할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const product = await createTestProduct({ organizationId: manufacturer.id });

      // Lot 생성 (총 15개 재고)
      await createTestLot({ productId: product.id, quantity: 10 });
      await createTestLot({ productId: product.id, quantity: 5 });

      // 재고 조회 (IN_STOCK 상태이고 제조사 소유)
      const { count } = await adminClient
        .from('virtual_codes')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', manufacturer.id)
        .eq('status', 'IN_STOCK');

      expect(count).toBe(15);
    });

    it('활성 제품 수를 조회할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });

      // 활성 제품 3개, 비활성 제품 1개
      await createTestProduct({ organizationId: manufacturer.id, isActive: true });
      await createTestProduct({ organizationId: manufacturer.id, isActive: true });
      await createTestProduct({ organizationId: manufacturer.id, isActive: true });
      await createTestProduct({ organizationId: manufacturer.id, isActive: false });

      const { count } = await adminClient
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', manufacturer.id)
        .eq('is_active', true);

      expect(count).toBe(3);
    });
  });

  describe('유통사 대시보드 통계', () => {
    it('총 재고량을 조회할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const distributor = await createTestOrganization({ type: 'DISTRIBUTOR' });

      const product = await createTestProduct({ organizationId: manufacturer.id });
      const lot = await createTestLot({ productId: product.id, quantity: 10 });
      const codes = await getVirtualCodesByLot(lot.id);

      // 유통사에게 소유권 이전
      for (const code of codes) {
        await updateVirtualCodeOwner(code.id, 'ORGANIZATION', distributor.id);
      }

      // 유통사 재고 조회
      const { count } = await adminClient
        .from('virtual_codes')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', distributor.id)
        .eq('status', 'IN_STOCK');

      expect(count).toBe(10);
    });
  });

  describe('병원 대시보드 통계', () => {
    it('총 재고량과 환자 수를 조회할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const hospital = await createTestOrganization({ type: 'HOSPITAL' });

      const product = await createTestProduct({ organizationId: manufacturer.id });
      const lot = await createTestLot({ productId: product.id, quantity: 10 });
      const codes = await getVirtualCodesByLot(lot.id);

      // 병원에게 소유권 이전
      for (const code of codes) {
        await updateVirtualCodeOwner(code.id, 'ORGANIZATION', hospital.id);
      }

      // 병원 재고 조회
      const { count: inventoryCount } = await adminClient
        .from('virtual_codes')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', hospital.id)
        .eq('status', 'IN_STOCK');

      expect(inventoryCount).toBe(10);

      // 환자 시술 기록 생성
      const phone1 = `010${Math.floor(10000000 + Math.random() * 90000000)}`;
      const phone2 = `010${Math.floor(10000000 + Math.random() * 90000000)}`;

      const { data: treatment1 } = await adminClient
        .from('treatment_records')
        .insert({
          hospital_id: hospital.id,
          patient_phone: phone1,
          treatment_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      trackTestData('treatmentRecords', treatment1!.id);

      const { data: treatment2 } = await adminClient
        .from('treatment_records')
        .insert({
          hospital_id: hospital.id,
          patient_phone: phone2,
          treatment_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      trackTestData('treatmentRecords', treatment2!.id);

      // 같은 환자 한 번 더 (중복 안 됨)
      const { data: treatment3 } = await adminClient
        .from('treatment_records')
        .insert({
          hospital_id: hospital.id,
          patient_phone: phone1, // 중복
          treatment_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      trackTestData('treatmentRecords', treatment3!.id);

      // 고유 환자 수 조회
      const { data: treatments } = await adminClient
        .from('treatment_records')
        .select('patient_phone')
        .eq('hospital_id', hospital.id);

      const uniquePatients = new Set(treatments?.map((t) => t.patient_phone));
      expect(uniquePatients.size).toBe(2); // 2명의 고유 환자
    });
  });

  describe('관리자 대시보드 통계', () => {
    it('전체 조직 수를 조회할 수 있어야 한다', async () => {
      // 조직 3개 생성
      await createTestOrganization({ type: 'MANUFACTURER' });
      await createTestOrganization({ type: 'DISTRIBUTOR' });
      await createTestOrganization({ type: 'HOSPITAL' });

      const { count } = await adminClient
        .from('organizations')
        .select('id', { count: 'exact', head: true });

      // 최소 3개 이상 (기존 데이터 포함)
      expect(count).toBeGreaterThanOrEqual(3);
    });

    it('승인 대기 조직 수를 조회할 수 있어야 한다', async () => {
      // 승인 대기 조직 2개 생성
      await createTestOrganization({ type: 'MANUFACTURER', status: 'PENDING_APPROVAL' });
      await createTestOrganization({ type: 'DISTRIBUTOR', status: 'PENDING_APPROVAL' });
      // 활성 조직 1개 생성
      await createTestOrganization({ type: 'HOSPITAL', status: 'ACTIVE' });

      const { count } = await adminClient
        .from('organizations')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'PENDING_APPROVAL');

      expect(count).toBeGreaterThanOrEqual(2);
    });

    it('전체 가상 코드 수를 조회할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const product = await createTestProduct({ organizationId: manufacturer.id });

      const lot = await createTestLot({ productId: product.id, quantity: 20 });

      // 특정 lot 스코프로 한정하여 다른 테스트 파일의 잔여 데이터 간섭 방지
      const { count } = await adminClient
        .from('virtual_codes')
        .select('id', { count: 'exact', head: true })
        .eq('lot_id', lot.id);

      expect(count).toBe(20);
    });
  });
});
