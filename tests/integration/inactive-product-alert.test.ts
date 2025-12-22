/**
 * 비활성 제품 알림 통합 테스트
 *
 * 비활성 제품 출고/시술 시 로그 기록 및 알림 생성을 테스트합니다.
 * log_inactive_product_usage DB 함수를 직접 호출하여 테스트합니다.
 */
import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import {
  createTestAdminClient,
  createTestOrganization,
  createTestInactiveProduct,
  createTestProduct,
  createTestLot,
  getOrganizationAlerts,
  getInactiveProductUsageLogs,
  cleanupAllTestData,
  cleanupOrganizationAlerts,
  cleanupInactiveProductUsageLogs,
  generateTestUUID,
} from '../helpers';

describe('비활성 제품 알림 통합 테스트', () => {
  const adminClient = createTestAdminClient();

  // 테스트 데이터
  let adminOrg: Awaited<ReturnType<typeof createTestOrganization>>;
  let manufacturerOrg: Awaited<ReturnType<typeof createTestOrganization>>;
  let distributorOrg: Awaited<ReturnType<typeof createTestOrganization>>;
  let hospitalOrg: Awaited<ReturnType<typeof createTestOrganization>>;

  beforeEach(async () => {
    // 이전 테스트에서 남은 테스트 조직 관련 알림 정리
    // 다른 테스트에서 삭제된 ADMIN 조직을 참조하는 알림이 FK 위반을 일으킬 수 있음
    const { data: staleOrgs } = await adminClient
      .from('organizations')
      .select('id')
      .like('email', 'test_%');

    if (staleOrgs && staleOrgs.length > 0) {
      const staleOrgIds = staleOrgs.map((o) => o.id);
      // 연관된 알림 먼저 삭제
      await adminClient
        .from('organization_alerts')
        .delete()
        .in('recipient_org_id', staleOrgIds);
    }

    // 테스트 조직 생성
    adminOrg = await createTestOrganization({ type: 'ADMIN', status: 'ACTIVE' });
    manufacturerOrg = await createTestOrganization({ type: 'MANUFACTURER', status: 'ACTIVE' });
    distributorOrg = await createTestOrganization({ type: 'DISTRIBUTOR', status: 'ACTIVE' });
    hospitalOrg = await createTestOrganization({ type: 'HOSPITAL', status: 'ACTIVE' });
  });

  afterEach(async () => {
    // 테스트 데이터 정리
    const orgIds = [adminOrg?.id, manufacturerOrg?.id, distributorOrg?.id, hospitalOrg?.id].filter(Boolean);
    await cleanupOrganizationAlerts(orgIds);
    await cleanupAllTestData();
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  describe('log_inactive_product_usage DB 함수', () => {
    it('비활성 제품 사용 시 로그가 기록되어야 한다', async () => {
      // 비활성 제품 생성
      const inactiveProduct = await createTestInactiveProduct({
        organizationId: manufacturerOrg.id,
        deactivationReason: 'DISCONTINUED',
        name: '단종된 제품',
      });

      // log_inactive_product_usage 호출
      const fakeShipmentId = generateTestUUID();
      const { error } = await adminClient.rpc('log_inactive_product_usage', {
        p_usage_type: 'SHIPMENT',
        p_usage_id: fakeShipmentId,
        p_product_id: inactiveProduct.id,
        p_organization_id: distributorOrg.id,
        p_quantity: 5,
      });

      expect(error).toBeNull();

      // 로그 확인
      const logs = await getInactiveProductUsageLogs({ productId: inactiveProduct.id });
      expect(logs.length).toBeGreaterThanOrEqual(1);

      const log = logs[0];
      expect(log.usage_type).toBe('SHIPMENT');
      expect(log.usage_id).toBe(fakeShipmentId);
      expect(log.product_id).toBe(inactiveProduct.id);
      expect(log.organization_id).toBe(distributorOrg.id);
      expect(log.quantity).toBe(5);
      expect(log.deactivation_reason).toBe('DISCONTINUED');
    });

    it('비활성 제품 사용 시 관리자에게 알림이 생성되어야 한다', async () => {
      // 비활성 제품 생성
      const inactiveProduct = await createTestInactiveProduct({
        organizationId: manufacturerOrg.id,
        deactivationReason: 'DISCONTINUED',
      });

      // log_inactive_product_usage 호출
      const fakeShipmentId = generateTestUUID();
      await adminClient.rpc('log_inactive_product_usage', {
        p_usage_type: 'SHIPMENT',
        p_usage_id: fakeShipmentId,
        p_product_id: inactiveProduct.id,
        p_organization_id: distributorOrg.id,
        p_quantity: 3,
      });

      // 관리자 알림 확인 (productId로 해당 알림 찾기)
      const adminAlerts = await getOrganizationAlerts(adminOrg.id, {
        alertType: 'INACTIVE_PRODUCT_USAGE',
      });

      const alert = adminAlerts.find(a =>
        (a.metadata as { productId?: string })?.productId === inactiveProduct.id
      );

      expect(alert).toBeDefined();
      expect(alert?.alert_type).toBe('INACTIVE_PRODUCT_USAGE');
      expect(alert?.title).toBe('비활성 제품 사용 감지');
      expect(alert?.is_read).toBe(false);
    });

    it('비활성 제품 사용 시 제조사에게 알림이 생성되어야 한다', async () => {
      // 비활성 제품 생성
      const inactiveProduct = await createTestInactiveProduct({
        organizationId: manufacturerOrg.id,
        deactivationReason: 'QUALITY_ISSUE',
      });

      // log_inactive_product_usage 호출
      const fakeShipmentId = generateTestUUID();
      await adminClient.rpc('log_inactive_product_usage', {
        p_usage_type: 'SHIPMENT',
        p_usage_id: fakeShipmentId,
        p_product_id: inactiveProduct.id,
        p_organization_id: distributorOrg.id,
        p_quantity: 2,
      });

      // 제조사 알림 확인
      const manufacturerAlerts = await getOrganizationAlerts(manufacturerOrg.id, {
        alertType: 'INACTIVE_PRODUCT_USAGE',
      });

      expect(manufacturerAlerts.length).toBeGreaterThanOrEqual(1);

      const alert = manufacturerAlerts[0];
      expect(alert.alert_type).toBe('INACTIVE_PRODUCT_USAGE');
      expect(alert.recipient_org_id).toBe(manufacturerOrg.id);
    });

    it('활성 제품 사용 시 로그가 기록되지 않아야 한다', async () => {
      // 활성 제품 생성
      const activeProduct = await createTestProduct({
        organizationId: manufacturerOrg.id,
        isActive: true,
      });

      // 초기 로그 수 확인
      const initialLogs = await getInactiveProductUsageLogs({ productId: activeProduct.id });
      const initialCount = initialLogs.length;

      // log_inactive_product_usage 호출
      const fakeShipmentId = generateTestUUID();
      await adminClient.rpc('log_inactive_product_usage', {
        p_usage_type: 'SHIPMENT',
        p_usage_id: fakeShipmentId,
        p_product_id: activeProduct.id,
        p_organization_id: distributorOrg.id,
        p_quantity: 5,
      });

      // 로그 확인 - 활성 제품은 로그 생성 안 됨
      const afterLogs = await getInactiveProductUsageLogs({ productId: activeProduct.id });
      expect(afterLogs.length).toBe(initialCount);
    });
  });

  describe('비활성화 사유별 알림 제목', () => {
    it('SAFETY_ISSUE는 "[긴급] 안전 문제 제품 사용 감지" 제목이어야 한다', async () => {
      const inactiveProduct = await createTestInactiveProduct({
        organizationId: manufacturerOrg.id,
        deactivationReason: 'SAFETY_ISSUE',
      });

      const fakeShipmentId = generateTestUUID();
      await adminClient.rpc('log_inactive_product_usage', {
        p_usage_type: 'SHIPMENT',
        p_usage_id: fakeShipmentId,
        p_product_id: inactiveProduct.id,
        p_organization_id: distributorOrg.id,
        p_quantity: 1,
      });

      const alerts = await getOrganizationAlerts(adminOrg.id, {
        alertType: 'INACTIVE_PRODUCT_USAGE',
      });

      const safetyAlert = alerts.find(a =>
        (a.metadata as { productId?: string })?.productId === inactiveProduct.id
      );
      expect(safetyAlert?.title).toBe('[긴급] 안전 문제 제품 사용 감지');
    });

    it('QUALITY_ISSUE는 "[주의] 품질 문제 제품 사용 감지" 제목이어야 한다', async () => {
      const inactiveProduct = await createTestInactiveProduct({
        organizationId: manufacturerOrg.id,
        deactivationReason: 'QUALITY_ISSUE',
      });

      const fakeShipmentId = generateTestUUID();
      await adminClient.rpc('log_inactive_product_usage', {
        p_usage_type: 'SHIPMENT',
        p_usage_id: fakeShipmentId,
        p_product_id: inactiveProduct.id,
        p_organization_id: distributorOrg.id,
        p_quantity: 1,
      });

      const alerts = await getOrganizationAlerts(adminOrg.id, {
        alertType: 'INACTIVE_PRODUCT_USAGE',
      });

      const qualityAlert = alerts.find(a =>
        (a.metadata as { productId?: string })?.productId === inactiveProduct.id
      );
      expect(qualityAlert?.title).toBe('[주의] 품질 문제 제품 사용 감지');
    });

    it('DISCONTINUED는 "비활성 제품 사용 감지" 제목이어야 한다', async () => {
      const inactiveProduct = await createTestInactiveProduct({
        organizationId: manufacturerOrg.id,
        deactivationReason: 'DISCONTINUED',
      });

      const fakeShipmentId = generateTestUUID();
      await adminClient.rpc('log_inactive_product_usage', {
        p_usage_type: 'SHIPMENT',
        p_usage_id: fakeShipmentId,
        p_product_id: inactiveProduct.id,
        p_organization_id: distributorOrg.id,
        p_quantity: 1,
      });

      const alerts = await getOrganizationAlerts(adminOrg.id, {
        alertType: 'INACTIVE_PRODUCT_USAGE',
      });

      const discontinuedAlert = alerts.find(a =>
        (a.metadata as { productId?: string })?.productId === inactiveProduct.id
      );
      expect(discontinuedAlert?.title).toBe('비활성 제품 사용 감지');
    });
  });

  describe('시술(TREATMENT) 시나리오', () => {
    it('시술 시 비활성 제품 사용하면 로그와 알림이 생성되어야 한다', async () => {
      // 비활성 제품 생성
      const inactiveProduct = await createTestInactiveProduct({
        organizationId: manufacturerOrg.id,
        deactivationReason: 'DISCONTINUED',
      });

      // log_inactive_product_usage 호출 (시술)
      const fakeTreatmentId = generateTestUUID();
      await adminClient.rpc('log_inactive_product_usage', {
        p_usage_type: 'TREATMENT',
        p_usage_id: fakeTreatmentId,
        p_product_id: inactiveProduct.id,
        p_organization_id: hospitalOrg.id,
        p_quantity: 2,
      });

      // 로그 확인
      const logs = await getInactiveProductUsageLogs({
        productId: inactiveProduct.id,
        usageType: 'TREATMENT',
      });

      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0].usage_type).toBe('TREATMENT');
      expect(logs[0].organization_id).toBe(hospitalOrg.id);

      // 관리자 알림 확인
      const adminAlerts = await getOrganizationAlerts(adminOrg.id, {
        alertType: 'INACTIVE_PRODUCT_USAGE',
      });

      const treatmentAlert = adminAlerts.find(a =>
        (a.metadata as { usageType?: string })?.usageType === 'TREATMENT' &&
        (a.metadata as { productId?: string })?.productId === inactiveProduct.id
      );
      expect(treatmentAlert).toBeDefined();
    });
  });

  describe('알림 메타데이터 검증', () => {
    it('알림 메타데이터에 필수 정보가 포함되어야 한다', async () => {
      const inactiveProduct = await createTestInactiveProduct({
        organizationId: manufacturerOrg.id,
        deactivationReason: 'QUALITY_ISSUE',
        name: '품질문제 제품',
      });

      const fakeShipmentId = generateTestUUID();
      await adminClient.rpc('log_inactive_product_usage', {
        p_usage_type: 'SHIPMENT',
        p_usage_id: fakeShipmentId,
        p_product_id: inactiveProduct.id,
        p_organization_id: distributorOrg.id,
        p_quantity: 10,
      });

      const alerts = await getOrganizationAlerts(adminOrg.id, {
        alertType: 'INACTIVE_PRODUCT_USAGE',
      });

      const alert = alerts.find(a =>
        (a.metadata as { productId?: string })?.productId === inactiveProduct.id
      );
      expect(alert).toBeDefined();

      const metadata = alert?.metadata as {
        productId: string;
        productName: string;
        usageType: string;
        usageId: string;
        quantity: number;
        organizationId: string;
        organizationName: string;
        deactivationReason: string;
      };

      expect(metadata.productId).toBe(inactiveProduct.id);
      expect(metadata.productName).toBe('품질문제 제품');
      expect(metadata.usageType).toBe('SHIPMENT');
      expect(metadata.usageId).toBe(fakeShipmentId);
      expect(metadata.quantity).toBe(10);
      expect(metadata.organizationId).toBe(distributorOrg.id);
      expect(metadata.deactivationReason).toBe('QUALITY_ISSUE');
    });
  });

  describe('다중 비활성 제품 테스트', () => {
    it('여러 비활성 제품 사용 시 각각 로그가 기록되어야 한다', async () => {
      // 비활성 제품 2개 생성
      const inactiveProduct1 = await createTestInactiveProduct({
        organizationId: manufacturerOrg.id,
        deactivationReason: 'DISCONTINUED',
        name: '단종 제품 1',
      });

      const inactiveProduct2 = await createTestInactiveProduct({
        organizationId: manufacturerOrg.id,
        deactivationReason: 'SAFETY_ISSUE',
        name: '안전문제 제품 2',
      });

      const fakeShipmentId = generateTestUUID();

      // 두 제품 각각 로그 생성
      await adminClient.rpc('log_inactive_product_usage', {
        p_usage_type: 'SHIPMENT',
        p_usage_id: fakeShipmentId,
        p_product_id: inactiveProduct1.id,
        p_organization_id: distributorOrg.id,
        p_quantity: 5,
      });

      await adminClient.rpc('log_inactive_product_usage', {
        p_usage_type: 'SHIPMENT',
        p_usage_id: fakeShipmentId,
        p_product_id: inactiveProduct2.id,
        p_organization_id: distributorOrg.id,
        p_quantity: 3,
      });

      // 로그 확인
      const logs1 = await getInactiveProductUsageLogs({ productId: inactiveProduct1.id });
      const logs2 = await getInactiveProductUsageLogs({ productId: inactiveProduct2.id });

      expect(logs1.length).toBeGreaterThanOrEqual(1);
      expect(logs2.length).toBeGreaterThanOrEqual(1);

      // 관리자 알림 개수 확인
      const adminAlerts = await getOrganizationAlerts(adminOrg.id, {
        alertType: 'INACTIVE_PRODUCT_USAGE',
      });

      // 각 제품에 대한 알림이 있어야 함
      const alertForProduct1 = adminAlerts.find(a =>
        (a.metadata as { productId?: string })?.productId === inactiveProduct1.id
      );
      const alertForProduct2 = adminAlerts.find(a =>
        (a.metadata as { productId?: string })?.productId === inactiveProduct2.id
      );

      expect(alertForProduct1).toBeDefined();
      expect(alertForProduct2).toBeDefined();

      // 각각 다른 제목
      expect(alertForProduct1?.title).toBe('비활성 제품 사용 감지');
      expect(alertForProduct2?.title).toBe('[긴급] 안전 문제 제품 사용 감지');
    });
  });
});
