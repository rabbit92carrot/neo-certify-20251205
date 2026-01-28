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
  rpcWithRetry,
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
  // 비활성 제품 알림 테스트용
  createTestInactiveProduct,
  getOrganizationAlerts,
  getInactiveProductUsageLogs,
  cleanupOrganizationAlerts,
  cleanupInactiveProductUsageLogs,
} from './test-data-factory';
export type {
  CreateTestOrganizationOptions,
  CreateTestProductOptions,
  CreateTestLotOptions,
  CreateTestManufacturerSettingsOptions,
  CreateTestShipmentBatchOptions,
  CreateTestInactiveProductOptions,
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
