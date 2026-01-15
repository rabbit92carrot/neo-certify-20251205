'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

/**
 * LogoutButton은 Next.js Router에 의존합니다.
 * Storybook에서는 Mock 컴포넌트로 UI를 시뮬레이션합니다.
 */

interface MockLogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

function MockLogoutButton({
  variant = 'outline',
  size = 'default',
  className,
}: MockLogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    // 시뮬레이션
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success('로그아웃되었습니다 (Mock)');
    setIsLoading(false);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? '로그아웃 중...' : '로그아웃'}
    </Button>
  );
}

const meta = {
  title: 'Shared/Actions/LogoutButton',
  component: MockLogoutButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
} satisfies Meta<typeof MockLogoutButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Outline: Story = {
  args: {
    variant: 'outline',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    variant: 'outline',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    variant: 'outline',
  },
};

export const InHeader: Story = {
  render: () => (
    <div className="flex items-center justify-between p-4 border-b w-[600px]">
      <div className="font-semibold">Neo-Certify</div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">admin@neocert.com</span>
        <MockLogoutButton variant="ghost" size="sm" />
      </div>
    </div>
  ),
};

export const InSidebar: Story = {
  render: () => (
    <div className="w-[240px] border rounded-lg p-4 space-y-4">
      <div className="font-semibold text-lg">메뉴</div>
      <nav className="space-y-2">
        <a href="#" className="block p-2 hover:bg-gray-100 rounded">대시보드</a>
        <a href="#" className="block p-2 hover:bg-gray-100 rounded">제품 관리</a>
        <a href="#" className="block p-2 hover:bg-gray-100 rounded">재고 현황</a>
        <a href="#" className="block p-2 hover:bg-gray-100 rounded">거래 이력</a>
      </nav>
      <div className="pt-4 border-t">
        <MockLogoutButton variant="outline" size="sm" className="w-full" />
      </div>
    </div>
  ),
};
