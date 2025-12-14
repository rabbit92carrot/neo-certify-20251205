'use client';

/**
 * 모바일 헤더 컴포넌트
 * 햄버거 메뉴 버튼과 페이지 제목을 표시합니다.
 */

import { Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileHeaderProps {
  title: string;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function MobileHeader({
  title,
  onMenuClick,
  showMenuButton = false,
}: MobileHeaderProps): React.ReactElement {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-white px-4">
      {/* 좌측: 메뉴 버튼 또는 빈 공간 */}
      {showMenuButton ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="h-10 w-10"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">메뉴 열기</span>
        </Button>
      ) : (
        <div className="w-10" />
      )}

      {/* 중앙: 제목 */}
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>

      {/* 우측: 알림 버튼 (데모용) */}
      <Button variant="ghost" size="icon" className="h-10 w-10" disabled>
        <Bell className="h-5 w-5 text-gray-400" />
        <span className="sr-only">알림</span>
      </Button>
    </header>
  );
}
