import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAdminDashboardStatsOptimized } from '@/services/dashboard.service';
import { getPendingOrganizations } from '@/services/admin.service';
import { getCachedCurrentUser } from '@/services/auth.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/shared/StatCard';
import { PendingOrganizationsList } from '@/components/views/admin/PendingOrganizationsList';
import {
  Building2,
  UserCheck,
  AlertCircle,
  QrCode,
  ArrowRight,
} from 'lucide-react';
import type { OrganizationType } from '@/types/api.types';

export const metadata = {
  title: '대시보드 | 관리자',
  description: '관리자 대시보드',
};

/**
 * 통계 카드 그리드 (async Server Component)
 * Suspense boundary 내에서 통계 데이터 로딩
 */
async function StatsCardsGrid(): Promise<React.ReactElement> {
  const statsResult = await getAdminDashboardStatsOptimized();
  const stats = statsResult.success
    ? statsResult.data!
    : {
        totalOrganizations: 0,
        pendingApprovals: 0,
        todayRecalls: 0,
        totalVirtualCodes: 0,
      };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Link href="/admin/organizations" prefetch={false}>
        <StatCard
          title="총 조직 수"
          value={stats.totalOrganizations}
          icon={Building2}
          description="등록된 조직 수"
        />
      </Link>
      <Link href="/admin/approvals" prefetch={false}>
        <StatCard
          title="승인 대기"
          value={stats.pendingApprovals}
          icon={UserCheck}
          description="승인 대기 중인 조직"
        />
      </Link>
      <Link href="/admin/recalls" prefetch={false}>
        <StatCard
          title="오늘 회수 건수"
          value={stats.todayRecalls}
          icon={AlertCircle}
          description="오늘 발생한 회수"
        />
      </Link>
      <Link href="/admin/history" prefetch={false}>
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
 * 승인 대기 섹션 (async Server Component)
 * Suspense boundary 내에서 승인 대기 목록 로딩
 */
async function PendingApprovalsSection(): Promise<React.ReactElement> {
  const pendingResult = await getPendingOrganizations({ page: 1, pageSize: 5 });
  const pendingOrganizations = pendingResult.success
    ? pendingResult.data!.items.map((item) => ({
        id: item.id,
        name: item.name,
        email: item.email,
        type: item.type as OrganizationType,
        created_at: item.created_at,
      }))
    : [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">최근 승인 대기</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/approvals" prefetch={false}>
            전체 보기
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <PendingOrganizationsList pendingOrganizations={pendingOrganizations} />
      </CardContent>
    </Card>
  );
}

/**
 * 승인 대기 섹션 스켈레톤
 */
function PendingApprovalsSkeleton(): React.ReactElement {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
                <div className="space-y-1">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 빠른 메뉴 섹션 (정적 - Suspense 불필요)
 */
function QuickMenuSection(): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">빠른 메뉴</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
          <Link href="/admin/organizations" prefetch={false}>
            <Building2 className="h-5 w-5" />
            <span>조직 관리</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
          <Link href="/admin/approvals" prefetch={false}>
            <UserCheck className="h-5 w-5" />
            <span>가입 승인</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
          <Link href="/admin/history" prefetch={false}>
            <QrCode className="h-5 w-5" />
            <span>전체 이력</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
          <Link href="/admin/recalls" prefetch={false}>
            <AlertCircle className="h-5 w-5" />
            <span>회수 이력</span>
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * 관리자 대시보드 페이지
 * Suspense로 각 섹션을 독립적으로 스트리밍
 */
export default async function AdminDashboardPage(): Promise<React.ReactElement> {
  const user = await getCachedCurrentUser();

  if (user?.organization.type !== 'ADMIN') {
    redirect('/login');
  }

  const org = user.organization;

  return (
    <div className="space-y-6">
      {/* 환영 메시지 - 즉시 렌더링 */}
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

      {/* 통계 카드 - Suspense로 스트리밍 */}
      <Suspense fallback={<StatsCardsGridSkeleton />}>
        <StatsCardsGrid />
      </Suspense>

      {/* 2열 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 승인 대기 - Suspense로 스트리밍 */}
        <Suspense fallback={<PendingApprovalsSkeleton />}>
          <PendingApprovalsSection />
        </Suspense>

        {/* 빠른 메뉴 - 정적이므로 즉시 렌더링 */}
        <QuickMenuSection />
      </div>
    </div>
  );
}
