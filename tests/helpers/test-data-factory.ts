/**
 * 테스트 데이터 생성 헬퍼
 * 통합 테스트에서 사용할 테스트 데이터를 생성합니다.
 */
import { createTestAdminClient } from './supabase-test-client';
import type { Database } from '@/types/database.types';

type OrganizationType = Database['public']['Enums']['organization_type'];
type OrganizationStatus = Database['public']['Enums']['organization_status'];
type VirtualCodeStatus = Database['public']['Enums']['virtual_code_status'];

// 테스트 데이터 ID 추적 (정리용)
const createdIds = {
  organizations: [] as string[],
  products: [] as string[],
  lots: [] as string[],
  virtualCodes: [] as string[],
  shipmentBatches: [] as string[],
  treatmentRecords: [] as string[],
  patients: [] as string[],
  authUsers: [] as string[],
  manufacturerSettings: [] as string[],
  notifications: [] as string[],
};

// 고유 조직명 생성을 위한 전역 카운터
let orgNameCounter = 0;

/**
 * 고유한 테스트 ID 생성 (문자열)
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 고유한 UUID 생성
 */
export function generateTestUUID(): string {
  return crypto.randomUUID();
}

/**
 * 고유한 이메일 생성
 */
export function generateTestEmail(): string {
  return `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}@test.com`;
}

/**
 * 고유한 사업자등록번호 생성 (10자리 숫자)
 */
export function generateTestBusinessNumber(): string {
  const num = Math.floor(1000000000 + Math.random() * 9000000000);
  return num.toString();
}

/**
 * 고유한 전화번호 생성
 */
export function generateTestPhoneNumber(): string {
  const num = Math.floor(10000000 + Math.random() * 90000000);
  return `010${num}`;
}

// ============================================================
// 조직 생성
// ============================================================

export interface CreateTestOrganizationOptions {
  type?: OrganizationType;
  status?: OrganizationStatus;
  email?: string;
  businessNumber?: string;
  name?: string;
}

/**
 * 테스트용 조직 생성 (Auth 계정 없이 DB만)
 */
export async function createTestOrganization(
  options: CreateTestOrganizationOptions = {}
): Promise<Database['public']['Tables']['organizations']['Row']> {
  const adminClient = createTestAdminClient();

  const orgData = {
    id: generateTestUUID(),
    type: options.type || 'MANUFACTURER',
    email: options.email || generateTestEmail(),
    business_number: options.businessNumber || generateTestBusinessNumber(),
    business_license_file: '/test/license.pdf',
    name: options.name || `테스트조직_${Date.now()}_${++orgNameCounter}_${Math.random().toString(36).substring(2, 7)}`,
    representative_name: '테스트대표',
    representative_contact: '01012345678',
    address: '서울시 테스트구 테스트동',
    status: options.status || 'ACTIVE',
  };

  const { data, error } = await adminClient
    .from('organizations')
    .insert(orgData)
    .select()
    .single();

  if (error) {
    throw new Error(`테스트 조직 생성 실패: ${error.message}`);
  }

  createdIds.organizations.push(data.id);
  return data;
}

/**
 * 테스트용 조직 + Auth 계정 생성
 */
