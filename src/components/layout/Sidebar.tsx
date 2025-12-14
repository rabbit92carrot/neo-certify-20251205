'use client';

/**
 * 사이드바 컴포넌트
 * 역할별 네비게이션 메뉴를 렌더링합니다.
 */

import { LogOut } from 'lucide-react';
import { NavItem } from './NavItem';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { getNavigationItems, ORGANIZATION_TYPE_LABELS, type OrganizationType } from '@/constants';

interface SidebarProps {
  organizationType: OrganizationType;
  organizationName: string;
}

/**
 * 사이드바 컴포넌트
 */
export function Sidebar({ organizationType, organizationName }: SidebarProps): React.ReactElement {
  const navItems = getNavigationItems(organizationType);

  return (
    <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-64 flex-col border-r bg-white">
      {/* 로고 및 조직 정보 */}
      <div className="flex h-16 items-center px-6 border-b">
        <div className="flex flex-col">
          <span className="text-lg font-bold text-blue-700">네오인증서</span>
          <span className="text-xs text-gray-500">{ORGANIZATION_TYPE_LABELS[organizationType]}</span>
        </div>
      </div>

      {/* 조직명 */}
      <div className="px-6 py-4 border-b">
        <p className="text-sm font-medium text-gray-900 truncate">{organizationName}</p>
      </div>

      {/* 네비게이션 메뉴 */}
      <ScrollArea className="flex-1 py-4">
        <nav className="flex flex-col gap-1 px-3">
          {navItems.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </nav>
      </ScrollArea>

      <Separator />

      {/* 로그아웃 버튼 - API Route 방식 (hydration 불필요) */}
      <div className="p-4">
        <form action="/api/auth/logout" method="POST">
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 text-gray-700 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            <span>로그아웃</span>
          </Button>
        </form>
      </div>
    </aside>
  );
}
