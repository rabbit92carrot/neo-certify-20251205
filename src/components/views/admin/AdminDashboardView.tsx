'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/shared/StatCard';
import {
  Building2,
  UserCheck,
  AlertCircle,
  QrCode,
  ArrowRight,
} from 'lucide-react';
import { PendingOrganizationsList } from './PendingOrganizationsList';
import type { OrganizationType } from '@/types/api.types';

/**
 * Admin Dashboard 통계 데이터
 */
export interface AdminDashboardStats {
  totalOrganizations: number;
  pendingApprovals: number;
  todayRecalls: number;
  totalVirtualCodes: number;
}

/**
 * 승인 대기 조직 정보
 */
export interface PendingOrganization {
  id: string;
  name: string;
  email: string;
  type: OrganizationType;
  created_at: string;
}

/**
 * AdminDashboardView Props
 */
export interface AdminDashboardViewProps {
  organization: {
    name: string;
    email: string;
  };
  stats: AdminDashboardStats;
  pendingOrganizations: PendingOrganization[];
}

/**
 * 관리자 대시보드 View 컴포넌트
 * props 기반으로 UI만 렌더링 (데이터 fetch는 page.tsx에서 수행)
 */
export function AdminDashboardView({
  organization,
  stats,
  pendingOrganizations,
}: AdminDashboardViewProps): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <Card>
        <CardHeader>
          <CardTitle>환영합니다, {organization.name}님</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">JAMBER 정품 인증 시스템 관리자 페이지입니다.</p>
          <div className="mt-4 space-y-2 text-sm text-gray-500">
            <p>이메일: {organization.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* 통계 카드 (Phase 2C: prefetch=false로 초기 로드 부하 감소) */}
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

      {/* 빠른 링크 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 승인 대기 */}
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

        {/* 빠른 메뉴 */}
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
      </div>
    </div>
  );
}