export async function createTestOrganizationWithAuth(
  options: CreateTestOrganizationOptions & { password?: string } = {}
): Promise<{
  organization: Database['public']['Tables']['organizations']['Row'];
  userId: string;
  email: string;
  password: string;
}> {
  const adminClient = createTestAdminClient();
  const email = options.email || generateTestEmail();
  const password = options.password || 'testPassword123!';

  // 1. Auth 사용자 생성
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      organization_type: options.type || 'MANUFACTURER',
    },
  });

  if (authError || !authData.user) {
    throw new Error(`테스트 Auth 계정 생성 실패: ${authError?.message}`);
  }

  createdIds.authUsers.push(authData.user.id);

  // 2. 조직 생성 (Auth ID를 조직 ID로 사용)
  const orgData = {
    id: authData.user.id,
    type: options.type || 'MANUFACTURER',
    email,
    business_number: options.businessNumber || generateTestBusinessNumber(),
    business_license_file: '/test/license.pdf',
    name: options.name || `테스트조직_${Date.now()}_${++orgNameCounter}_${Math.random().toString(36).substring(2, 7)}`,
    representative_name: '테스트대표',
    representative_contact: '01012345678',
    address: '서울시 테스트구 테스트동',
    status: options.status || 'ACTIVE',
  };

  const { data: orgDataResult, error: orgError } = await adminClient
    .from('organizations')
    .insert(orgData)
    .select()
    .single();

  if (orgError) {
    // 롤백: Auth 사용자 삭제
    await adminClient.auth.admin.deleteUser(authData.user.id);
    throw new Error(`테스트 조직 생성 실패: ${orgError.message}`);
  }

  createdIds.organizations.push(orgDataResult.id);

  return {
    organization: orgDataResult,
    userId: authData.user.id,
    email,
    password,
  };
}

// ============================================================
// 제품 생성
// ============================================================

export interface CreateTestProductOptions {
  organizationId: string;
  name?: string;
  udiDi?: string;
  modelName?: string;
  isActive?: boolean;
}

/**
 * 테스트용 제품 생성
 */
export async function createTestProduct(
  options: CreateTestProductOptions
): Promise<Database['public']['Tables']['products']['Row']> {
  const adminClient = createTestAdminClient();

  const productData = {
    organization_id: options.organizationId,
    name: options.name || `테스트제품_${Date.now()}`,
    udi_di: options.udiDi || `UDI_${generateTestId()}`,
    model_name: options.modelName || `MODEL_${generateTestId()}`,
    is_active: options.isActive ?? true,
  };

  const { data, error } = await adminClient
    .from('products')
    .insert(productData)
    .select()
    .single();

  if (error) {
    throw new Error(`테스트 제품 생성 실패: ${error.message}`);
  }

  createdIds.products.push(data.id);
  return data;
}

// ============================================================
// Lot 생성
// ============================================================

export interface CreateTestLotOptions {
  productId: string;
  quantity?: number;
  lotNumber?: string;
  manufactureDate?: string;
  expiryDate?: string;
}

/**
 * 테스트용 Lot 생성 (트리거로 가상코드 자동 생성됨)
 */
export async function createTestLot(
  options: CreateTestLotOptions
): Promise<Database['public']['Tables']['lots']['Row']> {
  const adminClient = createTestAdminClient();

  const today = new Date();
  const expiryDate = new Date(today);
  expiryDate.setMonth(expiryDate.getMonth() + 24);

  const lotData = {
    product_id: options.productId,
    lot_number: options.lotNumber || `LOT_${generateTestId()}`,
    quantity: options.quantity || 10,
    manufacture_date: options.manufactureDate || today.toISOString().split('T')[0],
    expiry_date: options.expiryDate || expiryDate.toISOString().split('T')[0],
  };

  const { data, error } = await adminClient
    .from('lots')
    .insert(lotData)
    .select()
    .single();

  if (error) {
    throw new Error(`테스트 Lot 생성 실패: ${error.message}`);
  }

  createdIds.lots.push(data.id);
  return data;
}

// ============================================================
// 가상 코드 조회/수정
// ============================================================

/**
 * Lot에 속한 가상 코드 조회
 */
export async function getVirtualCodesByLot(
  lotId: string
): Promise<Database['public']['Tables']['virtual_codes']['Row'][]> {
  const adminClient = createTestAdminClient();

  const { data, error } = await adminClient
    .from('virtual_codes')
    .select('*')
    .eq('lot_id', lotId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`가상 코드 조회 실패: ${error.message}`);
  }

  return data;
}

/**
 * 가상 코드 소유권 변경
 */
