'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building2,
  UserCheck,
  AlertCircle,
  QrCode,
  ArrowRight,
} from 'lucide-react';
import { PendingOrganizationsList } from './PendingOrganizationsList';
import { AdminStatsCards } from '@/components/dashboard/AdminStatsCards';
import type { OrganizationType, AdminDashboardStats } from '@/types/api.types';

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
  organizationId: string;
  organization: {
    name: string;
    email: string;
  };
  stats: AdminDashboardStats;
  pendingOrganizations: PendingOrganization[];
}

/**
 * 관리자 대시보드 View 컴포넌트
 * react-query를 통해 통계를 자동 refetch합니다.
 */
export function AdminDashboardView({
  organizationId,
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

      {/* 통계 카드 - react-query 자동 refetch (5분 간격) */}
      <AdminStatsCards organizationId={organizationId} initialData={stats} />

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
