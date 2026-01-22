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
        components: ['PageHeader', 'StatCard', 'Card'],
        storybookPath: 'pages-manufacturer-dashboard',
      },
    },
    {
      id: 'dashboard-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 50 },
      data: { componentName: 'PageHeader', storybookPath: 'shared-pageheader' },
    },
    {
      id: 'dashboard-comp-2',
      type: 'component-card',
      position: { x: 1280, y: 116 },
      data: { componentName: 'StatCard', storybookPath: 'shared-statcard' },
    },
    {
      id: 'dashboard-comp-3',
      type: 'component-card',
      position: { x: 1280, y: 182 },
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
        components: [
          'PageHeader',
          'ProductsTable',
          'ProductForm',
          'ProductDeactivateDialog',
          'Badge',
        ],
        storybookPath: 'pages-manufacturer-products',
      },
    },
    {
      id: 'products-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 1050 },
      data: { componentName: 'PageHeader', storybookPath: 'shared-pageheader' },
    },
    {
      id: 'products-comp-2',
      type: 'component-card',
      position: { x: 1280, y: 1116 },
      data: { componentName: 'ProductsTable' },
    },
    {
      id: 'products-comp-3',
      type: 'component-card',
      position: { x: 1280, y: 1182 },
      data: { componentName: 'ProductForm' },
    },
    {
      id: 'products-comp-4',
      type: 'component-card',
      position: { x: 1280, y: 1248 },
      data: { componentName: 'ProductDeactivateDialog' },
    },
    {
      id: 'products-comp-5',
      type: 'component-card',
      position: { x: 1280, y: 1314 },
      data: { componentName: 'Badge', storybookPath: 'ui-badge' },
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
        components: ['PageHeader', 'LotForm', 'ProductSelector'],
        storybookPath: 'pages-manufacturer-production',
      },
    },
    {
      id: 'production-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 2050 },
      data: { componentName: 'PageHeader', storybookPath: 'shared-pageheader' },
    },
    {
      id: 'production-comp-2',
      type: 'component-card',
      position: { x: 1280, y: 2116 },
      data: { componentName: 'LotForm' },
    },
    {
      id: 'production-comp-3',
      type: 'component-card',
      position: { x: 1280, y: 2182 },
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
        components: [
          'PageHeader',
          'ShipmentFormWrapper',
          'ShipmentForm',
          'ProductCard',
          'QuantityInputPanel',
          'CartDisplay',
          'SearchableCombobox',
        ],
        storybookPath: 'pages-manufacturer-shipment',
      },
    },
    {
      id: 'shipment-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 3050 },
      data: { componentName: 'PageHeader', storybookPath: 'shared-pageheader' },
    },
    {
      id: 'shipment-comp-2',
      type: 'component-card',
      position: { x: 1280, y: 3116 },
      data: { componentName: 'ShipmentFormWrapper' },
    },
    {
      id: 'shipment-comp-3',
      type: 'component-card',
      position: { x: 1280, y: 3182 },
      data: { componentName: 'ShipmentForm' },
    },
    {
      id: 'shipment-comp-4',
      type: 'component-card',
      position: { x: 1280, y: 3248 },
      data: { componentName: 'ProductCard' },
    },
    {
      id: 'shipment-comp-5',
      type: 'component-card',
      position: { x: 1280, y: 3314 },
      data: { componentName: 'QuantityInputPanel' },
    },
    {
      id: 'shipment-comp-6',
      type: 'component-card',
      position: { x: 1280, y: 3380 },
      data: { componentName: 'CartDisplay' },
    },
    {
      id: 'shipment-comp-7',
      type: 'component-card',
      position: { x: 1280, y: 3446 },
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
        components: ['PageHeader', 'InventoryTable'],
        storybookPath: 'pages-manufacturer-inventory',
      },
    },
    {
      id: 'inventory-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 4050 },
      data: { componentName: 'PageHeader', storybookPath: 'shared-pageheader' },
    },
    {
      id: 'inventory-comp-2',
      type: 'component-card',
      position: { x: 1280, y: 4116 },
      data: { componentName: 'InventoryTable' },
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
        components: ['PageHeader', 'HistoryPageWrapper', 'TransactionHistoryTable'],
        storybookPath: 'pages-manufacturer-history',
      },
    },
    {
      id: 'history-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 5050 },
      data: { componentName: 'PageHeader', storybookPath: 'shared-pageheader' },
    },
    {
      id: 'history-comp-2',
      type: 'component-card',
      position: { x: 1280, y: 5116 },
      data: { componentName: 'HistoryPageWrapper' },
    },
    {
      id: 'history-comp-3',
      type: 'component-card',
      position: { x: 1280, y: 5182 },
      data: { componentName: 'TransactionHistoryTable' },
    },

    // Row 6: 알림 보관함
    {
      id: 'inbox',
      type: 'frame',
      position: { x: 0, y: 6000 },
      data: {
        label: '알림 보관함',
        route: '/manufacturer/inbox',
        pageType: 'table',
        components: ['PageHeader', 'InboxTableWrapper', 'OrganizationAlertTable'],
        storybookPath: 'pages-manufacturer-inbox',
      },
    },
    {
      id: 'inbox-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 6050 },
      data: { componentName: 'PageHeader', storybookPath: 'shared-pageheader' },
    },
    {
      id: 'inbox-comp-2',
      type: 'component-card',
      position: { x: 1280, y: 6116 },
      data: { componentName: 'InboxTableWrapper' },
    },
    {
      id: 'inbox-comp-3',
      type: 'component-card',
      position: { x: 1280, y: 6182 },
      data: { componentName: 'OrganizationAlertTable' },
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
        components: ['PageHeader', 'ManufacturerSettingsForm'],
        storybookPath: 'pages-manufacturer-settings',
      },
    },
    {
      id: 'settings-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 7050 },
      data: { componentName: 'PageHeader', storybookPath: 'shared-pageheader' },
    },
    {
      id: 'settings-comp-2',
      type: 'component-card',
      position: { x: 1280, y: 7116 },
      data: { componentName: 'ManufacturerSettingsForm' },
    },
  ],
  edges: [], // 행 기반 레이아웃에서는 엣지 제거
};
