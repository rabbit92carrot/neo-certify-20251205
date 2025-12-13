import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/services/auth.service';
import { getHospitalDashboardStats } from '@/services/dashboard.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared';
import { Package, Stethoscope, Users } from 'lucide-react';

export const metadata = {
  title: '대시보드 | 병원',
  description: '병원 대시보드',
};

/**
 * 병원 대시보드 페이지
 */
export default async function HospitalDashboardPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser();

  if (user?.organization.type !== 'HOSPITAL') {
    redirect('/login');
  }

  const org = user.organization;

  // 실제 통계 데이터 조회
  const statsResult = await getHospitalDashboardStats(org.id);
  const stats = statsResult.success
    ? statsResult.data!
    : { totalInventory: 0, todayTreatments: 0, totalPatients: 0, todayShipments: 0 };

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

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="총 재고량"
          value={stats.totalInventory.toLocaleString()}
          icon={Package}
          description="현재 보유 중인 총 재고"
        />
        <StatCard
          title="오늘 시술 건수"
          value={stats.todayTreatments.toLocaleString()}
          icon={Stethoscope}
          description="오늘 등록된 시술"
        />
        <StatCard
          title="총 환자 수"
          value={stats.totalPatients.toLocaleString()}
          icon={Users}
          description="누적 시술 환자 수"
        />
      </div>
    </div>
  );
}
