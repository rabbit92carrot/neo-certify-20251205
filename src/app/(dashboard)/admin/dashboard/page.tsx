import { redirect } from 'next/navigation';
import { getAdminDashboardStatsOptimized } from '@/services/dashboard.service';
import { getPendingOrganizations } from '@/services/admin.service';
import { getCachedCurrentUser } from '@/services/auth.service';
import { AdminDashboardView } from '@/components/views/admin';
import type { OrganizationType } from '@/types/api.types';

export const metadata = {
  title: '대시보드 | 관리자',
  description: '관리자 대시보드',
};

/**
 * 관리자 대시보드 페이지
 * 통합 DB 함수로 4개 통계를 1회 왕복으로 조회 (Phase 15 최적화)
 */
export default async function AdminDashboardPage(): Promise<React.ReactElement> {
  const user = await getCachedCurrentUser();

  if (user?.organization.type !== 'ADMIN') {
    redirect('/login');
  }

  const org = user.organization;

  // 데이터 병렬 fetch
  const [statsResult, pendingResult] = await Promise.all([
    getAdminDashboardStatsOptimized(),
    getPendingOrganizations({ page: 1, pageSize: 5 }),
  ]);

  const stats = statsResult.success
    ? statsResult.data!
    : {
        totalOrganizations: 0,
        pendingApprovals: 0,
        todayRecalls: 0,
        totalVirtualCodes: 0,
      };

  const pendingOrganizations = pendingResult.success
    ? pendingResult.data!.items.map((item) => ({
        id: item.id,
        name: item.name,
        email: item.email,
        type: item.type as OrganizationType,
        created_at: item.created_at,
      }))
    : [];

  return (
    <AdminDashboardView
      organization={{
        name: org.name,
        email: org.email,
      }}
      stats={stats}
      pendingOrganizations={pendingOrganizations}
    />
  );
}
