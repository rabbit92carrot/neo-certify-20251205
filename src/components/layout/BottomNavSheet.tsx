'use client';

/**
 * 하단 네비게이션 "더보기" 시트 컴포넌트
 * 모바일에서 추가 메뉴 항목과 로그아웃을 표시합니다.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { NavigationItem } from '@/constants/navigation';
import { NavItemIcon } from './NavItemIcon';

interface BottomNavSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: NavigationItem[];
  organizationName: string;
}

export function BottomNavSheet({
  open,
  onOpenChange,
  items,
  organizationName,
}: BottomNavSheetProps): React.ReactElement {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-left">더보기</SheetTitle>
          <p className="text-sm text-gray-500 text-left">{organizationName}</p>
        </SheetHeader>

        <Separator className="my-2" />

        {/* 메뉴 항목 */}
        <nav className="grid gap-1 py-2">
          {items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  'flex items-center gap-4 w-full px-4 py-3 text-left rounded-lg transition-colors',
                  'min-h-[48px]',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <NavItemIcon
                  iconName={item.icon}
                  className={cn(
                    'h-5 w-5',
                    isActive ? 'text-blue-700' : 'text-gray-500'
                  )}
                />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <Separator className="my-2" />

        {/* 로그아웃 버튼 */}
        <div className="py-2">
          <form action="/api/auth/logout" method="POST">
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start gap-4 text-gray-700 hover:text-red-600 hover:bg-red-50 min-h-[48px]"
            >
              <LogOut className="h-5 w-5" />
              <span>로그아웃</span>
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
