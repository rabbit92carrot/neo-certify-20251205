import type { FrameMapConfig } from '@/components/design-system/types';

/**
 * 유통사 페이지 맵 설정 (행 기반 레이아웃 - 100% 스케일)
 *
 * 레이아웃:
 * - 프레임 크기: 1200×836 (콘텐츠 800 + 헤더 36)
 * - 행 간격: 1000px (프레임 836px + 여백 164px)
 * - 컴포넌트 카드: 160×50px, x=1280 시작
 * - 카드 간격: 66px (카드 50px + 여백 16px)
 *
 * 페이지 순서: 사이드바 메뉴 순서대로
 */
export const distributorPageMap: FrameMapConfig = {
  nodes: [
    // Row 0: 대시보드
    {
      id: 'dashboard',
      type: 'frame',
      position: { x: 0, y: 0 },
      data: {
        label: '대시보드',
        route: '/distributor/dashboard',
        pageType: 'dashboard',
        components: ['StatCard', 'Card'],
        storybookPath: 'pages-distributor-dashboard',
      },
    },
    {
      id: 'dashboard-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 50 },
      data: { componentName: 'StatCard', storybookPath: 'shared-statcard' },
    },
    {
      id: 'dashboard-comp-2',
      type: 'component-card',
      position: { x: 1280, y: 116 },
      data: { componentName: 'Card', storybookPath: 'ui-card' },
    },

    // Row 1: 출고
    {
      id: 'shipment',
      type: 'frame',
      position: { x: 0, y: 1000 },
      data: {
        label: '출고',
        route: '/distributor/shipment',
        pageType: 'form',
        components: ['ShipmentForm', 'CartDisplay', 'SearchableCombobox'],
        storybookPath: 'pages-distributor-shipment',
      },
    },
    {
      id: 'shipment-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 1050 },
      data: { componentName: 'ShipmentForm' },
    },
    {
      id: 'shipment-comp-2',
      type: 'component-card',
      position: { x: 1280, y: 1116 },
      data: { componentName: 'CartDisplay' },
    },
    {
      id: 'shipment-comp-3',
      type: 'component-card',
      position: { x: 1280, y: 1182 },
      data: { componentName: 'SearchableCombobox' },
    },

    // Row 2: 재고 조회
    {
      id: 'inventory',
      type: 'frame',
      position: { x: 0, y: 2000 },
      data: {
        label: '재고 조회',
        route: '/distributor/inventory',
        pageType: 'table',
        components: ['InventoryTable', 'DataTable'],
        storybookPath: 'pages-distributor-inventory',
      },
    },
    {
      id: 'inventory-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 2050 },
      data: { componentName: 'InventoryTable' },
    },
    {
      id: 'inventory-comp-2',
      type: 'component-card',
      position: { x: 1280, y: 2116 },
      data: { componentName: 'DataTable' },
    },

    // Row 3: 거래 이력
    {
      id: 'history',
      type: 'frame',
      position: { x: 0, y: 3000 },
      data: {
        label: '거래 이력',
        route: '/distributor/history',
        pageType: 'table',
        components: ['TransactionHistoryTable', 'VirtualDataTable'],
        storybookPath: 'pages-distributor-history',
      },
    },
    {
      id: 'history-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 3050 },
      data: { componentName: 'TransactionHistoryTable' },
    },
    {
      id: 'history-comp-2',
      type: 'component-card',
      position: { x: 1280, y: 3116 },
      data: { componentName: 'VirtualDataTable' },
    },
  ],
  edges: [], // 행 기반 레이아웃에서는 엣지 제거
};
