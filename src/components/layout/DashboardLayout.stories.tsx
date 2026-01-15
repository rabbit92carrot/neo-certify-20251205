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
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * DashboardLayout은 Next.js Router에 의존합니다.
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

const getNavItems = (type: OrganizationType): NavItem[] => {
  switch (type) {
    case 'MANUFACTURER':
      return [
        { label: '대시보드', href: '#', icon: <LayoutDashboard className="h-5 w-5" />, isActive: true },
        { label: '제품 관리', href: '#', icon: <Package className="h-5 w-5" /> },
        { label: '생산 등록', href: '#', icon: <Factory className="h-5 w-5" /> },
        { label: '출고', href: '#', icon: <Truck className="h-5 w-5" /> },
        { label: '거래 이력', href: '#', icon: <History className="h-5 w-5" /> },
        { label: '재고', href: '#', icon: <Warehouse className="h-5 w-5" /> },
        { label: '설정', href: '#', icon: <Settings className="h-5 w-5" /> },
      ];
    case 'DISTRIBUTOR':
      return [
        { label: '대시보드', href: '#', icon: <LayoutDashboard className="h-5 w-5" />, isActive: true },
        { label: '출고', href: '#', icon: <Truck className="h-5 w-5" /> },
        { label: '거래 이력', href: '#', icon: <History className="h-5 w-5" /> },
        { label: '재고', href: '#', icon: <Warehouse className="h-5 w-5" /> },
      ];
    case 'HOSPITAL':
      return [
        { label: '대시보드', href: '#', icon: <LayoutDashboard className="h-5 w-5" />, isActive: true },
        { label: '시술 등록', href: '#', icon: <Stethoscope className="h-5 w-5" /> },
        { label: '시술 이력', href: '#', icon: <History className="h-5 w-5" /> },
        { label: '재고', href: '#', icon: <Warehouse className="h-5 w-5" /> },
        { label: '거래 이력', href: '#', icon: <History className="h-5 w-5" /> },
        { label: '설정', href: '#', icon: <Settings className="h-5 w-5" /> },
      ];
    case 'ADMIN':
      return [
        { label: '대시보드', href: '#', icon: <LayoutDashboard className="h-5 w-5" />, isActive: true },
        { label: '조직 관리', href: '#', icon: <Building2 className="h-5 w-5" /> },
        { label: '승인 관리', href: '#', icon: <UserCheck className="h-5 w-5" /> },
        { label: '전체 이력', href: '#', icon: <History className="h-5 w-5" /> },
        { label: '회수 관리', href: '#', icon: <AlertCircle className="h-5 w-5" /> },
        { label: '알림 관리', href: '#', icon: <Bell className="h-5 w-5" /> },
      ];
  }
};

interface MockSidebarProps {
  organizationType: OrganizationType;
  organizationName: string;
}

function MockSidebar({ organizationType, organizationName }: MockSidebarProps) {
  const navItems = getNavItems(organizationType);

  return (
    <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-64 flex-col border-r bg-white">
      <div className="flex h-16 items-center px-6 border-b">
        <div className="flex flex-col">
          <span className="text-lg font-bold text-blue-700">네오인증서</span>
          <span className="text-xs text-gray-500">{ORGANIZATION_TYPE_LABELS[organizationType]}</span>
        </div>
      </div>

      <div className="px-6 py-4 border-b">
        <p className="text-sm font-medium text-gray-900 truncate">{organizationName}</p>
      </div>

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

interface MockHeaderProps {
  pageTitle: string;
}

function MockHeader({ pageTitle }: MockHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-6">
      <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative" disabled>
          <Bell className="h-5 w-5 text-gray-500" />
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] opacity-0"
          >
            0
          </Badge>
        </Button>
      </div>
    </header>
  );
}

interface MockBottomNavProps {
  organizationType: OrganizationType;
}

function MockBottomNav({ organizationType }: MockBottomNavProps) {
  const navItems = getNavItems(organizationType).slice(0, 4);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 md:hidden">
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
        {navItems.map((item, idx) => (
          <a
            key={idx}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px]',
              item.isActive ? 'text-blue-600' : 'text-gray-500'
            )}
          >
            {item.icon}
            <span className="text-[10px] font-medium leading-tight">{item.label}</span>
          </a>
        ))}
        <button className="flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px] text-gray-500 hover:text-gray-700">
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px] font-medium">더보기</span>
        </button>
      </div>
    </nav>
  );
}

interface MockDashboardLayoutProps {
  organizationType?: OrganizationType;
  organizationName?: string;
  pageTitle?: string;
  children?: React.ReactNode;
}

function MockDashboardLayout({
  organizationType = 'MANUFACTURER',
  organizationName = '(주)네오디쎄',
  pageTitle = '대시보드',
  children,
}: MockDashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <MockSidebar organizationType={organizationType} organizationName={organizationName} />

      <div className="pb-20 md:pb-0 md:pl-64">
        <MockHeader pageTitle={pageTitle} />

        <main className="p-4 md:p-6">
          {children || (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-6 bg-white rounded-lg border shadow-sm">
                  <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                  <div className="h-8 w-16 bg-gray-300 rounded" />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <MockBottomNav organizationType={organizationType} />
    </div>
  );
}

const meta = {
  title: 'Layout/DashboardLayout',
  component: MockDashboardLayout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MockDashboardLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Manufacturer: Story = {
  args: {
    organizationType: 'MANUFACTURER',
    organizationName: '(주)네오디쎄',
    pageTitle: '대시보드',
  },
};

export const Distributor: Story = {
  args: {
    organizationType: 'DISTRIBUTOR',
    organizationName: '메디플러스 유통',
    pageTitle: '대시보드',
  },
};

export const Hospital: Story = {
  args: {
    organizationType: 'HOSPITAL',
    organizationName: '강남뷰티클리닉',
    pageTitle: '대시보드',
  },
};

export const Admin: Story = {
  args: {
    organizationType: 'ADMIN',
    organizationName: '네오인증서 관리자',
    pageTitle: '대시보드',
  },
};

export const WithContent: Story = {
  args: {
    organizationType: 'MANUFACTURER',
    organizationName: '(주)네오디쎄',
    pageTitle: '제품 관리',
    children: (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">제품 목록</h2>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-muted-foreground">컨텐츠 영역입니다.</p>
        </div>
      </div>
    ),
  },
};
