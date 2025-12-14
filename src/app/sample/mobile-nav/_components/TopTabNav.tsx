'use client';

/**
 * 상단 탭 네비게이션 컴포넌트
 * 가로로 스크롤 가능한 pill 스타일 탭을 표시합니다.
 */

import { cn } from '@/lib/utils';
import type { NavigationItem } from '@/constants/navigation';
import { getIcon } from './iconMap';

interface TopTabNavProps {
  items: NavigationItem[];
  activeItem: string;
  onItemClick: (href: string) => void;
}

export function TopTabNav({
  items,
  activeItem,
  onItemClick,
}: TopTabNavProps): React.ReactElement {
  return (
    <div className="sticky top-14 z-20 bg-white border-b">
      <div
        className="overflow-x-auto scrollbar-hide"
        style={{
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        <div className="flex gap-2 px-4 py-3 min-w-max">
          {items.map((item) => {
            const Icon = getIcon(item.icon);
            const isActive = activeItem === item.href;

            return (
              <button
                key={item.href}
                onClick={() => onItemClick(item.href)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors',
                  'min-h-[40px]',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
