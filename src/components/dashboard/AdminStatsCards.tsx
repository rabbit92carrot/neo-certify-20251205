'use client';

/**
 * 관리자 대시보드 통계 카드 (react-query)
 * Server Component에서 초기 데이터를 받고, 클라이언트에서 자동 refetch
 */

import Link from 'next/link';
import { StatCard } from '@/components/shared/StatCard';
import { Building2, UserCheck, AlertCircle, QrCode } from 'lucide-react';
import { useAdminDashboardStats } from '@/hooks/queries';
import type { AdminDashboardStats } from '@/types/api.types';

interface AdminStatsCardsProps {
  organizationId: string;
  initialData: AdminDashboardStats;
}

export function AdminStatsCards({
  organizationId,
  initialData,
}: AdminStatsCardsProps): React.ReactElement {
  const { data: stats } = useAdminDashboardStats(organizationId, initialData);

  const display = stats ?? initialData;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Link href="/admin/organizations" prefetch={false}>
        <StatCard
          title="총 조직 수"
          value={display.totalOrganizations}
          icon={Building2}
          description="등록된 조직 수"
        />
      </Link>
      <Link href="/admin/approvals" prefetch={false}>
        <StatCard
          title="승인 대기"
          value={display.pendingApprovals}
          icon={UserCheck}
          description="승인 대기 중인 조직"
        />
      </Link>
      <Link href="/admin/recalls" prefetch={false}>
        <StatCard
          title="오늘 회수 건수"
          value={display.todayRecalls}
          icon={AlertCircle}
          description="오늘 발생한 회수"
        />
      </Link>
      <Link href="/admin/history" prefetch={false}>
        <StatCard
          title="총 가상 코드"
          value={display.totalVirtualCodes}
          icon={QrCode}
          description="생성된 가상 식별코드"
        />
      </Link>
    </div>
  );
}
