'use client';

/**
 * Top Tabs 샘플 페이지
 * 상단 수평 스크롤 탭 패턴을 보여줍니다.
 */

import { useState } from 'react';
import { MANUFACTURER_NAV_ITEMS } from '@/constants/navigation';
import { MobileNavDemo } from '../_components/MobileNavDemo';
import { MockDashboard } from '../_components/MockDashboard';
import { MobileHeader } from '../_components/MobileHeader';
import { TopTabNav } from '../_components/TopTabNav';

export default function TopTabsSamplePage() {
  const [activeItem, setActiveItem] = useState('/manufacturer/dashboard');

  const handleNavClick = (href: string) => {
    setActiveItem(href);
  };

  const currentLabel =
    MANUFACTURER_NAV_ITEMS.find((item) => item.href === activeItem)?.label ||
    '대시보드';

  return (
    <MobileNavDemo
      title="Top Tabs (Scrollable)"
      description="상단에 수평 스크롤 가능한 탭을 배치합니다. 모든 메뉴가 노출되어 발견성이 좋지만, 많은 탭은 스크롤이 필요합니다."
    >
      {/* 헤더 */}
      <MobileHeader title="네오인증서" />

      {/* 스크롤 가능한 탭 네비게이션 */}
      <TopTabNav
        items={MANUFACTURER_NAV_ITEMS}
        activeItem={activeItem}
        onItemClick={handleNavClick}
      />

      {/* 컨텐츠 */}
      <MockDashboard selectedItem={currentLabel} />
    </MobileNavDemo>
  );
}
