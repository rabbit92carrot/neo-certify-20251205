'use client';

/**
 * 하단 네비게이션 컴포넌트
 * 모바일에서만 표시되는 고정 하단 네비게이션 바입니다.
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getNavigationItems,
  type OrganizationType,
  type NavigationItem,
} from '@/constants';
import { NavItemIcon } from './NavItemIcon';
import { BottomNavSheet } from './BottomNavSheet';

/**
 * 역할별 Primary 메뉴 인덱스
 * 하단 네비게이션 바에 표시될 4개 메뉴의 인덱스
 */
const PRIMARY_INDICES: Record<OrganizationType, readonly number[]> = {
  MANUFACTURER: [0, 2, 3, 5], // 대시보드, 생산등록, 출고, 재고
  DISTRIBUTOR: [0, 1, 3, 4], // 대시보드, 출고, 재고, 거래이력
  HOSPITAL: [0, 1, 3, 4], // 대시보드, 시술, 재고, 거래이력
  ADMIN: [0, 1, 2, 3], // 대시보드, 조직관리, 승인, 전체이력
};

interface BottomNavProps {
  organizationType: OrganizationType;
  organizationName: string;
}

export function BottomNav({
  organizationType,
  organizationName,
}: BottomNavProps): React.ReactElement {
  const [sheetOpen, setSheetOpen] = useState(false);
  const pathname = usePathname();

  const allItems = getNavigationItems(organizationType);
  const primaryIndices = PRIMARY_INDICES[organizationType];

  // Primary 4개 항목
  const primaryItems = primaryIndices
    .map((i) => allItems[i])
    .filter((item): item is NavigationItem => item !== undefined);

  // 나머지 항목 (더보기에 표시)
  const secondaryItems = allItems.filter(
    (_, i) => !primaryIndices.includes(i)
  );

  // 더보기에 표시할 항목이 있는지 확인
  const hasSecondaryItems = secondaryItems.length > 0;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 md:hidden">
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
          {/* Primary 4개 메뉴 */}
          {primaryItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 transition-colors',
                  'min-h-[44px]',
                  isActive ? 'text-blue-600' : 'text-gray-500'
                )}
              >
                <NavItemIcon iconName={item.icon} className="h-5 w-5" />
                <span className="text-[10px] font-medium leading-tight">
                  {item.mobileLabel || item.label}
                </span>
              </Link>
            );
          })}

          {/* 더보기 버튼 */}
          {hasSecondaryItems && (
            <button
              onClick={() => setSheetOpen(true)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-colors',
                'min-h-[44px] text-gray-500 hover:text-gray-700'
              )}
              aria-label="더보기 메뉴 열기"
              aria-haspopup="dialog"
            >
              <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
              <span className="text-[10px] font-medium">더보기</span>
            </button>
          )}
        </div>
      </nav>

      {/* 더보기 시트 */}
      <BottomNavSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        items={secondaryItems}
        organizationName={organizationName}
      />
    </>
  );
}
