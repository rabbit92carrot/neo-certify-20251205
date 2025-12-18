import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared';
import { Package, Factory, Truck, Boxes } from 'lucide-react';
import { getCachedCurrentUser } from '@/services/auth.service';
import { getManufacturerDashboardStatsOptimized } from '@/services/dashboard.service';

export const metadata = {
  title: '대시보드 | 제조사',
  description: '제조사 대시보드',
};

/**
 * 통계 카드 그리드 컴포넌트 (통합 RPC 호출 사용)
 * 4개 쿼리를 1개 DB 왕복으로 처리하여 성능 75% 향상
 */
async function StatsCardsGrid({ orgId }: { orgId: string }): Promise<React.ReactElement> {
  const statsResult = await getManufacturerDashboardStatsOptimized(orgId);
  const stats = statsResult.success
    ? statsResult.data!
    : {
        totalInventory: 0,
        todayProduction: 0,
        todayShipments: 0,
        activeProducts: 0,
      };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="총 재고량"
        value={stats.totalInventory}
        icon={Package}
        description="현재 보유 중인 총 재고"
      />
      <StatCard
        title="오늘 생산량"
        value={stats.todayProduction}
        icon={Factory}
        description="오늘 등록된 생산 수량"
      />
      <StatCard
        title="오늘 출고량"
        value={stats.todayShipments}
        icon={Truck}
        description="오늘 출고된 수량"
      />
      <StatCard
        title="활성 제품"
        value={stats.activeProducts}
        icon={Boxes}
        description="등록된 제품 종류"
      />
    </div>
  );
}

/**
 * 통계 카드 그리드 스켈레톤
 */
function StatsCardsGridSkeleton(): React.ReactElement {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="" value="" isLoading />
      <StatCard title="" value="" isLoading />
      <StatCard title="" value="" isLoading />
      <StatCard title="" value="" isLoading />
    </div>
  );
}

/**
 * 제조사 대시보드 페이지
 * 통합 DB 함수로 4개 통계를 1회 왕복으로 조회 (Phase 15 최적화)
 */
export default async function ManufacturerDashboardPage(): Promise<React.ReactElement> {
  const user = await getCachedCurrentUser();

  if (user?.organization.type !== 'MANUFACTURER') {
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
