'use client';

import type { Meta, StoryObj } from '@storybook/react';
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
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/**
 * Sidebar는 Next.js Router에 의존합니다.
 * Storybook에서는 Mock 컴포넌트로 UI를 시뮬레이션합니다.
 */

type OrganizationType = 'MANUFACTURER' | 'DISTRIBUTOR' | 'HOSPITAL' | 'ADMIN';

const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  MANUFACTURER: '제조사',
  DISTRIBUTOR: '유통사',
  HOSPITAL: '병원',
  ADMIN: '관리자',
};

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  isActive?: boolean;
}

const getNavItems = (type: OrganizationType, activeIndex: number = 0): NavItem[] => {
  const items = (() => {
    switch (type) {
      case 'MANUFACTURER':
        return [
          { label: '대시보드', href: '#', icon: <LayoutDashboard className="h-5 w-5" /> },
          { label: '제품 관리', href: '#', icon: <Package className="h-5 w-5" /> },
          { label: '생산 등록', href: '#', icon: <Factory className="h-5 w-5" /> },
          { label: '출고', href: '#', icon: <Truck className="h-5 w-5" /> },
          { label: '거래 이력', href: '#', icon: <History className="h-5 w-5" /> },
          { label: '재고', href: '#', icon: <Warehouse className="h-5 w-5" /> },
          { label: '설정', href: '#', icon: <Settings className="h-5 w-5" /> },
        ];
      case 'DISTRIBUTOR':
        return [
          { label: '대시보드', href: '#', icon: <LayoutDashboard className="h-5 w-5" /> },
          { label: '출고', href: '#', icon: <Truck className="h-5 w-5" /> },
          { label: '거래 이력', href: '#', icon: <History className="h-5 w-5" /> },
          { label: '재고', href: '#', icon: <Warehouse className="h-5 w-5" /> },
        ];
      case 'HOSPITAL':
        return [
          { label: '대시보드', href: '#', icon: <LayoutDashboard className="h-5 w-5" /> },
          { label: '시술 등록', href: '#', icon: <Stethoscope className="h-5 w-5" /> },
          { label: '시술 이력', href: '#', icon: <History className="h-5 w-5" /> },
          { label: '재고', href: '#', icon: <Warehouse className="h-5 w-5" /> },
          { label: '거래 이력', href: '#', icon: <History className="h-5 w-5" /> },
          { label: '설정', href: '#', icon: <Settings className="h-5 w-5" /> },
        ];
      case 'ADMIN':
        return [
          { label: '대시보드', href: '#', icon: <LayoutDashboard className="h-5 w-5" /> },
          { label: '조직 관리', href: '#', icon: <Building2 className="h-5 w-5" /> },
          { label: '승인 관리', href: '#', icon: <UserCheck className="h-5 w-5" /> },
          { label: '전체 이력', href: '#', icon: <History className="h-5 w-5" /> },
          { label: '회수 관리', href: '#', icon: <AlertCircle className="h-5 w-5" /> },
          { label: '알림 관리', href: '#', icon: <Bell className="h-5 w-5" /> },
        ];
    }
  })();

  return items.map((item, idx) => ({
    ...item,
    isActive: idx === activeIndex,
  }));
};

interface MockSidebarProps {
  organizationType?: OrganizationType;
  organizationName?: string;
  activeIndex?: number;
}

function MockSidebar({
  organizationType = 'MANUFACTURER',
  organizationName = '(주)네오디쎄',
  activeIndex = 0,
}: MockSidebarProps) {
  const navItems = getNavItems(organizationType, activeIndex);

  return (
    <aside className="flex fixed left-0 top-0 z-40 h-screen w-64 flex-col border-r bg-white">
      {/* 로고 및 조직 정보 */}
      <div className="flex h-16 items-center px-6 border-b">
        <div className="flex flex-col">
          <span className="text-lg font-bold text-blue-700">네오인증서</span>
          <span className="text-xs text-gray-500">{ORGANIZATION_TYPE_LABELS[organizationType]}</span>
        </div>
      </div>

      {/* 조직명 */}
      <div className="px-6 py-4 border-b">
        <p className="text-sm font-medium text-gray-900 truncate">{organizationName}</p>
      </div>

      {/* 네비게이션 메뉴 */}
      <ScrollArea className="flex-1 py-4">
        <nav className="flex flex-col gap-1 px-3">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-md transition-colors',
                'hover:bg-gray-100',
                item.isActive && 'bg-blue-50 text-blue-700 hover:bg-blue-50'
              )}
            >
              <span className={item.isActive ? 'text-blue-700' : 'text-gray-500'}>{item.icon}</span>
              <span className={item.isActive ? 'text-blue-700' : 'text-gray-700'}>{item.label}</span>
            </a>
          ))}
        </nav>
      </ScrollArea>

      <Separator />

      {/* 로그아웃 버튼 */}
      <div className="p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-700 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          <span>로그아웃</span>
        </Button>
      </div>
    </aside>
  );
}

const meta = {
  title: 'Layout/Sidebar',
  component: MockSidebar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MockSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Manufacturer: Story = {
  args: {
    organizationType: 'MANUFACTURER',
    organizationName: '(주)네오디쎄',
    activeIndex: 0,
  },
};

export const ManufacturerProducts: Story = {
  args: {
    organizationType: 'MANUFACTURER',
    organizationName: '(주)네오디쎄',
    activeIndex: 1,
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

export const AdminOrganizations: Story = {
  args: {
    organizationType: 'ADMIN',
    organizationName: '네오인증서 관리자',
    activeIndex: 1,
  },
};

export const LongOrganizationName: Story = {
  args: {
    organizationType: 'HOSPITAL',
    organizationName: '대한민국 서울특별시 강남구 청담동 소재 프리미엄 피부과 의원',
    activeIndex: 0,
  },
};
