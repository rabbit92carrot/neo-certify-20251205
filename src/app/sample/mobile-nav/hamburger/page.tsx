'use client';

/**
 * Hamburger Menu 샘플 페이지
 * 전체 화면 오버레이 메뉴 패턴을 보여줍니다.
 */

import { useState } from 'react';
import { MANUFACTURER_NAV_ITEMS } from '@/constants/navigation';
import { MobileNavDemo } from '../_components/MobileNavDemo';
import { MockDashboard } from '../_components/MockDashboard';
import { MobileHeader } from '../_components/MobileHeader';
import { FullScreenMenu } from '../_components/FullScreenMenu';

export default function HamburgerSamplePage() {
  const [activeItem, setActiveItem] = useState('/manufacturer/dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavClick = (href: string) => {
    setActiveItem(href);
    setMenuOpen(false);
  };

  const currentLabel =
    MANUFACTURER_NAV_ITEMS.find((item) => item.href === activeItem)?.label ||
    '대시보드';

  return (
    <MobileNavDemo
      title="Hamburger Menu (Full Screen)"
      description="햄버거 아이콘을 눌러 전체 화면 메뉴를 엽니다. 모든 메뉴를 한눈에 볼 수 있지만, 숨겨진 메뉴라 발견성이 낮을 수 있습니다."
    >
      {/* 헤더 (햄버거 버튼 포함) */}
      <MobileHeader
        title={currentLabel}
        showMenuButton
        onMenuClick={() => setMenuOpen(true)}
      />

      {/* 컨텐츠 */}
      <MockDashboard selectedItem={currentLabel} />

      {/* 풀스크린 메뉴 */}
      <FullScreenMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        items={MANUFACTURER_NAV_ITEMS}
        activeItem={activeItem}
        onItemClick={handleNavClick}
      />
    </MobileNavDemo>
  );
}
