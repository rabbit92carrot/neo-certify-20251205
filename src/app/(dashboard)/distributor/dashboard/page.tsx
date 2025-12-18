import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard, AsyncStatCard } from '@/components/shared';
import { Package, PackageCheck, Truck } from 'lucide-react';
import { getCachedCurrentUser } from '@/services/auth.service';
import { getTotalInventoryCount } from '@/services/inventory.service';
import {
  getDistributorTodayReceived,
  getDistributorTodayShipments,
} from '@/services/dashboard.service';

export const metadata = {
  title: '대시보드 | 유통사',
  description: '유통사 대시보드',
};

/**
 * 통계 카드 스켈레톤
 */
function StatCardSkeleton(): React.ReactElement {
  return <StatCard title="" value="" isLoading />;
}

/**
 * 유통사 대시보드 페이지
 * Suspense를 사용하여 각 통계 카드를 독립적으로 스트리밍
 */
export default async function DistributorDashboardPage(): Promise<React.ReactElement> {
  const user = await getCachedCurrentUser();

  if (user?.organization.type !== 'DISTRIBUTOR') {
    redirect('/login');
  }

  const org = user.organization;
  const orgId = org.id;

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

      {/* 통계 카드 - 각각 독립적으로 스트리밍 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Suspense fallback={<StatCardSkeleton />}>
          <AsyncStatCard
            title="총 재고량"
            getValue={() => getTotalInventoryCount(orgId)}
            icon={Package}
            description="현재 보유 중인 총 재고"
          />
        </Suspense>
        <Suspense fallback={<StatCardSkeleton />}>
          <AsyncStatCard
            title="오늘 입고량"
            getValue={() => getDistributorTodayReceived(orgId)}
            icon={PackageCheck}
            description="오늘 입고된 수량"
          />
        </Suspense>
        <Suspense fallback={<StatCardSkeleton />}>
          <AsyncStatCard
            title="오늘 출고량"
            getValue={() => getDistributorTodayShipments(orgId)}
            icon={Truck}
            description="오늘 출고된 수량"
          />
        </Suspense>
      </div>
    </div>
  );
}
