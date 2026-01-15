'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  History,
  Warehouse,
  Settings,
  AlertCircle,
  Bell,
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
 * BottomNavSheet는 Next.js Router에 의존합니다.
 * Storybook에서는 Mock 컴포넌트로 UI를 시뮬레이션합니다.
 */

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  isActive?: boolean;
}

interface MockBottomNavSheetProps {
  open?: boolean;
  items?: NavItem[];
  organizationName?: string;
  activeIndex?: number;
}

const defaultItems: NavItem[] = [
  { label: '거래 이력', href: '#', icon: <History className="h-5 w-5" /> },
  { label: '재고', href: '#', icon: <Warehouse className="h-5 w-5" /> },
  { label: '설정', href: '#', icon: <Settings className="h-5 w-5" /> },
];

const adminItems: NavItem[] = [
  { label: '회수 관리', href: '#', icon: <AlertCircle className="h-5 w-5" /> },
  { label: '알림 관리', href: '#', icon: <Bell className="h-5 w-5" /> },
];

function MockBottomNavSheet({
  open: initialOpen = true,
  items = defaultItems,
  organizationName = '(주)네오디쎄',
  activeIndex = -1,
}: MockBottomNavSheetProps) {
  const [open, setOpen] = useState(initialOpen);

  const itemsWithActive = items.map((item, idx) => ({
    ...item,
    isActive: idx === activeIndex,
  }));

  return (
    <>
      <Button onClick={() => setOpen(true)}>더보기 시트 열기</Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-2xl">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-left">더보기</SheetTitle>
            <p className="text-sm text-gray-500 text-left">{organizationName}</p>
          </SheetHeader>

          <Separator className="my-2" />

          <nav className="grid gap-1 py-2">
            {itemsWithActive.map((item, idx) => (
              <a
                key={idx}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-4 w-full px-4 py-3 text-left rounded-lg transition-colors',
                  'min-h-[48px]',
                  item.isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <span className={item.isActive ? 'text-blue-700' : 'text-gray-500'}>
                  {item.icon}
                </span>
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
  title: 'Layout/BottomNavSheet',
  component: MockBottomNavSheet,
  parameters: {
    layout: 'centered',
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MockBottomNavSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    items: defaultItems,
    organizationName: '(주)네오디쎄',
  },
};

export const ManufacturerSheet: Story = {
  args: {
    open: true,
    items: defaultItems,
    organizationName: '(주)네오디쎄',
  },
};

export const AdminSheet: Story = {
  args: {
    open: true,
    items: adminItems,
    organizationName: '네오인증서 관리자',
  },
};

export const WithActiveItem: Story = {
  args: {
    open: true,
    items: defaultItems,
    organizationName: '(주)네오디쎄',
    activeIndex: 1,
  },
};

export const HospitalSheet: Story = {
  args: {
    open: true,
    items: [
      { label: '거래 이력', href: '#', icon: <History className="h-5 w-5" /> },
      { label: '설정', href: '#', icon: <Settings className="h-5 w-5" /> },
    ],
    organizationName: '강남뷰티클리닉',
  },
};

export const LongOrganizationName: Story = {
  args: {
    open: true,
    items: defaultItems,
    organizationName: '대한민국 서울특별시 강남구 청담동 소재 프리미엄 피부과 의원',
  },
};

export const Closed: Story = {
  args: {
    open: false,
    items: defaultItems,
    organizationName: '(주)네오디쎄',
  },
};