export async function updateVirtualCodeOwner(
  codeId: string,
  ownerType: Database['public']['Enums']['owner_type'],
  ownerId: string,
  status?: VirtualCodeStatus
): Promise<void> {
  const adminClient = createTestAdminClient();

  const updateData: Record<string, unknown> = {
    owner_type: ownerType,
    owner_id: ownerId,
  };

  if (status) {
    updateData.status = status;
  }

  const { error } = await adminClient
    .from('virtual_codes')
    .update(updateData)
    .eq('id', codeId);

  if (error) {
    throw new Error(`가상 코드 업데이트 실패: ${error.message}`);
  }
}

// ============================================================
// 제조사 설정
// ============================================================

export interface CreateTestManufacturerSettingsOptions {
  organizationId: string;
  lotPrefix?: string;
  lotModelDigits?: number;
  lotDateFormat?: string;
  expiryMonths?: number;
}

/**
 * 테스트용 제조사 설정 생성 (upsert)
 */
export async function createTestManufacturerSettings(
  options: CreateTestManufacturerSettingsOptions
): Promise<Database['public']['Tables']['manufacturer_settings']['Row']> {
  const adminClient = createTestAdminClient();

  const settingsData = {
    organization_id: options.organizationId,
    lot_prefix: options.lotPrefix || 'TEST',
    lot_model_digits: options.lotModelDigits || 5,
    lot_date_format: options.lotDateFormat || 'yymmdd',
    expiry_months: options.expiryMonths || 24,
  };

  const { data, error } = await adminClient
    .from('manufacturer_settings')
    .upsert(settingsData, { onConflict: 'organization_id' })
    .select()
    .single();

  if (error) {
    throw new Error(`테스트 제조사 설정 생성 실패: ${error.message}`);
  }

  return data;
}

// ============================================================
// 환자
// ============================================================

/**
 * 테스트용 환자 생성
 */
export async function createTestPatient(
  phoneNumber?: string
): Promise<Database['public']['Tables']['patients']['Row']> {
  const adminClient = createTestAdminClient();

  const patientData = {
    phone_number: phoneNumber || generateTestPhoneNumber(),
  };

  const { data, error } = await adminClient
    .from('patients')
    .insert(patientData)
    .select()
    .single();

  if (error) {
    throw new Error(`테스트 환자 생성 실패: ${error.message}`);
  }

  createdIds.patients.push(data.phone_number);
  return data;
}

// ============================================================
// 출고 배치
// ============================================================

export interface CreateTestShipmentBatchOptions {
  fromOrganizationId: string;
  toOrganizationType: OrganizationType;
  toOrganizationId: string;
  virtualCodeIds: string[];
  isRecalled?: boolean;
  recallReason?: string;
}

/**
 * 테스트용 출고 배치 생성
 */
export async function createTestShipmentBatch(
  options: CreateTestShipmentBatchOptions
): Promise<Database['public']['Tables']['shipment_batches']['Row']> {
  const adminClient = createTestAdminClient();

  // 1. Shipment Batch 생성
  const batchData = {
    from_organization_id: options.fromOrganizationId,
    to_organization_type: options.toOrganizationType,
    to_organization_id: options.toOrganizationId,
    shipment_date: new Date().toISOString(),
    is_recalled: options.isRecalled ?? false,
    recall_reason: options.recallReason || null,
  };

  const { data: batch, error: batchError } = await adminClient
    .from('shipment_batches')
    .insert(batchData)
    .select()
    .single();

  if (batchError) {
    throw new Error(`테스트 출고 배치 생성 실패: ${batchError.message}`);
  }

  createdIds.shipmentBatches.push(batch.id);

  // 2. Shipment Details 생성
  const detailsData = options.virtualCodeIds.map((codeId) => ({
    shipment_batch_id: batch.id,
    virtual_code_id: codeId,
  }));

  const { error: detailsError } = await adminClient
    .from('shipment_details')
    .insert(detailsData);

  if (detailsError) {
    throw new Error(`테스트 출고 상세 생성 실패: ${detailsError.message}`);
  }

  // 3. 가상 코드 소유권 이전
  for (const codeId of options.virtualCodeIds) {
    await updateVirtualCodeOwner(codeId, 'ORGANIZATION', options.toOrganizationId);
  }

  return batch;
}

