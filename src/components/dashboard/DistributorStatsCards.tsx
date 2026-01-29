'use client';

/**
 * 유통사 대시보드 통계 카드 (react-query)
 * Server Component에서 초기 데이터를 받고, 클라이언트에서 자동 refetch
 */

import { StatCard } from '@/components/shared/StatCard';
import { Package, PackageCheck, Truck } from 'lucide-react';
import { useDistributorDashboardStats } from '@/hooks/queries';
import type { DistributorDashboardStats } from '@/types/api.types';

interface DistributorStatsCardsProps {
  organizationId: string;
  initialData: DistributorDashboardStats;
}

export function DistributorStatsCards({
  organizationId,
  initialData,
}: DistributorStatsCardsProps): React.ReactElement {
  const { data: stats } = useDistributorDashboardStats(organizationId, initialData);

  const display = stats ?? initialData;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        title="총 재고량"
        value={display.totalInventory}
        icon={Package}
        description="현재 보유 중인 총 재고"
      />
      <StatCard
        title="오늘 입고량"
        value={display.todayReceived}
        icon={PackageCheck}
        description="오늘 입고된 수량"
      />
      <StatCard
        title="오늘 출고량"
        value={display.todayShipments}
        icon={Truck}
        description="오늘 출고된 수량"
      />
    </div>
  );
}
