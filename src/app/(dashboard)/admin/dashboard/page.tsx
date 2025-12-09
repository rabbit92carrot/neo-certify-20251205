import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared';
import { Building2, UserCheck, AlertCircle, QrCode } from 'lucide-react';

export const metadata = {
  title: '대시보드 | 관리자',
  description: '관리자 대시보드',
};

/**
 * 관리자 대시보드 페이지
 */
export default async function AdminDashboardPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('auth_user_id', user!.id)
    .single();

  // TODO: Phase 10에서 실제 통계 데이터 조회
  const stats = {
    totalOrganizations: '-',
    pendingApprovals: '-',
    todayRecalls: '-',
    totalVirtualCodes: '-',
  };

  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <Card>
        <CardHeader>
          <CardTitle>환영합니다, {org?.name}님</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">PDO threads 정품 인증 시스템 관리자 페이지입니다.</p>
          <div className="mt-4 space-y-2 text-sm text-gray-500">
            <p>이메일: {org?.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="총 조직 수"
          value={stats.totalOrganizations}
          icon={Building2}
          description="등록된 조직 수"
        />
        <StatCard
          title="승인 대기"
          value={stats.pendingApprovals}
          icon={UserCheck}
          description="승인 대기 중인 조직"
        />
        <StatCard
          title="오늘 회수 건수"
          value={stats.todayRecalls}
          icon={AlertCircle}
          description="오늘 발생한 회수"
        />
        <StatCard
          title="총 가상 코드"
          value={stats.totalVirtualCodes}
          icon={QrCode}
          description="생성된 가상 식별코드"
        />
      </div>
    </div>
  );
}
