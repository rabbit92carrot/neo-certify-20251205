/**
 * 관리자 서비스 (Deprecated Wrapper)
 *
 * @deprecated 이 파일은 하위 호환성을 위해 유지됩니다.
 * 새로운 코드는 admin/ 디렉토리의 개별 서비스를 직접 import하세요.
 *
 * @example
 * // 권장 (새 코드):
 * import { getOrganizations } from '@/services/admin/organization.service';
 * import { getAdminHistory } from '@/services/admin/history.service';
 *
 * // 또는 통합 진입점:
 * import { getOrganizations, getAdminHistory } from '@/services/admin';
 *
 * // 기존 호환 (deprecated):
 * import { getOrganizations } from '@/services/admin.service';
 */

// 모든 함수를 분리된 모듈에서 re-export
export * from './admin/organization.service';
export * from './admin/history.service';
export * from './admin/recall.service';
export * from './admin/select.service';
export * from './admin/alert.service';
export * from './admin/event-summary.service';

// 타입도 re-export
export * from './admin/types';
