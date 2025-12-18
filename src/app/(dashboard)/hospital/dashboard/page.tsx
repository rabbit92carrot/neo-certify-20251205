import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCachedCurrentUser } from '@/services/auth.service';
import { getHospitalDashboardStatsOptimized } from '@/services/dashboard.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared';
import { Package, Stethoscope, Users } from 'lucide-react';

export const metadata = {
  title: '대시보드 | 병원',
  description: '병원 대시보드',
};

/**
 * 통계 카드 그리드 컴포넌트 (통합 RPC 호출 사용)
 * 3개 쿼리를 1개 DB 왕복으로 처리하여 성능 향상
 */
async function StatsCardsGrid({ orgId }: { orgId: string }): Promise<React.ReactElement> {
  const statsResult = await getHospitalDashboardStatsOptimized(orgId);
  const stats = statsResult.success
    ? statsResult.data!
    : {
        totalInventory: 0,
        todayTreatments: 0,
        totalPatients: 0,
        todayShipments: 0,
      };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        title="총 재고량"
        value={stats.totalInventory}
        icon={Package}
        description="현재 보유 중인 총 재고"
      />
      <StatCard
        title="오늘 시술 건수"
        value={stats.todayTreatments}
        icon={Stethoscope}
        description="오늘 등록된 시술"
      />
      <StatCard
        title="총 환자 수"
        value={stats.totalPatients}
        icon={Users}
        description="누적 시술 환자 수"
      />
    </div>
  );
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
 * 병원 대시보드 페이지
 * 통합 DB 함수로 3개 통계를 1회 왕복으로 조회 (Phase 15 최적화)
 */
export default async function HospitalDashboardPage(): Promise<React.ReactElement> {
  const user = await getCachedCurrentUser();

  if (user?.organization.type !== 'HOSPITAL') {
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

      {/* 통계 카드 - 통합 RPC로 1회 DB 왕복 (Phase 15 최적화) */}
      <Suspense fallback={<StatsCardsGridSkeleton />}>
        <StatsCardsGrid orgId={org.id} />
      </Suspense>
    </div>
  );
}