// ============================================================
// 정리 함수
// ============================================================

/**
 * 생성된 모든 테스트 데이터 정리
 */
export async function cleanupAllTestData(): Promise<void> {
  const adminClient = createTestAdminClient();

  // 역순으로 삭제 (외래 키 제약 조건 때문)

  // 1. Histories 삭제
  if (createdIds.shipmentBatches.length > 0) {
    await adminClient
      .from('histories')
      .delete()
      .in('shipment_batch_id', createdIds.shipmentBatches);
  }

  // 2. Shipment Details 삭제
  if (createdIds.shipmentBatches.length > 0) {
    await adminClient
      .from('shipment_details')
      .delete()
      .in('shipment_batch_id', createdIds.shipmentBatches);
  }

  // 3. Shipment Batches 삭제
  if (createdIds.shipmentBatches.length > 0) {
    await adminClient
      .from('shipment_batches')
      .delete()
      .in('id', createdIds.shipmentBatches);
  }

  // 4. Treatment Details & Records 삭제
  if (createdIds.treatmentRecords.length > 0) {
    await adminClient
      .from('treatment_details')
      .delete()
      .in('treatment_id', createdIds.treatmentRecords);

    await adminClient
      .from('treatment_records')
      .delete()
      .in('id', createdIds.treatmentRecords);
  }

  // 5. Virtual Codes 삭제 (Lot 삭제 시 cascade 될 수 있음)
  if (createdIds.lots.length > 0) {
    await adminClient
      .from('virtual_codes')
      .delete()
      .in('lot_id', createdIds.lots);
  }

  // 6. Lots 삭제
  if (createdIds.lots.length > 0) {
    await adminClient
      .from('lots')
      .delete()
      .in('id', createdIds.lots);
  }

  // 7. Products 삭제
  if (createdIds.products.length > 0) {
    await adminClient
      .from('products')
      .delete()
      .in('id', createdIds.products);
  }

  // 8. Manufacturer Settings 삭제
  if (createdIds.organizations.length > 0) {
    await adminClient
      .from('manufacturer_settings')
      .delete()
      .in('organization_id', createdIds.organizations);
  }

  // 9. Organizations 삭제
  if (createdIds.organizations.length > 0) {
    await adminClient
      .from('organizations')
      .delete()
      .in('id', createdIds.organizations);
  }

  // 10. Patients 삭제
  if (createdIds.patients.length > 0) {
    await adminClient
      .from('patients')
      .delete()
      .in('phone_number', createdIds.patients);
  }

  // 11. Notifications 삭제
  if (createdIds.notifications.length > 0) {
    await adminClient
      .from('notification_messages')
      .delete()
      .in('id', createdIds.notifications);
  }

  // 12. Auth Users 삭제
  for (const userId of createdIds.authUsers) {
    await adminClient.auth.admin.deleteUser(userId);
  }

  // 12. ID 목록 초기화
  resetCreatedIds();
}

/**
 * ID 목록 초기화
 */
export function resetCreatedIds(): void {
  createdIds.organizations = [];
  createdIds.products = [];
  createdIds.lots = [];
  createdIds.virtualCodes = [];
  createdIds.shipmentBatches = [];
  createdIds.treatmentRecords = [];
  createdIds.patients = [];
  createdIds.authUsers = [];
  createdIds.manufacturerSettings = [];
  createdIds.notifications = [];
}

/**
 * 특정 테스트 데이터 ID 등록 (외부에서 생성된 데이터 추적용)
 */
