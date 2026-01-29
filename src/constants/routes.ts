/**
 * 라우트 관련 상수 정의
 * SSOT 원칙에 따라 모든 라우트 경로를 이 파일에서 관리합니다.
 */

import type { OrganizationType } from './organization';

/**
 * 공개 라우트 (인증 불필요)
 */
export const PUBLIC_ROUTES = ['/login', '/register', '/register/verify-email', '/forgot-password', '/reset-password', '/find-account', '/mock'] as const;

/**
 * 인증 라우트 (로그인된 사용자는 대시보드로 리다이렉트)
 */
export const AUTH_ROUTES = ['/login', '/register', '/register/verify-email', '/forgot-password', '/find-account'] as const;

/**
 * 보호된 라우트 (조직 유형별)
 */
export const PROTECTED_ROUTES = {
  MANUFACTURER: '/manufacturer',
  DISTRIBUTOR: '/distributor',
  HOSPITAL: '/hospital',
  ADMIN: '/admin',
} as const;

/**
 * 조직 유형별 기본 리다이렉트 경로
 */
export const DEFAULT_REDIRECT: Record<OrganizationType, string> = {
  MANUFACTURER: '/manufacturer/dashboard',
  DISTRIBUTOR: '/distributor/dashboard',
  HOSPITAL: '/hospital/dashboard',
  ADMIN: '/admin/dashboard',
};

/**
 * 로그인 페이지 경로
 */
export const LOGIN_PATH = '/login';

/**
 * 이메일 인증 안내 페이지 경로
 */
export const VERIFY_EMAIL_PATH = '/register/verify-email';

/**
 * 승인 대기 페이지 경로
 */
export const PENDING_PATH = '/pending';

/**
 * 홈 경로
 */
export const HOME_PATH = '/';
