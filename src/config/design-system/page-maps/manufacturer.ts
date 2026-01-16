import type { PageMapConfig } from '@/components/design-system/types';

/**
 * 제조사 페이지 맵 설정
 */
export const manufacturerPageMap: PageMapConfig = {
  nodes: [
    {
      id: 'dashboard',
      type: 'page',
      position: { x: 400, y: 0 },
      data: {
        label: '대시보드',
        route: '/manufacturer/dashboard',
        pageType: 'dashboard',
        components: ['StatCard', 'Card'],
        storybookPath: 'pages-manufacturer-dashboard',
      },
    },
    {
      id: 'products',
      type: 'page',
      position: { x: 100, y: 150 },
      data: {
        label: '제품 관리',
        route: '/manufacturer/products',
        pageType: 'table',
        components: ['ProductsTable', 'ProductForm', 'ProductDeactivateDialog'],
        storybookPath: 'pages-manufacturer-products',
      },
    },
    {
      id: 'production',
      type: 'page',
      position: { x: 300, y: 150 },
      data: {
        label: '생산 등록',
        route: '/manufacturer/production',
        pageType: 'form',
        components: ['LotForm', 'ProductSelector'],
        storybookPath: 'pages-manufacturer-production',
      },
    },
    {
      id: 'shipment',
      type: 'page',
      position: { x: 500, y: 150 },
      data: {
        label: '출고',
        route: '/manufacturer/shipment',
        pageType: 'form',
        components: ['ShipmentForm', 'CartDisplay', 'SearchableCombobox'],
        storybookPath: 'pages-manufacturer-shipment',
      },
    },
    {
      id: 'inventory',
      type: 'page',
      position: { x: 700, y: 150 },
      data: {
        label: '재고 조회',
        route: '/manufacturer/inventory',
        pageType: 'table',
        components: ['InventoryTable', 'DataTable'],
        storybookPath: 'pages-manufacturer-inventory',
      },
    },
    {
      id: 'history',
      type: 'page',
      position: { x: 200, y: 300 },
      data: {
        label: '거래 이력',
        route: '/manufacturer/history',
        pageType: 'table',
        components: ['TransactionHistoryTable', 'VirtualDataTable'],
        storybookPath: 'pages-manufacturer-history',
      },
    },
    {
      id: 'inbox',
      type: 'page',
      position: { x: 500, y: 300 },
      data: {
        label: '알림 보관함',
        route: '/manufacturer/inbox',
        pageType: 'list',
        components: ['NotificationList'],
        storybookPath: 'pages-manufacturer-inbox',
      },
    },
    {
      id: 'settings',
      type: 'page',
      position: { x: 700, y: 300 },
      data: {
        label: '환경 설정',
        route: '/manufacturer/settings',
        pageType: 'settings',
        components: ['ManufacturerSettingsForm'],
        storybookPath: 'pages-manufacturer-settings',
      },
    },
  ],
  edges: [
    { id: 'e-dash-products', source: 'dashboard', target: 'products', label: '메뉴' },
    { id: 'e-dash-production', source: 'dashboard', target: 'production', label: '메뉴' },
    { id: 'e-dash-shipment', source: 'dashboard', target: 'shipment', label: '메뉴' },
    { id: 'e-dash-inventory', source: 'dashboard', target: 'inventory', label: '메뉴' },
    { id: 'e-production-inventory', source: 'production', target: 'inventory', label: '생산 후' },
    { id: 'e-shipment-inventory', source: 'shipment', target: 'inventory', label: '출고 후' },
    { id: 'e-shipment-history', source: 'shipment', target: 'history', label: '이력 기록' },
    { id: 'e-products-production', source: 'products', target: 'production', label: '제품 선택' },
  ],
};
