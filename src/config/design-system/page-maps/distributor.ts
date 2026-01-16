import type { PageMapConfig } from '@/components/design-system/types';

/**
 * 유통사 페이지 맵 설정
 */
export const distributorPageMap: PageMapConfig = {
  nodes: [
    {
      id: 'dashboard',
      type: 'page',
      position: { x: 300, y: 0 },
      data: {
        label: '대시보드',
        route: '/distributor/dashboard',
        pageType: 'dashboard',
        components: ['StatCard', 'Card'],
        storybookPath: 'pages-distributor-dashboard',
      },
    },
    {
      id: 'shipment',
      type: 'page',
      position: { x: 100, y: 150 },
      data: {
        label: '출고',
        route: '/distributor/shipment',
        pageType: 'form',
        components: ['ShipmentForm', 'CartDisplay', 'SearchableCombobox'],
        storybookPath: 'pages-distributor-shipment',
      },
    },
    {
      id: 'inventory',
      type: 'page',
      position: { x: 300, y: 150 },
      data: {
        label: '재고 조회',
        route: '/distributor/inventory',
        pageType: 'table',
        components: ['InventoryTable', 'DataTable'],
        storybookPath: 'pages-distributor-inventory',
      },
    },
    {
      id: 'history',
      type: 'page',
      position: { x: 500, y: 150 },
      data: {
        label: '거래 이력',
        route: '/distributor/history',
        pageType: 'table',
        components: ['TransactionHistoryTable', 'VirtualDataTable'],
        storybookPath: 'pages-distributor-history',
      },
    },
  ],
  edges: [
    { id: 'e-dash-shipment', source: 'dashboard', target: 'shipment', label: '메뉴' },
    { id: 'e-dash-inventory', source: 'dashboard', target: 'inventory', label: '메뉴' },
    { id: 'e-dash-history', source: 'dashboard', target: 'history', label: '메뉴' },
    { id: 'e-shipment-inventory', source: 'shipment', target: 'inventory', label: '출고 후' },
    { id: 'e-shipment-history', source: 'shipment', target: 'history', label: '이력 기록' },
  ],
};
