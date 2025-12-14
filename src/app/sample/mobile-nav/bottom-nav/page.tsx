'use client';

/**
 * Bottom Navigation 샘플 페이지
 * 하단 네비게이션 바 + 더보기 시트 패턴을 보여줍니다.
 */

import { useState } from 'react';
import { MANUFACTURER_NAV_ITEMS } from '@/constants/navigation';
import { MobileNavDemo } from '../_components/MobileNavDemo';
import { MockDashboard } from '../_components/MockDashboard';
import { MobileHeader } from '../_components/MobileHeader';
import { BottomNavBar } from '../_components/BottomNavBar';
import { BottomNavMoreSheet } from '../_components/BottomNavMoreSheet';

// Primary 4개 (대시보드, 생산등록, 출고, 재고조회)
const PRIMARY_INDICES = [0, 2, 3, 5] as const;
const primaryItems = PRIMARY_INDICES.map((i) => MANUFACTURER_NAV_ITEMS[i]).filter(
  (item): item is NonNullable<typeof item> => item !== undefined
);
const secondaryItems = MANUFACTURER_NAV_ITEMS.filter(
  (_, i) => !PRIMARY_INDICES.includes(i as typeof PRIMARY_INDICES[number])
);

export default function BottomNavSamplePage() {
  const [activeItem, setActiveItem] = useState('/manufacturer/dashboard');
  const [moreOpen, setMoreOpen] = useState(false);

  const handleNavClick = (href: string) => {
    setActiveItem(href);
    setMoreOpen(false);
  };

  const currentLabel =
    MANUFACTURER_NAV_ITEMS.find((item) => item.href === activeItem)?.label ||
    '대시보드';

  return (
    <MobileNavDemo
      title="Bottom Navigation"
      description="하단에 주요 4개 메뉴를 고정 배치하고, 나머지는 '더보기' 시트로 접근합니다. 엄지손가락 접근성이 좋고, 주요 기능을 빠르게 탐색할 수 있습니다."
    >
      {/* 헤더 */}
      <MobileHeader title={currentLabel} />

      {/* 컨텐츠 (하단 네비게이션 높이만큼 패딩) */}
      <div className="pb-20">
        <MockDashboard selectedItem={currentLabel} />
      </div>

      {/* 하단 네비게이션 */}
      <BottomNavBar
        items={primaryItems}
        activeItem={activeItem}
        onItemClick={handleNavClick}
        onMoreClick={() => setMoreOpen(true)}
      />

      {/* 더보기 시트 */}
      <BottomNavMoreSheet
        open={moreOpen}
        onOpenChange={setMoreOpen}
        items={secondaryItems}
        activeItem={activeItem}
        onItemClick={handleNavClick}
      />
    </MobileNavDemo>
  );
}
