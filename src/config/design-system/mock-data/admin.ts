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
 * Admin Organizations mock 데이터
 */
export const adminOrganizationsMockData = {
  organizations: [
    {
      id: 'org-001',
      name: '테스트 제조사 A',
      email: 'manufacturer-a@test.com',
      type: 'MANUFACTURER' as const,
      status: 'ACTIVE' as const,
      createdAt: '2024-01-10',
    },
    {
      id: 'org-002',
      name: '테스트 유통사 B',
      email: 'distributor-b@test.com',
      type: 'DISTRIBUTOR' as const,
      status: 'ACTIVE' as const,
      createdAt: '2024-01-12',
    },
    {
      id: 'org-003',
      name: '테스트 병원 C',
      email: 'hospital-c@test.com',
      type: 'HOSPITAL' as const,
      status: 'PENDING_APPROVAL' as const,
      createdAt: '2024-01-15',
    },
    {
      id: 'org-004',
      name: '테스트 제조사 D',
      email: 'manufacturer-d@test.com',
      type: 'MANUFACTURER' as const,
      status: 'INACTIVE' as const,
      createdAt: '2024-01-08',
    },
  ],
  statusCounts: {
    total: 45,
    active: 38,
    inactive: 4,
    pendingApproval: 3,
    deleted: 0,
  },
};

/**
 * Admin Approvals mock 데이터
 */
export const adminApprovalsMockData = {
  pendingOrganizations: [
    {
      id: 'pending-001',
      name: '신규 제조사',
      email: 'new-mfr@test.com',
      type: 'MANUFACTURER' as const,
      businessNumber: '123-45-67890',
      representativeName: '홍길동',
      createdAt: '2024-01-15',
    },
    {
      id: 'pending-002',
      name: '신규 유통사',
      email: 'new-dist@test.com',
      type: 'DISTRIBUTOR' as const,
      businessNumber: '234-56-78901',
      representativeName: '김철수',
      createdAt: '2024-01-16',
    },
    {
      id: 'pending-003',
      name: '신규 병원',
      email: 'new-hospital@test.com',
      type: 'HOSPITAL' as const,
      businessNumber: '345-67-89012',
      representativeName: '박의사',
      createdAt: '2024-01-17',
    },
  ],
};

/**
 * Admin Recalls mock 데이터
 */
export const adminRecallsMockData = {
  recalls: [
    {
      id: 'recall-001',
      recallType: 'SHIPMENT' as const,
      recallerName: '테스트 제조사',
      targetName: '테스트 유통사',
      productName: 'PDO Thread COG 19G-100mm',
      quantity: 20,
      reason: '수량 오류로 인한 회수',
      createdAt: '2024-01-16 14:30',
    },
    {
      id: 'recall-002',
      recallType: 'TREATMENT' as const,
      recallerName: '테스트 병원',
      targetName: '김*민 환자',
      productName: 'PDO Thread MONO 23G-60mm',
      quantity: 5,
      reason: '환자 정보 오입력',
      createdAt: '2024-01-17 10:00',
    },
  ],
};

/**
 * Admin Alerts mock 데이터
 */
export const adminAlertsMockData = {
  alerts: [
    {
      id: 'alert-001',
      title: '시스템 점검 안내',
      content: '2024년 1월 20일 02:00-04:00 시스템 점검이 예정되어 있습니다.',
      targetType: 'ALL' as const,
      status: 'SENT' as const,
      sentAt: '2024-01-18 10:00',
      createdAt: '2024-01-18',
    },
    {
      id: 'alert-002',
      title: '신규 기능 안내',
      content: '제조사를 위한 새로운 리포트 기능이 추가되었습니다.',
      targetType: 'MANUFACTURER' as const,
      status: 'SCHEDULED' as const,
      scheduledAt: '2024-01-20 09:00',
      createdAt: '2024-01-17',
    },
    {
      id: 'alert-003',
      title: '정책 변경 안내 (임시저장)',
      content: '개인정보 처리방침이 변경될 예정입니다.',
      targetType: 'ALL' as const,
      status: 'DRAFT' as const,
      createdAt: '2024-01-16',
    },
  ],
  stats: {
    total: 15,
    sent: 10,
    scheduled: 3,
    draft: 2,
  },
};

/**
 * Admin Inbox mock 데이터
 */
export const adminInboxMockData = {
  messages: [
    {
      id: 'msg-001',
      subject: '조직 승인 요청',
      content: '신규 제조사 "테스트 제조사 E"가 가입 승인을 요청했습니다.',
      senderName: '시스템',
      senderType: 'SYSTEM' as const,
      isRead: false,
      createdAt: '2024-01-18 10:30',
    },
    {
      id: 'msg-002',
      subject: '문의사항',
      content: '제품 등록 관련 문의드립니다. UDI-DI 형식에 대해 확인 부탁드립니다.',
      senderName: '테스트 제조사',
      senderType: 'ORGANIZATION' as const,
      isRead: false,
      createdAt: '2024-01-17 15:00',
    },
    {
      id: 'msg-003',
      subject: '시스템 알림',
      content: '어제 총 1,250건의 거래가 처리되었습니다.',
      senderName: '시스템',
      senderType: 'SYSTEM' as const,
      isRead: true,
      createdAt: '2024-01-17 08:00',
    },
  ],
  unreadCount: 2,
};

/**
 * Admin 역할 mock 데이터 매핑
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const adminMockData: Record<string, any> = {
  dashboard: adminDashboardMockData,
  organizations: adminOrganizationsMockData,
  approvals: adminApprovalsMockData,
  history: adminHistoryMockData,
  recalls: adminRecallsMockData,
  alerts: adminAlertsMockData,
  inbox: adminInboxMockData,
};
