'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Factory,
  Truck,
  History,
  Warehouse,
  Settings,
  Stethoscope,
  Building2,
  UserCheck,
  AlertCircle,
  Bell,
  MoreHorizontal,
  LogOut,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/**
 * BottomNav는 Next.js Router에 의존합니다.
 * Storybook에서는 Mock 컴포넌트로 UI를 시뮬레이션합니다.
 */

type OrganizationType = 'MANUFACTURER' | 'DISTRIBUTOR' | 'HOSPITAL' | 'ADMIN';

interface NavItem {
  label: string;
  mobileLabel?: string;
  href: string;
  icon: React.ReactNode;
  isActive?: boolean;
}

const getNavItems = (type: OrganizationType, activeIndex: number = 0): { primary: NavItem[]; secondary: NavItem[] } => {
  const allItems = (() => {
    switch (type) {
      case 'MANUFACTURER':
        return [
          { label: '대시보드', mobileLabel: '홈', icon: <LayoutDashboard className="h-5 w-5" /> },
          { label: '제품 관리', mobileLabel: '제품', icon: <Package className="h-5 w-5" /> },
          { label: '생산 등록', mobileLabel: '생산', icon: <Factory className="h-5 w-5" /> },
          { label: '출고', mobileLabel: '출고', icon: <Truck className="h-5 w-5" /> },
          { label: '거래 이력', mobileLabel: '이력', icon: <History className="h-5 w-5" /> },
          { label: '재고', mobileLabel: '재고', icon: <Warehouse className="h-5 w-5" /> },
          { label: '설정', mobileLabel: '설정', icon: <Settings className="h-5 w-5" /> },
        ];
      case 'DISTRIBUTOR':
        return [
          { label: '대시보드', mobileLabel: '홈', icon: <LayoutDashboard className="h-5 w-5" /> },
          { label: '출고', mobileLabel: '출고', icon: <Truck className="h-5 w-5" /> },
          { label: '거래 이력', mobileLabel: '이력', icon: <History className="h-5 w-5" /> },
          { label: '재고', mobileLabel: '재고', icon: <Warehouse className="h-5 w-5" /> },
        ];
      case 'HOSPITAL':
        return [
          { label: '대시보드', mobileLabel: '홈', icon: <LayoutDashboard className="h-5 w-5" /> },
          { label: '시술 등록', mobileLabel: '시술', icon: <Stethoscope className="h-5 w-5" /> },
          { label: '시술 이력', mobileLabel: '이력', icon: <History className="h-5 w-5" /> },
          { label: '재고', mobileLabel: '재고', icon: <Warehouse className="h-5 w-5" /> },
          { label: '거래 이력', mobileLabel: '거래', icon: <History className="h-5 w-5" /> },
          { label: '설정', mobileLabel: '설정', icon: <Settings className="h-5 w-5" /> },
        ];
      case 'ADMIN':
        return [
          { label: '대시보드', mobileLabel: '홈', icon: <LayoutDashboard className="h-5 w-5" /> },
          { label: '조직 관리', mobileLabel: '조직', icon: <Building2 className="h-5 w-5" /> },
          { label: '승인 관리', mobileLabel: '승인', icon: <UserCheck className="h-5 w-5" /> },
          { label: '전체 이력', mobileLabel: '이력', icon: <History className="h-5 w-5" /> },
          { label: '회수 관리', mobileLabel: '회수', icon: <AlertCircle className="h-5 w-5" /> },
          { label: '알림 관리', mobileLabel: '알림', icon: <Bell className="h-5 w-5" /> },
        ];
    }
  })();

  const items = allItems.map((item, idx) => ({
    ...item,
    href: '#',
    isActive: idx === activeIndex,
  }));

  // Primary 4개, Secondary 나머지
  const primaryIndices = [0, 1, 2, 3].slice(0, Math.min(4, items.length));
  const primary = primaryIndices.map((i) => items[i]).filter(Boolean) as NavItem[];
  const secondary = items.filter((_, i) => !primaryIndices.includes(i));

  return { primary, secondary };
};

interface MockBottomNavProps {
  organizationType?: OrganizationType;
  organizationName?: string;
  activeIndex?: number;
}

function MockBottomNav({
  organizationType = 'MANUFACTURER',
  organizationName = '(주)네오디쎄',
  activeIndex = 0,
}: MockBottomNavProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { primary, secondary } = getNavItems(organizationType, activeIndex);
  const hasSecondary = secondary.length > 0;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200">
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
          {primary.map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px]',
                item.isActive ? 'text-blue-600' : 'text-gray-500'
              )}
            >
              {item.icon}
              <span className="text-[10px] font-medium leading-tight">
                {item.mobileLabel || item.label}
              </span>
            </a>
          ))}

          {hasSecondary && (
            <button
              onClick={() => setSheetOpen(true)}
              className="flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px] text-gray-500 hover:text-gray-700"
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[10px] font-medium">더보기</span>
            </button>
          )}
        </div>
      </nav>

      {/* 더보기 시트 */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-2xl">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-left">더보기</SheetTitle>
            <p className="text-sm text-gray-500 text-left">{organizationName}</p>
          </SheetHeader>

          <Separator className="my-2" />

          <nav className="grid gap-1 py-2">
            {secondary.map((item, idx) => (
              <a
                key={idx}
                href={item.href}
                onClick={() => setSheetOpen(false)}
                className={cn(
                  'flex items-center gap-4 w-full px-4 py-3 text-left rounded-lg transition-colors min-h-[48px]',
                  item.isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <span className={item.isActive ? 'text-blue-700' : 'text-gray-500'}>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </a>
            ))}
          </nav>

          <Separator className="my-2" />

          <div className="py-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-4 text-gray-700 hover:text-red-600 hover:bg-red-50 min-h-[48px]"
            >
              <LogOut className="h-5 w-5" />
              <span>로그아웃</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

const meta = {
  title: 'Layout/BottomNav',
  component: MockBottomNav,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MockBottomNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Manufacturer: Story = {
  args: {
    organizationType: 'MANUFACTURER',
    organizationName: '(주)네오디쎄',
    activeIndex: 0,
  },
};

export const ManufacturerShipment: Story = {
  args: {
    organizationType: 'MANUFACTURER',
    organizationName: '(주)네오디쎄',
    activeIndex: 3,
  },
};

export const Distributor: Story = {
  args: {
    organizationType: 'DISTRIBUTOR',
    organizationName: '메디플러스 유통',
    activeIndex: 0,
  },
};

export const Hospital: Story = {
  args: {
    organizationType: 'HOSPITAL',
    organizationName: '강남뷰티클리닉',
    activeIndex: 0,
  },
};

export const HospitalTreatment: Story = {
  args: {
    organizationType: 'HOSPITAL',
    organizationName: '강남뷰티클리닉',
    activeIndex: 1,
  },
};

export const Admin: Story = {
  args: {
    organizationType: 'ADMIN',
    organizationName: '네오인증서 관리자',
    activeIndex: 0,
  },
};
