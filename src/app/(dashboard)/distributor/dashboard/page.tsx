import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared';
import { Package, PackageCheck, Truck } from 'lucide-react';
import { getCurrentUser } from '@/services/auth.service';
import { getDistributorDashboardStats } from '@/services/dashboard.service';

export const metadata = {
  title: '대시보드 | 유통사',
  description: '유통사 대시보드',
};

/**
 * 유통사 대시보드 페이지
 */
export default async function DistributorDashboardPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser();

  if (user?.organization.type !== 'DISTRIBUTOR') {
    redirect('/login');
  }

  // 통계 데이터 조회
  const statsResult = await getDistributorDashboardStats(user.organization.id);
  const stats = statsResult.success
    ? statsResult.data!
    : { totalInventory: 0, todayReceived: 0, todayShipments: 0 };

  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <Card>
        <CardHeader>
          <CardTitle>환영합니다, {user.organization.name}님</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">PDO threads 정품 인증 시스템에 로그인되었습니다.</p>
          <div className="mt-4 space-y-2 text-sm text-gray-500">
            <p>이메일: {user.organization.email}</p>
            <p>사업자번호: {user.organization.business_number}</p>
            <p>대표자: {user.organization.representative_name}</p>
          </div>
        </CardContent>
      </Card>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="총 재고량"
          value={stats.totalInventory.toLocaleString()}
          icon={Package}
          description="현재 보유 중인 총 재고"
        />
        <StatCard
          title="오늘 입고량"
          value={stats.todayReceived.toLocaleString()}
          icon={PackageCheck}
          description="오늘 입고된 수량"
        />
        <StatCard
          title="오늘 출고량"
          value={stats.todayShipments.toLocaleString()}
          icon={Truck}
          description="오늘 출고된 수량"
        />
      </div>
    </div>
  );
}
