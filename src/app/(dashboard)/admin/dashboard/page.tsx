import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
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
import { getAdminDashboardStatsOptimized } from '@/services/dashboard.service';
import { getPendingOrganizations } from '@/services/admin.service';
import { getCachedCurrentUser } from '@/services/auth.service';
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
 * 승인 대기 목록 컴포넌트
 */
async function PendingOrganizationsList(): Promise<React.ReactElement> {
  const pendingResult = await getPendingOrganizations({ page: 1, pageSize: 5 });
  const pendingOrganizations = pendingResult.success ? pendingResult.data!.items : [];

  if (pendingOrganizations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        승인 대기 중인 조직이 없습니다.
      </p>
    );
  }

  return (
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
  );
}

/**
 * 승인 대기 목록 스켈레톤
 */
function PendingListSkeleton(): React.ReactElement {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            <div className="space-y-2">
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="w-32 h-3 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="space-y-2 text-right">
            <div className="w-16 h-5 bg-gray-200 rounded animate-pulse" />
            <div className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 통계 카드 그리드 컴포넌트 (통합 RPC 호출 사용)
 * 4개 쿼리를 1개 DB 왕복으로 처리하여 성능 75% 향상
 */
async function StatsCardsGrid(): Promise<React.ReactElement> {
  const statsResult = await getAdminDashboardStatsOptimized();
  const stats = statsResult.success ? statsResult.data! : {
    totalOrganizations: 0,
    pendingApprovals: 0,
    todayRecalls: 0,
    totalVirtualCodes: 0,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Link href="/admin/organizations">
        <StatCard
          title="총 조직 수"
          value={stats.totalOrganizations}
          icon={Building2}
          description="등록된 조직 수"
        />
      </Link>
      <Link href="/admin/approvals">
        <StatCard
          title="승인 대기"
          value={stats.pendingApprovals}
          icon={UserCheck}
          description="승인 대기 중인 조직"
        />
      </Link>
      <Link href="/admin/recalls">
        <StatCard
          title="오늘 회수 건수"
          value={stats.todayRecalls}
          icon={AlertCircle}
          description="오늘 발생한 회수"
        />
      </Link>
      <Link href="/admin/history">
        <StatCard
          title="총 가상 코드"
          value={stats.totalVirtualCodes}
          icon={QrCode}
          description="생성된 가상 식별코드"
        />
      </Link>
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
 * 관리자 대시보드 페이지
 * 통합 DB 함수로 4개 통계를 1회 왕복으로 조회 (Phase 15 최적화)
 */
export default async function AdminDashboardPage(): Promise<React.ReactElement> {
  const user = await getCachedCurrentUser();

  if (!user || user.organization.type !== 'ADMIN') {
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
          <p className="text-gray-600">JAMBER 정품 인증 시스템 관리자 페이지입니다.</p>
          <div className="mt-4 space-y-2 text-sm text-gray-500">
            <p>이메일: {org.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* 통계 카드 - 통합 RPC로 1회 DB 왕복 (Phase 15 최적화) */}
      <Suspense fallback={<StatsCardsGridSkeleton />}>
        <StatsCardsGrid />
      </Suspense>

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
            <Suspense fallback={<PendingListSkeleton />}>
              <PendingOrganizationsList />
            </Suspense>
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
