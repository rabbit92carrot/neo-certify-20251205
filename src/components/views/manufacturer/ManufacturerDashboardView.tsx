'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/StatCard';
import { Package, Factory, Truck, Boxes } from 'lucide-react';

/**
 * Manufacturer Dashboard 통계 데이터
 */
export interface ManufacturerDashboardStats {
  totalInventory: number;
  todayProduction: number;
  todayShipments: number;
  activeProducts: number;
}

/**
 * ManufacturerDashboardView Props
 */
export interface ManufacturerDashboardViewProps {
  organization: {
    name: string;
    email: string;
    business_number?: string;
    representative_name?: string;
  };
  stats: ManufacturerDashboardStats;
}

/**
 * 제조사 대시보드 View 컴포넌트
 * props 기반으로 UI만 렌더링 (데이터 fetch는 page.tsx에서 수행)
 */
export function ManufacturerDashboardView({
  organization,
  stats,
}: ManufacturerDashboardViewProps): React.ReactElement {
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="총 재고량"
          value={stats.totalInventory}
          icon={Package}
          description="현재 보유 중인 총 재고"
        />
        <StatCard
          title="오늘 생산량"
          value={stats.todayProduction}
          icon={Factory}
          description="오늘 등록된 생산 수량"
        />
        <StatCard
          title="오늘 출고량"
          value={stats.todayShipments}
          icon={Truck}
          description="오늘 출고된 수량"
        />
        <StatCard
          title="활성 제품"
          value={stats.activeProducts}
          icon={Boxes}
          description="등록된 제품 종류"
        />
      </div>
    </div>
  );
}
