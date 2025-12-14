'use client';

/**
 * "더보기" 시트 컴포넌트
 * 하단에서 슬라이드업되어 추가 메뉴를 표시합니다.
 */

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { NavigationItem } from '@/constants/navigation';
import { getIcon } from './iconMap';

interface BottomNavMoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: NavigationItem[];
  activeItem: string;
  onItemClick: (href: string) => void;
}

export function BottomNavMoreSheet({
  open,
  onOpenChange,
  items,
  activeItem,
  onItemClick,
}: BottomNavMoreSheetProps): React.ReactElement {
  const handleItemClick = (href: string) => {
    onItemClick(href);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[60vh] rounded-t-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle>더보기</SheetTitle>
        </SheetHeader>
        <nav className="grid gap-1 pb-4">
          {items.map((item) => {
            const Icon = getIcon(item.icon);
            const isActive = activeItem === item.href;

            return (
              <button
                key={item.href}
                onClick={() => handleItemClick(item.href)}
                className={cn(
                  'flex items-center gap-4 w-full px-4 py-3 text-left rounded-lg transition-colors',
                  'min-h-[48px]',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
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
      </SheetContent>
    </Sheet>
  );
}
