'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/StatCard';
import { Package, Stethoscope, Users } from 'lucide-react';

/**
 * Hospital Dashboard 통계 데이터
 */
export interface HospitalDashboardStats {
  totalInventory: number;
  todayTreatments: number;
  totalPatients: number;
}

/**
 * HospitalDashboardView Props
 */
export interface HospitalDashboardViewProps {
  organization: {
    name: string;
    email: string;
    business_number?: string;
    representative_name?: string;
  };
  stats: HospitalDashboardStats;
}

/**
 * 병원 대시보드 View 컴포넌트
 * props 기반으로 UI만 렌더링 (데이터 fetch는 page.tsx에서 수행)
 */
export function HospitalDashboardView({
  organization,
  stats,
}: HospitalDashboardViewProps): React.ReactElement {
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
          title="오늘 시술 건수"
          value={stats.todayTreatments}
          icon={Stethoscope}
          description="오늘 등록된 시술"
        />
        <StatCard
          title="총 환자 수"
          value={stats.totalPatients}
          icon={Users}
          description="누적 시술 환자 수"
        />
      </div>
    </div>
  );
}
