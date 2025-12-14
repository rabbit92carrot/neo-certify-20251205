'use client';

/**
 * 대시보드 레이아웃 컴포넌트
 * 사이드바 + 헤더 + 메인 콘텐츠 영역으로 구성됩니다.
 */

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
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
      {/* 사이드바 (데스크톱만) */}
      <Sidebar organizationType={organizationType} organizationName={organizationName} />

      {/* 메인 영역 */}
      <div className="pb-20 md:pb-0 md:pl-64">
        {/* 헤더 */}
        <Header organizationType={organizationType} />

        {/* 콘텐츠 영역 */}
        <main className="p-4 md:p-6">{children}</main>
      </div>

      {/* 하단 네비게이션 (모바일만) */}
      <BottomNav organizationType={organizationType} organizationName={organizationName} />
    </div>
  );
}
