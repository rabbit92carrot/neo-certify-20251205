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
 * Admin 역할 mock 데이터 매핑
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const adminMockData: Record<string, any> = {
  dashboard: adminDashboardMockData,
  // 다른 페이지 mock 데이터는 추후 추가
};
