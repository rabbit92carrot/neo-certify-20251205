import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/shared';
import {
  Building2,
  UserCheck,
  AlertCircle,
  QrCode,
  ArrowRight,
  Factory,
  Truck,
  Stethoscope,
} from 'lucide-react';
import { getAdminDashboardStats } from '@/services/dashboard.service';
import { getPendingOrganizations } from '@/services/admin.service';
import { ORGANIZATION_TYPE_LABELS } from '@/constants/organization';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { OrganizationType } from '@/types/api.types';

export const metadata = {
  title: '대시보드 | 관리자',
  description: '관리자 대시보드',
};

/**
 * 조직 타입별 아이콘
 */
function getTypeIcon(type: OrganizationType): React.ReactNode {
  switch (type) {
    case 'MANUFACTURER':
      return <Factory className="h-4 w-4" />;
    case 'DISTRIBUTOR':
      return <Truck className="h-4 w-4" />;
    case 'HOSPITAL':
      return <Stethoscope className="h-4 w-4" />;
    default:
      return <Building2 className="h-4 w-4" />;
  }
}

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

  // 통계 조회
  const statsResult = await getAdminDashboardStats();
  const stats = statsResult.success
    ? statsResult.data!
    : {
        totalOrganizations: 0,
        pendingApprovals: 0,
        todayRecalls: 0,
        totalVirtualCodes: 0,
      };

  // 최근 승인 대기 조직 (5개)
  const pendingResult = await getPendingOrganizations({ page: 1, pageSize: 5 });
  const pendingOrganizations = pendingResult.success ? pendingResult.data!.items : [];

  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <Card>
        <CardHeader>
          <CardTitle>환영합니다, {org?.name}님</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">JAMBER 정품 인증 시스템 관리자 페이지입니다.</p>
          <div className="mt-4 space-y-2 text-sm text-gray-500">
            <p>이메일: {org?.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/organizations">
          <StatCard
            title="총 조직 수"
            value={stats.totalOrganizations.toLocaleString()}
            icon={Building2}
            description="등록된 조직 수"
          />
        </Link>
        <Link href="/admin/approvals">
          <StatCard
            title="승인 대기"
            value={stats.pendingApprovals.toLocaleString()}
            icon={UserCheck}
            description="승인 대기 중인 조직"
          />
        </Link>
        <Link href="/admin/recalls">
          <StatCard
            title="오늘 회수 건수"
            value={stats.todayRecalls.toLocaleString()}
            icon={AlertCircle}
            description="오늘 발생한 회수"
          />
        </Link>
        <Link href="/admin/history">
          <StatCard
            title="총 가상 코드"
            value={stats.totalVirtualCodes.toLocaleString()}
            icon={QrCode}
            description="생성된 가상 식별코드"
          />
        </Link>
      </div>

      {/* 빠른 링크 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 승인 대기 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">최근 승인 대기</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/approvals">
                전체 보기
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingOrganizations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                승인 대기 중인 조직이 없습니다.
              </p>
            ) : (
              <div className="space-y-3">
                {pendingOrganizations.map((pending) => (
                  <div
                    key={pending.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-white">
                        {getTypeIcon(pending.type as OrganizationType)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{pending.name}</p>
                        <p className="text-xs text-muted-foreground">{pending.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {ORGANIZATION_TYPE_LABELS[pending.type as OrganizationType]}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(pending.created_at), 'MM.dd HH:mm', { locale: ko })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 빠른 메뉴 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">빠른 메뉴</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/admin/organizations">
                <Building2 className="h-5 w-5" />
                <span>조직 관리</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/admin/approvals">
                <UserCheck className="h-5 w-5" />
                <span>가입 승인</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/admin/history">
                <QrCode className="h-5 w-5" />
                <span>전체 이력</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/admin/recalls">
                <AlertCircle className="h-5 w-5" />
                <span>회수 이력</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
