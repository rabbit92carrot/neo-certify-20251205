import type { AdminDashboardViewProps } from '@/components/views/admin';

/**
 * Admin Dashboard mock 데이터
 */
export const adminDashboardMockData: AdminDashboardViewProps = {
  organization: {
    name: '테스트 관리자',
    email: 'admin@neocert.com',
  },
  stats: {
    totalOrganizations: 45,
    pendingApprovals: 3,
    todayRecalls: 2,
    totalVirtualCodes: 125000,
  },
  pendingOrganizations: [
    {
      id: '1',
      name: '테스트 제조사 A',
      email: 'manufacturer-a@test.com',
      type: 'MANUFACTURER',
      created_at: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      name: '테스트 유통사 B',
      email: 'distributor-b@test.com',
      type: 'DISTRIBUTOR',
      created_at: '2024-01-15T11:00:00Z',
    },
    {
      id: '3',
      name: '테스트 병원 C',
      email: 'hospital-c@test.com',
      type: 'HOSPITAL',
      created_at: '2024-01-15T11:30:00Z',
    },
  ],
};

/**
 * Admin History mock 데이터
 */
export const adminHistoryMockData = {
  events: [
    {
      id: 'event-001',
      eventTime: '2024-01-15T09:00:00Z',
      actionType: 'PRODUCED' as const,
      actionTypeLabel: '생산',
      fromOwner: {
        type: 'ORGANIZATION' as const,
        id: 'org-manufacturer',
        name: '테스트 제조사',
      },
      toOwner: null,
      isRecall: false,
      totalQuantity: 100,
      lotSummaries: [
        {
          lotId: 'lot-001',
          lotNumber: 'LOT-2024-001',
          productId: 'prod-001',
          productName: 'PDO Thread COG 19G-100mm',
          modelName: 'PT-COG-19G-100',
          quantity: 100,
          codeIds: ['code-001', 'code-002', 'code-003'],
        },
      ],
      sampleCodeIds: ['code-001', 'code-002'],
    },
    {
      id: 'event-002',
      eventTime: '2024-01-15T14:30:00Z',
      actionType: 'SHIPPED' as const,
      actionTypeLabel: '출고',
      fromOwner: {
        type: 'ORGANIZATION' as const,
        id: 'org-manufacturer',
        name: '테스트 제조사',
      },
      toOwner: {
        type: 'ORGANIZATION' as const,
        id: 'org-distributor',
        name: '테스트 유통사',
      },
      isRecall: false,
      totalQuantity: 50,
      lotSummaries: [
        {
          lotId: 'lot-001',
          lotNumber: 'LOT-2024-001',
          productId: 'prod-001',
          productName: 'PDO Thread COG 19G-100mm',
          modelName: 'PT-COG-19G-100',
          quantity: 50,
          codeIds: ['code-001', 'code-002'],
        },
      ],
      sampleCodeIds: ['code-001'],
    },
    {
      id: 'event-003',
      eventTime: '2024-01-16T10:00:00Z',
      actionType: 'RECEIVED' as const,
      actionTypeLabel: '입고',
      fromOwner: {
        type: 'ORGANIZATION' as const,
        id: 'org-manufacturer',
        name: '테스트 제조사',
      },
      toOwner: {
        type: 'ORGANIZATION' as const,
        id: 'org-distributor',
        name: '테스트 유통사',
      },
      isRecall: false,
      totalQuantity: 50,
      lotSummaries: [
        {
          lotId: 'lot-001',
          lotNumber: 'LOT-2024-001',
          productId: 'prod-001',
          productName: 'PDO Thread COG 19G-100mm',
          modelName: 'PT-COG-19G-100',
          quantity: 50,
          codeIds: ['code-001', 'code-002'],
        },
      ],
      sampleCodeIds: ['code-001'],
    },
    {
      id: 'event-004',
      eventTime: '2024-01-17T14:00:00Z',
      actionType: 'TREATED' as const,
      actionTypeLabel: '시술',
      fromOwner: {
        type: 'ORGANIZATION' as const,
        id: 'org-hospital',
        name: '테스트 병원',
      },
      toOwner: {
        type: 'PATIENT' as const,
        id: 'patient-001',
        name: '김*민',
      },
      isRecall: false,
      totalQuantity: 5,
      lotSummaries: [
        {
          lotId: 'lot-001',
          lotNumber: 'LOT-2024-001',
          productId: 'prod-001',
          productName: 'PDO Thread COG 19G-100mm',
          modelName: 'PT-COG-19G-100',
          quantity: 5,
          codeIds: ['code-003', 'code-004', 'code-005'],
        },
      ],
      sampleCodeIds: ['code-003'],
    },
  ],
};

/**
 * Admin 역할 mock 데이터 매핑
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const adminMockData: Record<string, any> = {
  dashboard: adminDashboardMockData,
  history: adminHistoryMockData,
};
