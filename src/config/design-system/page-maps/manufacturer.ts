import type { FrameMapConfig } from '@/components/design-system/types';

/**
 * 제조사 페이지 맵 설정 (행 기반 레이아웃 - 100% 스케일)
 *
 * 레이아웃:
 * - 프레임 크기: 1200×836 (콘텐츠 800 + 헤더 36)
 * - 행 간격: 1000px (프레임 836px + 여백 164px)
 * - 컴포넌트 카드: 160×50px, x=1280 시작
 * - 카드 간격: 66px (카드 50px + 여백 16px)
 *
 * 페이지 순서: 사이드바 메뉴 순서대로
 */
export const manufacturerPageMap: FrameMapConfig = {
  nodes: [
    // Row 0: 대시보드
    {
      id: 'dashboard',
      type: 'frame',
      position: { x: 0, y: 0 },
      data: {
        label: '대시보드',
        route: '/manufacturer/dashboard',
        pageType: 'dashboard',
        components: ['StatCard', 'Card'],
        storybookPath: 'pages-manufacturer-dashboard',
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

    // Row 1: 제품 관리
    {
      id: 'products',
      type: 'frame',
      position: { x: 0, y: 1000 },
      data: {
        label: '제품 관리',
        route: '/manufacturer/products',
        pageType: 'table',
        components: ['ProductsTable', 'ProductForm', 'ProductDeactivateDialog'],
        storybookPath: 'pages-manufacturer-products',
      },
    },
    {
      id: 'products-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 1050 },
      data: { componentName: 'ProductsTable' },
    },
    {
      id: 'products-comp-2',
      type: 'component-card',
      position: { x: 1280, y: 1116 },
      data: { componentName: 'ProductForm' },
    },
    {
      id: 'products-comp-3',
      type: 'component-card',
      position: { x: 1280, y: 1182 },
      data: { componentName: 'ProductDeactivateDialog' },
    },

    // Row 2: 생산 등록
    {
      id: 'production',
      type: 'frame',
      position: { x: 0, y: 2000 },
      data: {
        label: '생산 등록',
        route: '/manufacturer/production',
        pageType: 'form',
        components: ['LotForm', 'ProductSelector'],
        storybookPath: 'pages-manufacturer-production',
      },
    },
    {
      id: 'production-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 2050 },
      data: { componentName: 'LotForm' },
    },
    {
      id: 'production-comp-2',
      type: 'component-card',
      position: { x: 1280, y: 2116 },
      data: { componentName: 'ProductSelector' },
    },

    // Row 3: 출고
    {
      id: 'shipment',
      type: 'frame',
      position: { x: 0, y: 3000 },
      data: {
        label: '출고',
        route: '/manufacturer/shipment',
        pageType: 'form',
        components: ['ShipmentForm', 'CartDisplay', 'SearchableCombobox'],
        storybookPath: 'pages-manufacturer-shipment',
      },
    },
    {
      id: 'shipment-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 3050 },
      data: { componentName: 'ShipmentForm' },
    },
    {
      id: 'shipment-comp-2',
      type: 'component-card',
      position: { x: 1280, y: 3116 },
      data: { componentName: 'CartDisplay' },
    },
    {
      id: 'shipment-comp-3',
      type: 'component-card',
      position: { x: 1280, y: 3182 },
      data: { componentName: 'SearchableCombobox' },
    },

    // Row 4: 재고 조회
    {
      id: 'inventory',
      type: 'frame',
      position: { x: 0, y: 4000 },
      data: {
        label: '재고 조회',
        route: '/manufacturer/inventory',
        pageType: 'table',
        components: ['InventoryTable', 'DataTable'],
        storybookPath: 'pages-manufacturer-inventory',
      },
    },
    {
      id: 'inventory-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 4050 },
      data: { componentName: 'InventoryTable' },
    },
    {
      id: 'inventory-comp-2',
      type: 'component-card',
      position: { x: 1280, y: 4116 },
      data: { componentName: 'DataTable' },
    },

    // Row 5: 거래 이력
    {
      id: 'history',
      type: 'frame',
      position: { x: 0, y: 5000 },
      data: {
        label: '거래 이력',
        route: '/manufacturer/history',
        pageType: 'table',
        components: ['TransactionHistoryTable', 'VirtualDataTable'],
        storybookPath: 'pages-manufacturer-history',
      },
    },
    {
      id: 'history-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 5050 },
      data: { componentName: 'TransactionHistoryTable' },
    },
    {
      id: 'history-comp-2',
      type: 'component-card',
      position: { x: 1280, y: 5116 },
      data: { componentName: 'VirtualDataTable' },
    },

    // Row 6: 알림 보관함
    {
      id: 'inbox',
      type: 'frame',
      position: { x: 0, y: 6000 },
      data: {
        label: '알림 보관함',
        route: '/manufacturer/inbox',
        pageType: 'list',
        components: ['NotificationList'],
        storybookPath: 'pages-manufacturer-inbox',
      },
    },
    {
      id: 'inbox-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 6050 },
      data: { componentName: 'NotificationList' },
    },

    // Row 7: 환경 설정
    {
      id: 'settings',
      type: 'frame',
      position: { x: 0, y: 7000 },
      data: {
        label: '환경 설정',
        route: '/manufacturer/settings',
        pageType: 'settings',
        components: ['ManufacturerSettingsForm'],
        storybookPath: 'pages-manufacturer-settings',
      },
    },
    {
      id: 'settings-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 7050 },
      data: { componentName: 'ManufacturerSettingsForm' },
    },
  ],
  edges: [], // 행 기반 레이아웃에서는 엣지 제거
};
