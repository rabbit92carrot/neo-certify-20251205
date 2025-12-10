/**
 * 테스트 데이터 정리 헬퍼
 * 테스트 후 생성된 데이터를 정리합니다.
 */
import { createTestAdminClient } from './supabase-test-client';

/**
 * 특정 조직과 관련된 모든 데이터 삭제
 */
export async function cleanupOrganizationData(organizationId: string): Promise<void> {
  const adminClient = createTestAdminClient();

  // 1. Notification Messages 삭제
  await adminClient
    .from('notification_messages')
    .delete()
    .or(`id.is.not.null`); // 환자 전화번호 기반이라 조직 연결 어려움

  // 2. Histories 삭제 (from/to organization)
  await adminClient
    .from('histories')
    .delete()
    .or(`from_owner_id.eq.${organizationId},to_owner_id.eq.${organizationId}`);

  // 3. Shipment Details 삭제 (배치를 통해)
  const { data: batches } = await adminClient
    .from('shipment_batches')
    .select('id')
    .or(`from_organization_id.eq.${organizationId},to_organization_id.eq.${organizationId}`);

  if (batches && batches.length > 0) {
    const batchIds = batches.map((b) => b.id);

    await adminClient
      .from('shipment_details')
      .delete()
      .in('shipment_batch_id', batchIds);

    // 4. Shipment Batches 삭제
    await adminClient
      .from('shipment_batches')
      .delete()
      .in('id', batchIds);
  }

  // 5. Treatment Details & Records 삭제
  const { data: treatments } = await adminClient
    .from('treatment_records')
    .select('id')
    .eq('hospital_id', organizationId);

  if (treatments && treatments.length > 0) {
    const treatmentIds = treatments.map((t) => t.id);

    await adminClient
      .from('treatment_details')
      .delete()
      .in('treatment_id', treatmentIds);

    await adminClient
      .from('treatment_records')
      .delete()
      .in('id', treatmentIds);
  }

  // 6. Virtual Codes 삭제 (products -> lots -> virtual_codes)
  const { data: products } = await adminClient
    .from('products')
    .select('id')
    .eq('organization_id', organizationId);

  if (products && products.length > 0) {
    const productIds = products.map((p) => p.id);

    const { data: lots } = await adminClient
      .from('lots')
      .select('id')
      .in('product_id', productIds);

    if (lots && lots.length > 0) {
      const lotIds = lots.map((l) => l.id);

      await adminClient
        .from('virtual_codes')
        .delete()
        .in('lot_id', lotIds);

      // 7. Lots 삭제
      await adminClient
        .from('lots')
        .delete()
        .in('id', lotIds);
    }

    // 8. Products 삭제
    await adminClient
      .from('products')
      .delete()
      .in('id', productIds);
  }

  // 9. Manufacturer Settings 삭제
  await adminClient
    .from('manufacturer_settings')
    .delete()
    .eq('organization_id', organizationId);

  // 10. Organization 삭제
  await adminClient
    .from('organizations')
    .delete()
    .eq('id', organizationId);
}

/**
 * 특정 Auth 사용자와 관련된 모든 데이터 삭제
 */
export async function cleanupAuthUserData(userId: string): Promise<void> {
  const adminClient = createTestAdminClient();

  // 1. 조직 데이터 삭제
  await cleanupOrganizationData(userId);

  // 2. Auth 사용자 삭제
  await adminClient.auth.admin.deleteUser(userId);
}

/**
 * 테스트 이메일 패턴으로 생성된 모든 데이터 삭제
 */
export async function cleanupTestEmailPattern(pattern: string = 'test_'): Promise<void> {
  const adminClient = createTestAdminClient();

  // 테스트 패턴으로 시작하는 이메일의 조직 찾기
  const { data: orgs } = await adminClient
    .from('organizations')
    .select('id, email')
    .like('email', `${pattern}%`);

  if (orgs) {
    for (const org of orgs) {
      await cleanupOrganizationData(org.id);
    }
  }

  // Auth 사용자도 삭제
  const { data: authData } = await adminClient.auth.admin.listUsers();
  if (authData?.users) {
    for (const user of authData.users) {
      if (user.email?.startsWith(pattern)) {
        await adminClient.auth.admin.deleteUser(user.id);
      }
    }
  }
}

/**
 * 전체 테스트 데이터 초기화 (시드 데이터 제외)
 * 주의: 이 함수는 시드 데이터를 제외한 모든 데이터를 삭제합니다.
 */
export async function resetTestDatabase(): Promise<void> {
  // 시드 데이터 이메일 목록 (보존)
  const seedEmails = [
    'admin@neocert.com',
    'manufacturer@neocert.com',
    'distributor@neocert.com',
    'hospital@neocert.com',
  ];

  const adminClient = createTestAdminClient();

  // 시드 데이터가 아닌 조직 찾기
  const { data: orgs } = await adminClient
    .from('organizations')
    .select('id, email')
    .not('email', 'in', `(${seedEmails.join(',')})`);

  if (orgs) {
    for (const org of orgs) {
      await cleanupOrganizationData(org.id);
    }
  }
}

/**
 * 특정 Lot과 관련된 데이터 삭제
 */
export async function cleanupLotData(lotId: string): Promise<void> {
  const adminClient = createTestAdminClient();

  // 1. Virtual Codes 관련 Histories 삭제
  const { data: codes } = await adminClient
    .from('virtual_codes')
    .select('id')
    .eq('lot_id', lotId);

  if (codes && codes.length > 0) {
    const codeIds = codes.map((c) => c.id);

    // Shipment Details 삭제
    await adminClient
      .from('shipment_details')
      .delete()
      .in('virtual_code_id', codeIds);

    // Treatment Details 삭제
    await adminClient
      .from('treatment_details')
      .delete()
      .in('virtual_code_id', codeIds);

    // Histories 삭제
    await adminClient
      .from('histories')
      .delete()
      .in('virtual_code_id', codeIds);

    // Virtual Codes 삭제
    await adminClient
      .from('virtual_codes')
      .delete()
      .in('id', codeIds);
  }

  // 2. Lot 삭제
  await adminClient
    .from('lots')
    .delete()
    .eq('id', lotId);
}

/**
 * 특정 시간 이전에 생성된 테스트 데이터 삭제
 */
export async function cleanupOldTestData(beforeDate: Date): Promise<void> {
  const adminClient = createTestAdminClient();
  const dateStr = beforeDate.toISOString();

  // 테스트 패턴 이메일 중 오래된 것 삭제
  const { data: orgs } = await adminClient
    .from('organizations')
    .select('id, email')
    .like('email', 'test_%')
    .lt('created_at', dateStr);

  if (orgs) {
    for (const org of orgs) {
      await cleanupOrganizationData(org.id);
    }
  }
}
