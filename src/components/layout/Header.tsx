'use client';

/**
 * 헤더 컴포넌트
 * 현재 페이지 타이틀과 사용자 정보를 표시합니다.
 */

import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getNavigationItems, type OrganizationType } from '@/constants';

interface HeaderProps {
  organizationType: OrganizationType;
}

/**
 * 현재 경로에 해당하는 페이지 타이틀 가져오기
 */
function getPageTitle(pathname: string, organizationType: OrganizationType): string {
  const navItems = getNavigationItems(organizationType);

  // 현재 경로와 일치하는 네비게이션 항목 찾기
  for (const item of navItems) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      return item.label;
    }
  }

  return '대시보드';
}

/**
 * 헤더 컴포넌트
 */
export function Header({ organizationType }: HeaderProps): React.ReactElement {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname, organizationType);

  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-6"
      role="banner"
      aria-label="페이지 헤더"
    >
      <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>

      <div className="flex items-center gap-4">
        {/* 알림 버튼 (2차 개발 예정) */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          disabled
          aria-label="알림 (준비 중)"
        >
          <Bell className="h-5 w-5 text-gray-500" aria-hidden="true" />
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] opacity-0"
            aria-hidden="true"
          >
            0
          </Badge>
        </Button>
      </div>
    </header>
  );
}
