/**
 * 성능 측정 대상 동작 설정
 * 페이지별 주요 사용자 상호작용 동작 정의
 */

import type { ActionStep } from '../utils/metrics';

export type ActionType =
  | 'stats-load' // 대시보드 통계 로딩
  | 'table-load' // 테이블 데이터 로딩
  | 'form-submit' // 폼 제출
  | 'search-filter' // 검색/필터링
  | 'pagination' // 페이지네이션
  | 'modal-open' // 모달 열기
  | 'expand-collapse'; // 아코디언/확장

export interface ActionConfig {
  /** 동작 고유 ID */
  id: string;
  /** 동작 표시 이름 */
  name: string;
  /** 연결된 페이지 ID */
  pageId: string;
  /** 동작 유형 */
  type: ActionType;
  /** 수행할 단계들 */
  steps: ActionStep[];
  /** 완료 판단 셀렉터 */
  completeSelector: string;
  /** 사전 조건 셀렉터 (선택) */
  prerequisiteSelector?: string;
  /** 동작 설명 */
  description?: string;
}

/**
 * 측정 대상 동작 목록
 */
export const ACTIONS: ActionConfig[] = [
  // ==================== 대시보드 통계 로딩 ====================
  {
    id: 'manufacturer-stats-load',
    name: '제조사 대시보드 통계 로딩',
    pageId: 'manufacturer-dashboard',
    type: 'stats-load',
    steps: [], // 페이지 로드 시 자동 실행
    completeSelector: '.text-2xl.font-bold',
    prerequisiteSelector: 'text=환영합니다',
    description: '대시보드 통계 카드 데이터 로딩 완료까지 시간',
  },
  {
    id: 'distributor-stats-load',
    name: '유통사 대시보드 통계 로딩',
    pageId: 'distributor-dashboard',
    type: 'stats-load',
    steps: [],
    completeSelector: '.text-2xl.font-bold',
    prerequisiteSelector: 'text=환영합니다',
  },
  {
    id: 'hospital-stats-load',
    name: '병원 대시보드 통계 로딩',
    pageId: 'hospital-dashboard',
    type: 'stats-load',
    steps: [],
    completeSelector: '.text-2xl.font-bold',
    prerequisiteSelector: 'text=환영합니다',
  },
  {
    id: 'admin-stats-load',
    name: '관리자 대시보드 통계 로딩',
    pageId: 'admin-dashboard',
    type: 'stats-load',
    steps: [],
    completeSelector: '.text-2xl.font-bold',
    prerequisiteSelector: 'text=환영합니다',
  },

  // ==================== 테이블 데이터 로딩 ====================
  {
    id: 'manufacturer-products-table',
    name: '제품 목록 테이블 로딩',
    pageId: 'manufacturer-products',
    type: 'table-load',
    steps: [],
    completeSelector: 'table tbody tr',
    prerequisiteSelector: 'h1',
  },
  {
    id: 'admin-organizations-table',
    name: '조직 목록 테이블 로딩',
    pageId: 'admin-organizations',
    type: 'table-load',
    steps: [],
    completeSelector: 'table tbody tr',
    prerequisiteSelector: 'h1',
  },
  {
    id: 'admin-history-table',
    name: '전체 이력 테이블 로딩',
    pageId: 'admin-history',
    type: 'table-load',
    steps: [],
    completeSelector: 'table, input[placeholder*="LOT"]',
    prerequisiteSelector: 'h1',
  },

  // ==================== 모달 열기 ====================
  {
    id: 'manufacturer-product-modal',
    name: '제품 등록 모달/페이지 열기',
    pageId: 'manufacturer-products',
    type: 'modal-open',
    steps: [
      {
        action: 'click',
        selector: 'button:has-text("제품 등록"), a:has-text("제품 등록")',
      },
    ],
    completeSelector: '[role="dialog"], form input[name="name"]',
    prerequisiteSelector: 'h1',
  },
  // NOTE: 아래 동작들은 데이터 의존성이 있어 제외:
  // - Lot 생산 등록 모달: 제품이 등록되어 있어야 버튼 활성화
  // - 재고 상세 확장: 재고 데이터가 있어야 확장 가능
  // - 시술 이력 테이블: 시술 이력 데이터가 있어야 테이블 표시
];

/**
 * 페이지 ID로 동작 필터링
 */
export const getActionsByPageId = (pageId: string): ActionConfig[] => {
  return ACTIONS.filter((action) => action.pageId === pageId);
};

/**
 * 동작 유형으로 필터링
 */
export const getActionsByType = (type: ActionType): ActionConfig[] => {
  return ACTIONS.filter((action) => action.type === type);
};

/**
 * 동작 유형별 임계값 (ms)
 */
export const ACTION_THRESHOLDS: Record<ActionType, number> = {
  'stats-load': 2000, // 2초
  'table-load': 3000, // 3초
  'form-submit': 5000, // 5초
  'search-filter': 2000, // 2초
  pagination: 1500, // 1.5초
  'modal-open': 500, // 0.5초
  'expand-collapse': 300, // 0.3초
};
