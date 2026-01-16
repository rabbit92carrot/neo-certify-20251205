import type { FrameMapConfig } from '@/components/design-system/types';

/**
 * 관리자 페이지 맵 설정 (행 기반 레이아웃 - 100% 스케일)
 *
 * 레이아웃:
 * - 프레임 크기: 1200×836 (콘텐츠 800 + 헤더 36)
 * - 행 간격: 1000px (프레임 836px + 여백 164px)
 * - 컴포넌트 카드: 160×50px, x=1280 시작
 * - 카드 간격: 66px (카드 50px + 여백 16px)
 *
 * 페이지 순서: 사이드바 메뉴 순서대로
 */
export const adminPageMap: FrameMapConfig = {
  nodes: [
    // Row 0: 대시보드
    {
      id: 'dashboard',
      type: 'frame',
      position: { x: 0, y: 0 },
      data: {
        label: '대시보드',
        route: '/admin/dashboard',
        pageType: 'dashboard',
        components: ['StatCard', 'Card', 'AdminDashboardView'],
        storybookPath: 'pages-admin-dashboard',
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
    {
      id: 'dashboard-comp-3',
      type: 'component-card',
      position: { x: 1280, y: 182 },
      data: { componentName: 'AdminDashboardView' },
    },

    // Row 1: 조직 관리
    {
      id: 'organizations',
      type: 'frame',
      position: { x: 0, y: 1000 },
      data: {
        label: '조직 관리',
        route: '/admin/organizations',
        pageType: 'table',
        components: ['OrganizationsTable', 'DataTable'],
        storybookPath: 'pages-admin-organizations',
      },
    },
    {
      id: 'organizations-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 1050 },
      data: { componentName: 'OrganizationsTable' },
    },
    {
      id: 'organizations-comp-2',
      type: 'component-card',
      position: { x: 1280, y: 1116 },
      data: { componentName: 'DataTable' },
    },

    // Row 2: 가입 승인
    {
      id: 'approvals',
      type: 'frame',
      position: { x: 0, y: 2000 },
      data: {
        label: '가입 승인',
        route: '/admin/approvals',
        pageType: 'table',
        components: ['ApprovalTable', 'DataTable'],
        storybookPath: 'pages-admin-approvals',
      },
    },
    {
      id: 'approvals-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 2050 },
      data: { componentName: 'ApprovalTable' },
    },
    {
      id: 'approvals-comp-2',
      type: 'component-card',
      position: { x: 1280, y: 2116 },
      data: { componentName: 'DataTable' },
    },

    // Row 3: 전체 이력
    {
      id: 'history',
      type: 'frame',
      position: { x: 0, y: 3000 },
      data: {
        label: '전체 이력',
        route: '/admin/history',
        pageType: 'table',
        components: ['AdminHistoryTable', 'VirtualDataTable', 'AdminHistoryFilter'],
        storybookPath: 'pages-admin-history',
      },
    },
    {
      id: 'history-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 3050 },
      data: { componentName: 'AdminHistoryTable' },
    },
    {
      id: 'history-comp-2',
      type: 'component-card',
      position: { x: 1280, y: 3116 },
      data: { componentName: 'VirtualDataTable' },
    },
    {
      id: 'history-comp-3',
      type: 'component-card',
      position: { x: 1280, y: 3182 },
      data: { componentName: 'AdminHistoryFilter' },
    },

    // Row 4: 회수 이력
    {
      id: 'recalls',
      type: 'frame',
      position: { x: 0, y: 4000 },
      data: {
        label: '회수 이력',
        route: '/admin/recalls',
        pageType: 'table',
        components: ['RecallsTable', 'DataTable'],
        storybookPath: 'pages-admin-recalls',
      },
    },
    {
      id: 'recalls-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 4050 },
      data: { componentName: 'RecallsTable' },
    },
    {
      id: 'recalls-comp-2',
      type: 'component-card',
      position: { x: 1280, y: 4116 },
      data: { componentName: 'DataTable' },
    },

    // Row 5: 제품 사용 알림
    {
      id: 'alerts',
      type: 'frame',
      position: { x: 0, y: 5000 },
      data: {
        label: '제품 사용 알림',
        route: '/admin/alerts',
        pageType: 'table',
        components: ['OrganizationAlertTable', 'InactiveProductUsageTable'],
        storybookPath: 'pages-admin-alerts',
      },
    },
    {
      id: 'alerts-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 5050 },
      data: { componentName: 'OrganizationAlertTable' },
    },
    {
      id: 'alerts-comp-2',
      type: 'component-card',
      position: { x: 1280, y: 5116 },
      data: { componentName: 'InactiveProductUsageTable' },
    },

    // Row 6: 알림 보관함
    {
      id: 'inbox',
      type: 'frame',
      position: { x: 0, y: 6000 },
      data: {
        label: '알림 보관함',
        route: '/admin/inbox',
        pageType: 'list',
        components: ['NotificationList'],
        storybookPath: 'pages-admin-inbox',
      },
    },
    {
      id: 'inbox-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 6050 },
      data: { componentName: 'NotificationList' },
    },
  ],
  edges: [], // 행 기반 레이아웃에서는 엣지 제거
};
