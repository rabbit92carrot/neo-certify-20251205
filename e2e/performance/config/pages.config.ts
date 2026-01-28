/**
 * 성능 측정 대상 페이지 설정
 * 각 조직 타입별 핵심 페이지를 정의
 */

export type UserRole = 'admin' | 'manufacturer' | 'distributor' | 'hospital';
export type PageCategory = 'dashboard' | 'list' | 'form' | 'history';

export interface PageConfig {
  /** 페이지 고유 ID */
  id: string;
  /** 페이지 표시 이름 */
  name: string;
  /** 페이지 경로 */
  path: string;
  /** 접근 권한 역할 */
  role: UserRole;
  /** 페이지 카테고리 */
  category: PageCategory;
  /** 페이지 로딩 완료 판단 셀렉터 */
  loadCompleteSelector: string;
  /** 데이터 로딩 완료 판단 셀렉터 (선택적) */
  dataLoadedSelector?: string;
}

/**
 * 측정 대상 핵심 페이지 목록 (22개)
 */
export const PAGES: PageConfig[] = [
  // ==================== Manufacturer (6개) ====================
  {
    id: 'manufacturer-dashboard',
    name: '제조사 대시보드',
    path: '/manufacturer/dashboard',
    role: 'manufacturer',
    category: 'dashboard',
    loadCompleteSelector: 'text=환영합니다',
    dataLoadedSelector: '.text-2xl.font-bold',
  },
  {
    id: 'manufacturer-products',
    name: '제조사 제품 관리',
    path: '/manufacturer/products',
    role: 'manufacturer',
    category: 'list',
    loadCompleteSelector: 'h1',
    dataLoadedSelector: 'table, text=등록된 제품이 없습니다',
  },
  {
    id: 'manufacturer-production',
    name: '제조사 생산 관리',
    path: '/manufacturer/production',
    role: 'manufacturer',
    category: 'form',
    loadCompleteSelector: 'h1',
    dataLoadedSelector: 'button:has-text("생산 등록")',
  },
  {
    id: 'manufacturer-shipment',
    name: '제조사 출고 관리',
    path: '/manufacturer/shipment',
    role: 'manufacturer',
    category: 'form',
    loadCompleteSelector: 'h1',
    dataLoadedSelector: 'form, table',
  },
  {
    id: 'manufacturer-inventory',
    name: '제조사 재고 조회',
    path: '/manufacturer/inventory',
    role: 'manufacturer',
    category: 'list',
    loadCompleteSelector: 'h1',
    dataLoadedSelector: '[class*="card"], text=재고가 없습니다',
  },
  {
    id: 'manufacturer-history',
    name: '제조사 이력 조회',
    path: '/manufacturer/history',
    role: 'manufacturer',
    category: 'history',
    loadCompleteSelector: 'h1',
    dataLoadedSelector: 'table, text=이력이 없습니다',
  },

  // ==================== Distributor (4개) ====================
  {
    id: 'distributor-dashboard',
    name: '유통사 대시보드',
    path: '/distributor/dashboard',
    role: 'distributor',
    category: 'dashboard',
    loadCompleteSelector: 'text=환영합니다',
    dataLoadedSelector: '.text-2xl.font-bold',
  },
  {
    id: 'distributor-inventory',
    name: '유통사 재고 조회',
    path: '/distributor/inventory',
    role: 'distributor',
    category: 'list',
    loadCompleteSelector: 'h1',
    dataLoadedSelector: '[class*="card"], text=재고가 없습니다',
  },
  {
    id: 'distributor-shipment',
    name: '유통사 출고 관리',
    path: '/distributor/shipment',
    role: 'distributor',
    category: 'form',
    loadCompleteSelector: 'h1',
    dataLoadedSelector: 'form, table',
  },
  {
    id: 'distributor-history',
    name: '유통사 이력 조회',
    path: '/distributor/history',
    role: 'distributor',
    category: 'history',
    loadCompleteSelector: 'h1',
    dataLoadedSelector: 'table, text=이력이 없습니다',
  },

  // ==================== Hospital (6개) ====================
  {
    id: 'hospital-dashboard',
    name: '병원 대시보드',
    path: '/hospital/dashboard',
    role: 'hospital',
    category: 'dashboard',
    loadCompleteSelector: 'text=환영합니다',
    dataLoadedSelector: '.text-2xl.font-bold',
  },
  {
    id: 'hospital-inventory',
    name: '병원 재고 조회',
    path: '/hospital/inventory',
    role: 'hospital',
    category: 'list',
    loadCompleteSelector: 'h1',
    dataLoadedSelector: '[class*="card"], text=재고가 없습니다',
  },
  {
    id: 'hospital-treatment',
    name: '병원 시술 관리',
    path: '/hospital/treatment',
    role: 'hospital',
    category: 'form',
    loadCompleteSelector: 'h1',
    dataLoadedSelector: '[data-slot="card-title"]', // CardTitle은 lazy load 완료 후에만 렌더링 (FormSkeleton은 CardTitle 미사용)
  },
  {
    id: 'hospital-treatment-history',
    name: '병원 시술 이력',
    path: '/hospital/treatment-history',
    role: 'hospital',
    category: 'history',
    loadCompleteSelector: 'h1',
    dataLoadedSelector: 'table, text=이력이 없습니다',
  },
  {
    id: 'hospital-disposal',
    name: '병원 폐기 관리',
    path: '/hospital/disposal',
    role: 'hospital',
    category: 'form',
    loadCompleteSelector: 'h1',
    dataLoadedSelector: '[data-slot="card-title"]', // CardTitle은 lazy load 완료 후에만 렌더링 (FormSkeleton은 CardTitle 미사용)
  },
  {
    id: 'hospital-history',
    name: '병원 이력 조회',
    path: '/hospital/history',
    role: 'hospital',
    category: 'history',
    loadCompleteSelector: 'h1',
    dataLoadedSelector: 'table, text=이력이 없습니다',
  },

  // ==================== Admin (6개) ====================
  {
    id: 'admin-dashboard',
    name: '관리자 대시보드',
    path: '/admin/dashboard',
    role: 'admin',
    category: 'dashboard',
    loadCompleteSelector: 'text=환영합니다',
    dataLoadedSelector: '.text-2xl.font-bold',
  },
  {
    id: 'admin-organizations',
    name: '관리자 조직 관리',
    path: '/admin/organizations',
    role: 'admin',
    category: 'list',
    loadCompleteSelector: 'h1',
    dataLoadedSelector: 'table',
  },
  {
    id: 'admin-approvals',
    name: '관리자 가입 승인',
    path: '/admin/approvals',
    role: 'admin',
    category: 'list',
    loadCompleteSelector: 'h1',
    dataLoadedSelector: 'table, text=승인', // 긴 텍스트 → 짧은 텍스트로 안정화
  },
  {
    id: 'admin-recalls',
    name: '관리자 회수 관리',
    path: '/admin/recalls',
    role: 'admin',
    category: 'list',
    loadCompleteSelector: 'h1',
    dataLoadedSelector: 'table, text=회수', // 긴 텍스트 → 짧은 텍스트로 안정화
  },
  {
    id: 'admin-history',
    name: '관리자 전체 이력',
    path: '/admin/history',
    role: 'admin',
    category: 'history',
    loadCompleteSelector: 'h1',
    dataLoadedSelector: 'table, form, input[type="text"]', // placeholder 의존 제거
  },
  {
    id: 'admin-alerts',
    name: '관리자 알림 관리',
    path: '/admin/alerts',
    role: 'admin',
    category: 'list',
    loadCompleteSelector: 'h1',
    dataLoadedSelector: 'table, text=비활성 제품 사용 기록', // 데이터 없을 때 EmptyState 텍스트 매칭
  },
];

/**
 * 역할별 페이지 그룹화
 */
export const getPagesByRole = (role: UserRole): PageConfig[] => {
  return PAGES.filter((page) => page.role === role);
};

/**
 * 모든 역할 목록
 */
export const ROLES: UserRole[] = ['manufacturer', 'distributor', 'hospital', 'admin'];
