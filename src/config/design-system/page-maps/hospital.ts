import type { FrameMapConfig } from '@/components/design-system/types';

/**
 * 병원 페이지 맵 설정 (행 기반 레이아웃 - 100% 스케일)
 *
 * 레이아웃:
 * - 프레임 크기: 1200×836 (콘텐츠 800 + 헤더 36)
 * - 행 간격: 1000px (프레임 836px + 여백 164px)
 * - 컴포넌트 카드: 160×50px, x=1280 시작
 * - 카드 간격: 66px (카드 50px + 여백 16px)
 *
 * 페이지 순서: 사이드바 메뉴 순서대로
 */
export const hospitalPageMap: FrameMapConfig = {
  nodes: [
    // Row 0: 대시보드
    {
      id: 'dashboard',
      type: 'frame',
      position: { x: 0, y: 0 },
      data: {
        label: '대시보드',
        route: '/hospital/dashboard',
        pageType: 'dashboard',
        components: ['StatCard', 'Card'],
        storybookPath: 'pages-hospital-dashboard',
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

    // Row 1: 시술 등록
    {
      id: 'treatment',
      type: 'frame',
      position: { x: 0, y: 1000 },
      data: {
        label: '시술 등록',
        route: '/hospital/treatment',
        pageType: 'form',
        components: ['TreatmentForm', 'PatientSearch', 'CartDisplay', 'SearchableCombobox'],
        storybookPath: 'pages-hospital-treatment',
      },
    },
    {
      id: 'treatment-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 1050 },
      data: { componentName: 'TreatmentForm' },
    },
    {
      id: 'treatment-comp-2',
      type: 'component-card',
      position: { x: 1280, y: 1116 },
      data: { componentName: 'PatientSearch' },
    },
    {
      id: 'treatment-comp-3',
      type: 'component-card',
      position: { x: 1280, y: 1182 },
      data: { componentName: 'CartDisplay' },
    },
    {
      id: 'treatment-comp-4',
      type: 'component-card',
      position: { x: 1280, y: 1248 },
      data: { componentName: 'SearchableCombobox' },
    },

    // Row 2: 시술 이력
    {
      id: 'treatment-history',
      type: 'frame',
      position: { x: 0, y: 2000 },
      data: {
        label: '시술 이력',
        route: '/hospital/treatment-history',
        pageType: 'table',
        components: ['TreatmentHistoryTable', 'TreatmentRecallDialog', 'DataTable'],
        storybookPath: 'pages-hospital-treatment-history',
      },
    },
    {
      id: 'treatment-history-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 2050 },
      data: { componentName: 'TreatmentHistoryTable' },
    },
    {
      id: 'treatment-history-comp-2',
      type: 'component-card',
      position: { x: 1280, y: 2116 },
      data: { componentName: 'TreatmentRecallDialog' },
    },
    {
      id: 'treatment-history-comp-3',
      type: 'component-card',
      position: { x: 1280, y: 2182 },
      data: { componentName: 'DataTable' },
    },

    // Row 3: 폐기 등록
    {
      id: 'disposal',
      type: 'frame',
      position: { x: 0, y: 3000 },
      data: {
        label: '폐기 등록',
        route: '/hospital/disposal',
        pageType: 'form',
        components: ['DisposalForm', 'DisposalReasonSelect', 'CartDisplay'],
        storybookPath: 'pages-hospital-disposal',
      },
    },
    {
      id: 'disposal-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 3050 },
      data: { componentName: 'DisposalForm' },
    },
    {
      id: 'disposal-comp-2',
      type: 'component-card',
      position: { x: 1280, y: 3116 },
      data: { componentName: 'DisposalReasonSelect' },
    },
    {
      id: 'disposal-comp-3',
      type: 'component-card',
      position: { x: 1280, y: 3182 },
      data: { componentName: 'CartDisplay' },
    },

    // Row 4: 재고 조회
    {
      id: 'inventory',
      type: 'frame',
      position: { x: 0, y: 4000 },
      data: {
        label: '재고 조회',
        route: '/hospital/inventory',
        pageType: 'table',
        components: ['InventorySummaryCard', 'InventoryTable', 'DataTable'],
        storybookPath: 'pages-hospital-inventory',
      },
    },
    {
      id: 'inventory-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 4050 },
      data: { componentName: 'InventorySummaryCard' },
    },
    {
      id: 'inventory-comp-2',
      type: 'component-card',
      position: { x: 1280, y: 4116 },
      data: { componentName: 'InventoryTable' },
    },
    {
      id: 'inventory-comp-3',
      type: 'component-card',
      position: { x: 1280, y: 4182 },
      data: { componentName: 'DataTable' },
    },

    // Row 5: 거래 이력
    {
      id: 'history',
      type: 'frame',
      position: { x: 0, y: 5000 },
      data: {
        label: '거래 이력',
        route: '/hospital/history',
        pageType: 'table',
        components: ['HistoryFilterSection', 'TransactionHistoryCard', 'VirtualDataTable'],
        storybookPath: 'pages-hospital-history',
      },
    },
    {
      id: 'history-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 5050 },
      data: { componentName: 'HistoryFilterSection' },
    },
    {
      id: 'history-comp-2',
      type: 'component-card',
      position: { x: 1280, y: 5116 },
      data: { componentName: 'TransactionHistoryCard' },
    },
    {
      id: 'history-comp-3',
      type: 'component-card',
      position: { x: 1280, y: 5182 },
      data: { componentName: 'VirtualDataTable' },
    },

    // Row 6: 제품 관리 (Settings)
    {
      id: 'settings',
      type: 'frame',
      position: { x: 0, y: 6000 },
      data: {
        label: '제품 관리',
        route: '/hospital/settings',
        pageType: 'settings',
        components: ['HospitalProductSettingsForm'],
        storybookPath: 'pages-hospital-settings',
      },
    },
    {
      id: 'settings-comp-1',
      type: 'component-card',
      position: { x: 1280, y: 6050 },
      data: { componentName: 'HospitalProductSettingsForm' },
    },
  ],
  edges: [], // 행 기반 레이아웃에서는 엣지 제거
};
