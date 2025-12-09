/**
 * 상수 모듈 메인 export
 * SSOT 원칙에 따라 모든 상수는 이 디렉토리에서 관리합니다.
 */

// 조직 관련
export {
  ORGANIZATION_TYPES,
  ORGANIZATION_TYPE_LABELS,
  ORGANIZATION_STATUSES,
  ORGANIZATION_STATUS_LABELS,
  type OrganizationType,
  type OrganizationStatus,
} from './organization';

// 제품 및 가상 코드 관련
export {
  VIRTUAL_CODE_STATUSES,
  VIRTUAL_CODE_STATUS_LABELS,
  OWNER_TYPES,
  OWNER_TYPE_LABELS,
  type VirtualCodeStatus,
  type OwnerType,
} from './product';

// 이력 관련
export {
  HISTORY_ACTION_TYPES,
  HISTORY_ACTION_TYPE_LABELS,
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_LABELS,
  type HistoryActionType,
  type NotificationType,
} from './history';

// 설정 값
export { CONFIG, type ExpiryMonthOption, type AllowedFileType } from './config';

// 메시지
export { ERROR_MESSAGES, SUCCESS_MESSAGES } from './messages';

// 라우트
export {
  PUBLIC_ROUTES,
  AUTH_ROUTES,
  PROTECTED_ROUTES,
  DEFAULT_REDIRECT,
  LOGIN_PATH,
  PENDING_PATH,
  HOME_PATH,
} from './routes';

// 네비게이션
export {
  MANUFACTURER_NAV_ITEMS,
  DISTRIBUTOR_NAV_ITEMS,
  HOSPITAL_NAV_ITEMS,
  ADMIN_NAV_ITEMS,
  NAVIGATION_ITEMS,
  getNavigationItems,
  type NavigationItem,
  type IconName,
} from './navigation';
