'use client';

/**
 * 하단 네비게이션 바 컴포넌트
 * 4개의 주요 메뉴와 "더보기" 버튼을 표시합니다.
 */

import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavigationItem } from '@/constants/navigation';
import { getIcon } from './iconMap';

interface BottomNavBarProps {
  items: NavigationItem[];
  activeItem: string;
  onItemClick: (href: string) => void;
  onMoreClick: () => void;
}

export function BottomNavBar({
  items,
  activeItem,
  onItemClick,
  onMoreClick,
}: BottomNavBarProps): React.ReactElement {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-pb">
      <div className="max-w-[430px] mx-auto">
        <div className="grid grid-cols-5 h-16">
          {/* 주요 4개 메뉴 */}
          {items.slice(0, 4).map((item) => {
            const Icon = getIcon(item.icon);
            const isActive = activeItem === item.href;

            return (
              <button
                key={item.href}
                onClick={() => onItemClick(item.href)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 transition-colors',
                  'min-h-[44px]',
                  isActive ? 'text-blue-600' : 'text-gray-500'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}

          {/* 더보기 버튼 */}
          <button
            onClick={onMoreClick}
            className="flex flex-col items-center justify-center gap-1 text-gray-500 min-h-[44px] transition-colors hover:text-gray-700"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium">더보기</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
