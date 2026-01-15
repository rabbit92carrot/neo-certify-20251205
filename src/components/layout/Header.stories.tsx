'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * Header는 Next.js Router에 의존합니다.
 * Storybook에서는 Mock 컴포넌트로 UI를 시뮬레이션합니다.
 */

interface MockHeaderProps {
  pageTitle?: string;
  showNotification?: boolean;
  notificationCount?: number;
}

function MockHeader({
  pageTitle = '대시보드',
  showNotification = true,
  notificationCount = 0,
}: MockHeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-6"
      role="banner"
      aria-label="페이지 헤더"
    >
      <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>

      <div className="flex items-center gap-4">
        {showNotification && (
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            disabled={notificationCount === 0}
            aria-label={notificationCount > 0 ? `알림 ${notificationCount}개` : '알림 (준비 중)'}
          >
            <Bell className="h-5 w-5 text-gray-500" aria-hidden="true" />
            {notificationCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                aria-hidden="true"
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </Badge>
            )}
          </Button>
        )}
      </div>
    </header>
  );
}

const meta = {
  title: 'Layout/Header',
  component: MockHeader,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MockHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    pageTitle: '대시보드',
  },
};

export const ProductsPage: Story = {
  args: {
    pageTitle: '제품 관리',
  },
};

export const HistoryPage: Story = {
  args: {
    pageTitle: '거래 이력',
  },
};

export const WithNotifications: Story = {
  args: {
    pageTitle: '대시보드',
    showNotification: true,
    notificationCount: 5,
  },
};

export const ManyNotifications: Story = {
  args: {
    pageTitle: '대시보드',
    showNotification: true,
    notificationCount: 99,
  },
};

export const NoNotificationButton: Story = {
  args: {
    pageTitle: '설정',
    showNotification: false,
  },
};
