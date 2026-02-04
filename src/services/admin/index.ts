/**
 * 관리자 서비스 모듈
 *
 * SSOT 원칙: 모든 관리자 서비스 함수는 이 진입점을 통해 export됩니다.
 *
 * 도메인별 분리:
 * - organization.service.ts: 조직 관리 (CRUD, 상태 변경)
 * - history.service.ts: 전체 이력 조회
 * - recall.service.ts: 회수 모니터링
 * - select.service.ts: 선택 목록 (드롭다운용)
 * - alert.service.ts: 비활성 제품 사용 알림
 * - event-summary.service.ts: 이벤트 요약 조회
 */

// 타입
export * from './types';

// 조직 관리
export {
  getOrganizationStatusCounts,
  getOrganizations,
  getPendingOrganizations,
  getOrganizationDetail,
  updateOrganizationStatus,
} from './organization.service';

// 이력 조회
export { getAdminHistory } from './history.service';

// 회수 모니터링
export {
  getRecallHistory,
  getRecallHistoryOptimized,
  getRecallHistoryCursor,
} from './recall.service';

// 선택 목록
export {
  getAllOrganizationsForSelect,
  searchOrganizations,
  searchProducts,
  getAllProductsForSelect,
} from './select.service';

// 알림/로그
export {
  getInactiveProductUsageLogs,
  acknowledgeUsageLog,
  acknowledgeUsageLogs,
  getUnacknowledgedUsageLogCount,
} from './alert.service';

// 이벤트 요약
export {
  getAdminEventSummary,
  getEventSampleCodes,
  getEventCodesPaginated,
  getAdminEventSummaryCursor,
} from './event-summary.service';

// 스토리지
export { getBusinessLicenseSignedUrl } from './storage.service';
export type { SignedUrlResult } from './storage.service';
