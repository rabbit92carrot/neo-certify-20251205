'use client';

/**
 * 풀스크린 메뉴 컴포넌트
 * 햄버거 버튼 클릭 시 전체 화면을 덮는 메뉴를 표시합니다.
 */

import { X, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { NavigationItem } from '@/constants/navigation';
import { getIcon } from './iconMap';

interface FullScreenMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: NavigationItem[];
  activeItem: string;
  onItemClick: (href: string) => void;
}

export function FullScreenMenu({
  open,
  onOpenChange,
  items,
  activeItem,
  onItemClick,
}: FullScreenMenuProps): React.ReactElement | null {
  if (!open) {
    return null;
  }

  const handleItemClick = (href: string) => {
    onItemClick(href);
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white animate-in fade-in slide-in-from-left duration-200">
      {/* 헤더 */}
      <header className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="font-semibold text-gray-900">네오인증서</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="h-10 w-10"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">메뉴 닫기</span>
        </Button>
      </header>

      {/* 조직 정보 */}
      <div className="px-4 py-3 bg-gray-50">
        <p className="text-xs text-gray-500">제조사</p>
        <p className="font-medium text-gray-900">(주)네오코스메디</p>
      </div>

      <Separator />

      {/* 네비게이션 목록 */}
      <nav className="flex-1 overflow-y-auto py-2">
        {items.map((item) => {
          const Icon = getIcon(item.icon);
          const isActive = activeItem === item.href;

          return (
            <button
              key={item.href}
              onClick={() => handleItemClick(item.href)}
              className={cn(
                'flex items-center gap-4 w-full px-6 py-4 text-left transition-colors',
                'min-h-[52px]',
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5',
                  isActive ? 'text-blue-700' : 'text-gray-500'
                )}
              />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <Separator />

      {/* 로그아웃 버튼 */}
      <div className="p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-4 text-gray-500 hover:text-gray-700 h-12"
          disabled
        >
          <LogOut className="h-5 w-5" />
          <span>로그아웃</span>
        </Button>
      </div>
    </div>
  );
}
