import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared';
import { Package, Factory, Truck, Boxes } from 'lucide-react';
import { getManufacturerDashboardStats } from '@/services/dashboard.service';

export const metadata = {
  title: '대시보드 | 제조사',
  description: '제조사 대시보드',
};

/**
 * 제조사 대시보드 페이지
 */
export default async function ManufacturerDashboardPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('auth_user_id', user!.id)
    .single();

  // 대시보드 통계 조회
  const statsResult = await getManufacturerDashboardStats(org!.id);
  const stats = statsResult.success
    ? statsResult.data!
    : {
        totalInventory: 0,
        todayProduction: 0,
        todayShipments: 0,
        activeProducts: 0,
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="총 재고량"
          value={stats.totalInventory.toLocaleString()}
          icon={Package}
          description="현재 보유 중인 총 재고"
        />
        <StatCard
          title="오늘 생산량"
          value={stats.todayProduction.toLocaleString()}
          icon={Factory}
          description="오늘 등록된 생산 수량"
        />
        <StatCard
          title="오늘 출고량"
          value={stats.todayShipments.toLocaleString()}
          icon={Truck}
          description="오늘 출고된 수량"
        />
        <StatCard
          title="활성 제품"
          value={stats.activeProducts.toLocaleString()}
          icon={Boxes}
          description="등록된 제품 종류"
        />
      </div>
    </div>
  );
}
