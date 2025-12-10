/**
 * 네비게이션 관련 상수 정의
 * SSOT 원칙에 따라 모든 네비게이션 메뉴 항목을 이 파일에서 관리합니다.
 * PRD 9.1 URL 구조 기반
 */

import type { OrganizationType } from './organization';

/**
 * 아이콘 이름 타입 (lucide-react 아이콘)
 */
export type IconName =
  | 'LayoutDashboard'
  | 'Package'
  | 'Factory'
  | 'Truck'
  | 'History'
  | 'Warehouse'
  | 'FileText'
  | 'Settings'
  | 'Stethoscope'
  | 'Building2'
  | 'UserCheck'
  | 'AlertCircle';

/**
 * 네비게이션 항목 타입
 */
export interface NavigationItem {
  /** 메뉴 라벨 */
  label: string;
  /** 이동 경로 */
  href: string;
  /** 아이콘 이름 */
  icon: IconName;
  /** 하위 메뉴 (선택) */
  children?: NavigationItem[];
}

/**
 * 제조사 네비게이션 메뉴
 */
export const MANUFACTURER_NAV_ITEMS: NavigationItem[] = [
  { label: '대시보드', href: '/manufacturer/dashboard', icon: 'LayoutDashboard' },
  { label: '제품 관리', href: '/manufacturer/products', icon: 'Package' },
  { label: '생산 등록', href: '/manufacturer/production', icon: 'Factory' },
  { label: '출고', href: '/manufacturer/shipment', icon: 'Truck' },
  { label: '이관 이력', href: '/manufacturer/shipment-history', icon: 'History' },
  { label: '재고 조회', href: '/manufacturer/inventory', icon: 'Warehouse' },
  { label: '거래 이력', href: '/manufacturer/history', icon: 'FileText' },
  { label: '환경 설정', href: '/manufacturer/settings', icon: 'Settings' },
];

/**
 * 유통사 네비게이션 메뉴
 */
export const DISTRIBUTOR_NAV_ITEMS: NavigationItem[] = [
  { label: '대시보드', href: '/distributor/dashboard', icon: 'LayoutDashboard' },
  { label: '출고', href: '/distributor/shipment', icon: 'Truck' },
  { label: '이관 이력', href: '/distributor/shipment-history', icon: 'History' },
  { label: '재고 조회', href: '/distributor/inventory', icon: 'Warehouse' },
  { label: '거래 이력', href: '/distributor/history', icon: 'FileText' },
];

/**
 * 병원 네비게이션 메뉴
 */
export const HOSPITAL_NAV_ITEMS: NavigationItem[] = [
  { label: '대시보드', href: '/hospital/dashboard', icon: 'LayoutDashboard' },
  { label: '시술 등록', href: '/hospital/treatment', icon: 'Stethoscope' },
  { label: '시술 이력', href: '/hospital/treatment-history', icon: 'History' },
  { label: '재고 조회', href: '/hospital/inventory', icon: 'Warehouse' },
  { label: '거래 이력', href: '/hospital/history', icon: 'FileText' },
];

/**
 * 관리자 네비게이션 메뉴
 */
export const ADMIN_NAV_ITEMS: NavigationItem[] = [
  { label: '대시보드', href: '/admin/dashboard', icon: 'LayoutDashboard' },
  { label: '조직 관리', href: '/admin/organizations', icon: 'Building2' },
  { label: '가입 승인', href: '/admin/approvals', icon: 'UserCheck' },
  { label: '전체 이력', href: '/admin/history', icon: 'FileText' },
  { label: '회수 이력', href: '/admin/recalls', icon: 'AlertCircle' },
];

/**
 * 조직 유형별 네비게이션 항목 매핑
 */
export const NAVIGATION_ITEMS: Record<OrganizationType, NavigationItem[]> = {
  MANUFACTURER: MANUFACTURER_NAV_ITEMS,
  DISTRIBUTOR: DISTRIBUTOR_NAV_ITEMS,
  HOSPITAL: HOSPITAL_NAV_ITEMS,
  ADMIN: ADMIN_NAV_ITEMS,
};

/**
 * 조직 유형별 네비게이션 항목 가져오기
 */
export function getNavigationItems(organizationType: OrganizationType): NavigationItem[] {
  return NAVIGATION_ITEMS[organizationType] || [];
}
