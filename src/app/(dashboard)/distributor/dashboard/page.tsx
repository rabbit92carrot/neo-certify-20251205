import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/StatCard';
import { getCachedCurrentUser } from '@/services/auth.service';
import { getDistributorDashboardStatsOptimized } from '@/services/dashboard.service';
import { DistributorStatsCards } from '@/components/dashboard/DistributorStatsCards';

export const metadata = {
  title: '대시보드 | 유통사',
  description: '유통사 대시보드',
};

/**
 * 통계 카드 그리드 컴포넌트
 * Server에서 초기 데이터 fetch → Client에서 react-query로 자동 refetch (5분 간격)
 */
async function StatsCardsGrid({ orgId }: { orgId: string }): Promise<React.ReactElement> {
  const statsResult = await getDistributorDashboardStatsOptimized(orgId);
  const stats = statsResult.success
    ? statsResult.data!
    : {
        totalInventory: 0,
        todayReceived: 0,
        todayShipments: 0,
      };

  return <DistributorStatsCards organizationId={orgId} initialData={stats} />;
}

/**
 * 통계 카드 그리드 스켈레톤
 */
function StatsCardsGridSkeleton(): React.ReactElement {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard title="" value="" isLoading />
      <StatCard title="" value="" isLoading />
      <StatCard title="" value="" isLoading />
    </div>
  );
}

/**
 * 유통사 대시보드 페이지
 * 통합 DB 함수로 3개 통계를 1회 왕복으로 조회 + react-query 자동 refetch
 */
export default async function DistributorDashboardPage(): Promise<React.ReactElement> {
  const user = await getCachedCurrentUser();

  if (user?.organization.type !== 'DISTRIBUTOR') {
    redirect('/login');
  }

  const org = user.organization;

  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <Card>
        <CardHeader>
          <CardTitle>환영합니다, {org.name}님</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">JAMBER 정품 인증 시스템에 로그인되었습니다.</p>
          <div className="mt-4 space-y-2 text-sm text-gray-500">
            <p>이메일: {org.email}</p>
            <p>사업자번호: {org.business_number}</p>
            <p>대표자: {org.representative_name}</p>
          </div>
        </CardContent>
      </Card>

      {/* 통계 카드 - SSR + react-query 자동 refetch (5분 간격) */}
      <Suspense fallback={<StatsCardsGridSkeleton />}>
        <StatsCardsGrid orgId={org.id} />
      </Suspense>
    </div>
  );
}
