import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared';
import { Package, PackageCheck, Truck } from 'lucide-react';

export const metadata = {
  title: '대시보드 | 유통사',
  description: '유통사 대시보드',
};

/**
 * 유통사 대시보드 페이지
 */
export default async function DistributorDashboardPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('auth_user_id', user!.id)
    .single();

  // TODO: Phase 5에서 실제 통계 데이터 조회
  const stats = {
    totalInventory: '-',
    todayReceived: '-',
    todayShipment: '-',
  };

  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <Card>
        <CardHeader>
          <CardTitle>환영합니다, {org?.name}님</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">PDO threads 정품 인증 시스템에 로그인되었습니다.</p>
          <div className="mt-4 space-y-2 text-sm text-gray-500">
            <p>이메일: {org?.email}</p>
            <p>사업자번호: {org?.business_number}</p>
            <p>대표자: {org?.representative_name}</p>
          </div>
        </CardContent>
      </Card>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="총 재고량"
          value={stats.totalInventory}
          icon={Package}
          description="현재 보유 중인 총 재고"
        />
        <StatCard
          title="오늘 입고량"
          value={stats.todayReceived}
          icon={PackageCheck}
          description="오늘 입고된 수량"
        />
        <StatCard
          title="오늘 출고량"
          value={stats.todayShipment}
          icon={Truck}
          description="오늘 출고된 수량"
        />
      </div>
    </div>
  );
}
