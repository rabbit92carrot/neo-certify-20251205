import type { PageMapConfig } from '@/components/design-system/types';

/**
 * 병원 페이지 맵 설정
 */
export const hospitalPageMap: PageMapConfig = {
  nodes: [
    {
      id: 'dashboard',
      type: 'page',
      position: { x: 400, y: 0 },
      data: {
        label: '대시보드',
        route: '/hospital/dashboard',
        pageType: 'dashboard',
        components: ['StatCard', 'Card'],
        storybookPath: 'pages-hospital-dashboard',
      },
    },
    {
      id: 'treatment',
      type: 'page',
      position: { x: 100, y: 150 },
      data: {
        label: '시술 등록',
        route: '/hospital/treatment',
        pageType: 'form',
        components: ['TreatmentForm', 'CartDisplay', 'SearchableCombobox'],
        storybookPath: 'pages-hospital-treatment',
      },
    },
    {
      id: 'treatment-history',
      type: 'page',
      position: { x: 300, y: 150 },
      data: {
        label: '시술 이력',
        route: '/hospital/treatment-history',
        pageType: 'table',
        components: ['TreatmentHistoryTable', 'DataTable'],
        storybookPath: 'pages-hospital-treatment-history',
      },
    },
    {
      id: 'disposal',
      type: 'page',
      position: { x: 500, y: 150 },
      data: {
        label: '폐기 등록',
        route: '/hospital/disposal',
        pageType: 'form',
        components: ['DisposalForm', 'CartDisplay'],
        storybookPath: 'pages-hospital-disposal',
      },
    },
    {
      id: 'inventory',
      type: 'page',
      position: { x: 700, y: 150 },
      data: {
        label: '재고 조회',
        route: '/hospital/inventory',
        pageType: 'table',
        components: ['InventoryTable', 'DataTable'],
        storybookPath: 'pages-hospital-inventory',
      },
    },
    {
      id: 'history',
      type: 'page',
      position: { x: 200, y: 300 },
      data: {
        label: '거래 이력',
        route: '/hospital/history',
        pageType: 'table',
        components: ['TransactionHistoryTable', 'VirtualDataTable'],
        storybookPath: 'pages-hospital-history',
      },
    },
    {
      id: 'settings',
      type: 'page',
      position: { x: 600, y: 300 },
      data: {
        label: '제품 관리',
        route: '/hospital/settings',
        pageType: 'settings',
        components: ['HospitalProductSettingsForm'],
        storybookPath: 'pages-hospital-settings',
      },
    },
  ],
  edges: [
    { id: 'e-dash-treatment', source: 'dashboard', target: 'treatment', label: '메뉴' },
    { id: 'e-dash-treatment-history', source: 'dashboard', target: 'treatment-history', label: '메뉴' },
    { id: 'e-dash-disposal', source: 'dashboard', target: 'disposal', label: '메뉴' },
    { id: 'e-dash-inventory', source: 'dashboard', target: 'inventory', label: '메뉴' },
    { id: 'e-treatment-history-link', source: 'treatment', target: 'treatment-history', label: '시술 후' },
    { id: 'e-treatment-inventory', source: 'treatment', target: 'inventory', label: '재고 감소' },
    { id: 'e-disposal-inventory', source: 'disposal', target: 'inventory', label: '재고 감소' },
    { id: 'e-disposal-history', source: 'disposal', target: 'history', label: '이력 기록' },
    { id: 'e-settings-inventory', source: 'settings', target: 'inventory', label: '제품 설정' },
  ],
};
