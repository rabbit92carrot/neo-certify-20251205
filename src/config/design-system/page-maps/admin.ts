import type { PageMapConfig } from '@/components/design-system/types';

/**
 * 관리자 페이지 맵 설정
 */
export const adminPageMap: PageMapConfig = {
  nodes: [
    {
      id: 'dashboard',
      type: 'page',
      position: { x: 400, y: 0 },
      data: {
        label: '대시보드',
        route: '/admin/dashboard',
        pageType: 'dashboard',
        components: ['StatCard', 'Card', 'AdminDashboardView'],
        storybookPath: 'pages-admin-dashboard',
      },
    },
    {
      id: 'organizations',
      type: 'page',
      position: { x: 100, y: 150 },
      data: {
        label: '조직 관리',
        route: '/admin/organizations',
        pageType: 'table',
        components: ['OrganizationsTable', 'DataTable'],
        storybookPath: 'pages-admin-organizations',
      },
    },
    {
      id: 'approvals',
      type: 'page',
      position: { x: 300, y: 150 },
      data: {
        label: '가입 승인',
        route: '/admin/approvals',
        pageType: 'table',
        components: ['ApprovalTable', 'DataTable'],
        storybookPath: 'pages-admin-approvals',
      },
    },
    {
      id: 'history',
      type: 'page',
      position: { x: 500, y: 150 },
      data: {
        label: '전체 이력',
        route: '/admin/history',
        pageType: 'table',
        components: ['AdminHistoryTable', 'VirtualDataTable', 'AdminHistoryFilter'],
        storybookPath: 'pages-admin-history',
      },
    },
    {
      id: 'recalls',
      type: 'page',
      position: { x: 700, y: 150 },
      data: {
        label: '회수 이력',
        route: '/admin/recalls',
        pageType: 'table',
        components: ['RecallsTable', 'DataTable'],
        storybookPath: 'pages-admin-recalls',
      },
    },
    {
      id: 'alerts',
      type: 'page',
      position: { x: 300, y: 300 },
      data: {
        label: '제품 사용 알림',
        route: '/admin/alerts',
        pageType: 'table',
        components: ['OrganizationAlertTable', 'InactiveProductUsageTable'],
        storybookPath: 'pages-admin-alerts',
      },
    },
    {
      id: 'inbox',
      type: 'page',
      position: { x: 500, y: 300 },
      data: {
        label: '알림 보관함',
        route: '/admin/inbox',
        pageType: 'list',
        components: ['NotificationList'],
        storybookPath: 'pages-admin-inbox',
      },
    },
  ],
  edges: [
    { id: 'e-dash-organizations', source: 'dashboard', target: 'organizations', label: '메뉴' },
    { id: 'e-dash-approvals', source: 'dashboard', target: 'approvals', label: '메뉴' },
    { id: 'e-dash-history', source: 'dashboard', target: 'history', label: '메뉴' },
    { id: 'e-dash-recalls', source: 'dashboard', target: 'recalls', label: '메뉴' },
    { id: 'e-approvals-organizations', source: 'approvals', target: 'organizations', label: '승인 후' },
    { id: 'e-organizations-alerts', source: 'organizations', target: 'alerts', label: '알림 관리' },
    { id: 'e-history-recalls', source: 'history', target: 'recalls', label: '회수 필터' },
  ],
};
