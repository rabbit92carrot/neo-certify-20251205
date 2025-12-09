'use client';

/**
 * 대시보드 레이아웃 컴포넌트
 * 사이드바 + 헤더 + 메인 콘텐츠 영역으로 구성됩니다.
 */

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { OrganizationType } from '@/constants';

interface DashboardLayoutProps {
  children: React.ReactNode;
  organizationType: OrganizationType;
  organizationName: string;
}

/**
 * 대시보드 레이아웃 컴포넌트
 */
export function DashboardLayout({
  children,
  organizationType,
  organizationName,
}: DashboardLayoutProps): React.ReactElement {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 사이드바 */}
      <Sidebar organizationType={organizationType} organizationName={organizationName} />

      {/* 메인 영역 */}
      <div className="pl-64">
        {/* 헤더 */}
        <Header organizationType={organizationType} />

        {/* 콘텐츠 영역 */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
