'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/StatCard';
import { Package, PackageCheck, Truck } from 'lucide-react';

/**
 * Distributor Dashboard 통계 데이터
 */
export interface DistributorDashboardStats {
  totalInventory: number;
  todayReceived: number;
  todayShipments: number;
}

/**
 * DistributorDashboardView Props
 */
export interface DistributorDashboardViewProps {
  organization: {
    name: string;
    email: string;
    business_number?: string;
    representative_name?: string;
  };
  stats: DistributorDashboardStats;
}

/**
 * 유통사 대시보드 View 컴포넌트
 * props 기반으로 UI만 렌더링 (데이터 fetch는 page.tsx에서 수행)
 */
export function DistributorDashboardView({
  organization,
  stats,
}: DistributorDashboardViewProps): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <Card>
        <CardHeader>
          <CardTitle>환영합니다, {organization.name}님</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">JAMBER 정품 인증 시스템에 로그인되었습니다.</p>
          <div className="mt-4 space-y-2 text-sm text-gray-500">
            <p>이메일: {organization.email}</p>
            {organization.business_number && <p>사업자번호: {organization.business_number}</p>}
            {organization.representative_name && (
              <p>대표자: {organization.representative_name}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="총 재고량"
          value={stats.totalInventory}
          icon={Package}
          description="현재 보유 중인 총 재고"
        />
        <StatCard
          title="오늘 입고량"
          value={stats.todayReceived}
          icon={PackageCheck}
          description="오늘 입고된 수량"
        />
        <StatCard
          title="오늘 출고량"
          value={stats.todayShipments}
          icon={Truck}
          description="오늘 출고된 수량"
        />
      </div>
    </div>
  );
}