export function trackTestData(
  type: keyof typeof createdIds,
  id: string
): void {
  createdIds[type].push(id);
}

// ============================================================
// 비활성 제품 알림 테스트용 헬퍼
// ============================================================

type DeactivationReason = Database['public']['Enums']['deactivation_reason'];

export interface CreateTestInactiveProductOptions {
  organizationId: string;
  name?: string;
  deactivationReason?: DeactivationReason;
  deactivationNote?: string;
}

/**
 * 테스트용 비활성 제품 생성 (deactivation_reason 포함)
 */
export async function createTestInactiveProduct(
  options: CreateTestInactiveProductOptions
): Promise<Database['public']['Tables']['products']['Row']> {
  const adminClient = createTestAdminClient();

  const productData = {
    organization_id: options.organizationId,
    name: options.name || `비활성제품_${Date.now()}`,
    udi_di: `UDI_${generateTestId()}`,
    model_name: `MODEL_${generateTestId()}`,
    is_active: false,
    deactivation_reason: options.deactivationReason || 'DISCONTINUED',
    deactivation_note: options.deactivationNote || null,
    deactivated_at: new Date().toISOString(),
  };

  const { data, error } = await adminClient
    .from('products')
    .insert(productData)
    .select()
    .single();

  if (error) {
    throw new Error(`테스트 비활성 제품 생성 실패: ${error.message}`);
  }

  createdIds.products.push(data.id);
  return data;
}

/**
 * 조직 알림 조회 (테스트 검증용)
 */
export async function getOrganizationAlerts(
  orgId: string,
  options: {
    alertType?: Database['public']['Enums']['organization_alert_type'];
    isRead?: boolean;
  } = {}
): Promise<Database['public']['Tables']['organization_alerts']['Row'][]> {
  const adminClient = createTestAdminClient();

  let query = adminClient
    .from('organization_alerts')
    .select('*')
    .eq('recipient_org_id', orgId)
    .order('created_at', { ascending: false });

  if (options.alertType) {
    query = query.eq('alert_type', options.alertType);
  }

  if (options.isRead !== undefined) {
    query = query.eq('is_read', options.isRead);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`조직 알림 조회 실패: ${error.message}`);
  }

  return data || [];
}

/**
 * 비활성 제품 사용 로그 조회 (테스트 검증용)
 */
export async function getInactiveProductUsageLogs(
  filters: {
    productId?: string;
    usageType?: 'SHIPMENT' | 'TREATMENT';
    organizationId?: string;
    usageId?: string;
  } = {}
): Promise<Database['public']['Tables']['inactive_product_usage_logs']['Row'][]> {
  const adminClient = createTestAdminClient();

  let query = adminClient
    .from('inactive_product_usage_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.productId) {
    query = query.eq('product_id', filters.productId);
  }

  if (filters.usageType) {
    query = query.eq('usage_type', filters.usageType);
  }

  if (filters.organizationId) {
    query = query.eq('organization_id', filters.organizationId);
  }

  if (filters.usageId) {
    query = query.eq('usage_id', filters.usageId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`비활성 제품 사용 로그 조회 실패: ${error.message}`);
  }

  return data || [];
}

/**
 * 테스트 알림 정리
 */
export async function cleanupOrganizationAlerts(orgIds: string[]): Promise<void> {
  if (orgIds.length === 0) return;

  const adminClient = createTestAdminClient();

  await adminClient
    .from('organization_alerts')
    .delete()
    .in('recipient_org_id', orgIds);
}

/**
 * 테스트 비활성 제품 사용 로그 정리
 */
export async function cleanupInactiveProductUsageLogs(productIds: string[]): Promise<void> {
  if (productIds.length === 0) return;

  const adminClient = createTestAdminClient();

  await adminClient
    .from('inactive_product_usage_logs')
    .delete()
    .in('product_id', productIds);
}
