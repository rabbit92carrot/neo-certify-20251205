'use client';

/**
 * 병원 대시보드 통계 카드 (react-query)
 * Server Component에서 초기 데이터를 받고, 클라이언트에서 자동 refetch
 */

import { StatCard } from '@/components/shared/StatCard';
import { Package, Stethoscope, Users } from 'lucide-react';
import { useHospitalDashboardStats } from '@/hooks/queries';
import type { HospitalDashboardStats } from '@/types/api.types';

interface HospitalStatsCardsProps {
  organizationId: string;
  initialData: HospitalDashboardStats;
}

export function HospitalStatsCards({
  organizationId,
  initialData,
}: HospitalStatsCardsProps): React.ReactElement {
  const { data: stats } = useHospitalDashboardStats(organizationId, initialData);

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
        title="오늘 시술 건수"
        value={display.todayTreatments}
        icon={Stethoscope}
        description="오늘 등록된 시술"
      />
      <StatCard
        title="총 환자 수"
        value={display.totalPatients}
        icon={Users}
        description="누적 시술 환자 수"
      />
    </div>
  );
}
