/**
 * 테스트 헬퍼 중앙 export
 */

// Supabase 클라이언트
export {
  createTestClient,
  createTestAdminClient,
  createAuthenticatedTestClient,
  checkSupabaseConnection,
  getTestEnv,
} from './supabase-test-client';

// 테스트 데이터 팩토리
export {
  generateTestId,
  generateTestUUID,
  generateTestEmail,
  generateTestBusinessNumber,
  generateTestPhoneNumber,
  createTestOrganization,
  createTestOrganizationWithAuth,
  createTestProduct,
  createTestLot,
  getVirtualCodesByLot,
  updateVirtualCodeOwner,
  createTestManufacturerSettings,
  createTestPatient,
  createTestShipmentBatch,
  cleanupAllTestData,
  resetCreatedIds,
  trackTestData,
} from './test-data-factory';
export type {
  CreateTestOrganizationOptions,
  CreateTestProductOptions,
  CreateTestLotOptions,
  CreateTestManufacturerSettingsOptions,
  CreateTestShipmentBatchOptions,
} from './test-data-factory';

// 정리 함수
export {
  cleanupOrganizationData,
  cleanupAuthUserData,
  cleanupTestEmailPattern,
  resetTestDatabase,
  cleanupLotData,
  cleanupOldTestData,
} from './cleanup';
