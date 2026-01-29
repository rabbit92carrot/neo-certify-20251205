'use client';

/**
 * 제조사 대시보드 통계 카드 (react-query)
 * Server Component에서 초기 데이터를 받고, 클라이언트에서 자동 refetch
 */

import { StatCard } from '@/components/shared/StatCard';
import { Package, Factory, Truck, Boxes } from 'lucide-react';
import { useManufacturerDashboardStats } from '@/hooks/queries';
import type { ManufacturerDashboardStats } from '@/types/api.types';

interface ManufacturerStatsCardsProps {
  organizationId: string;
  initialData: ManufacturerDashboardStats;
}

export function ManufacturerStatsCards({
  organizationId,
  initialData,
}: ManufacturerStatsCardsProps): React.ReactElement {
  const { data: stats } = useManufacturerDashboardStats(organizationId, initialData);

  const display = stats ?? initialData;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="총 재고량"
        value={display.totalInventory}
        icon={Package}
        description="현재 보유 중인 총 재고"
      />
      <StatCard
        title="오늘 생산량"
        value={display.todayProduction}
        icon={Factory}
        description="오늘 등록된 생산 수량"
      />
      <StatCard
        title="오늘 출고량"
        value={display.todayShipments}
        icon={Truck}
        description="오늘 출고된 수량"
      />
      <StatCard
        title="활성 제품"
        value={display.activeProducts}
        icon={Boxes}
        description="등록된 제품 종류"
      />
    </div>
  );
}
