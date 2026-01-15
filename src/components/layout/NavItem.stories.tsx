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
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * NavItem은 Next.js Router에 의존합니다.
 * Storybook에서는 Mock 컴포넌트로 UI를 시뮬레이션합니다.
 */

interface MockNavItemProps {
  label?: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  href?: string;
}

function MockNavItem({
  label = '대시보드',
  icon = <LayoutDashboard className="h-5 w-5" />,
  isActive = false,
  href = '#',
}: MockNavItemProps) {
  return (
    <a
      href={href}
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-md transition-colors',
        'hover:bg-gray-100',
        isActive && 'bg-blue-50 text-blue-700 hover:bg-blue-50'
      )}
    >
      <span className={cn('h-5 w-5', isActive ? 'text-blue-700' : 'text-gray-500')}>
        {icon}
      </span>
      <span className={isActive ? 'text-blue-700' : 'text-gray-700'}>{label}</span>
    </a>
  );
}

const meta = {
  title: 'Layout/NavItem',
  component: MockNavItem,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-64 bg-white p-3 border rounded-lg">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MockNavItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: '대시보드',
    icon: <LayoutDashboard className="h-5 w-5" />,
    isActive: false,
  },
};

export const Active: Story = {
  args: {
    label: '대시보드',
    icon: <LayoutDashboard className="h-5 w-5" />,
    isActive: true,
  },
};

export const Products: Story = {
  args: {
    label: '제품 관리',
    icon: <Package className="h-5 w-5" />,
    isActive: false,
  },
};

export const ProductsActive: Story = {
  args: {
    label: '제품 관리',
    icon: <Package className="h-5 w-5" />,
    isActive: true,
  },
};

export const Production: Story = {
  args: {
    label: '생산 등록',
    icon: <Factory className="h-5 w-5" />,
    isActive: false,
  },
};

export const Shipment: Story = {
  args: {
    label: '출고',
    icon: <Truck className="h-5 w-5" />,
    isActive: false,
  },
};

export const History_: Story = {
  name: 'History',
  args: {
    label: '거래 이력',
    icon: <History className="h-5 w-5" />,
    isActive: false,
  },
};

export const Inventory: Story = {
  args: {
    label: '재고',
    icon: <Warehouse className="h-5 w-5" />,
    isActive: false,
  },
};

export const Settings_: Story = {
  name: 'Settings',
  args: {
    label: '설정',
    icon: <Settings className="h-5 w-5" />,
    isActive: false,
  },
};

export const Treatment: Story = {
  args: {
    label: '시술 등록',
    icon: <Stethoscope className="h-5 w-5" />,
    isActive: false,
  },
};

export const Organizations: Story = {
  args: {
    label: '조직 관리',
    icon: <Building2 className="h-5 w-5" />,
    isActive: false,
  },
};

export const Approvals: Story = {
  args: {
    label: '승인 관리',
    icon: <UserCheck className="h-5 w-5" />,
    isActive: false,
  },
};

export const Recalls: Story = {
  args: {
    label: '회수 관리',
    icon: <AlertCircle className="h-5 w-5" />,
    isActive: false,
  },
};

export const Alerts: Story = {
  args: {
    label: '알림 관리',
    icon: <Bell className="h-5 w-5" />,
    isActive: false,
  },
};

export const MultipleItems: Story = {
  render: () => (
    <div className="flex flex-col gap-1">
      <MockNavItem label="대시보드" icon={<LayoutDashboard className="h-5 w-5" />} isActive={true} />
      <MockNavItem label="제품 관리" icon={<Package className="h-5 w-5" />} isActive={false} />
      <MockNavItem label="생산 등록" icon={<Factory className="h-5 w-5" />} isActive={false} />
      <MockNavItem label="출고" icon={<Truck className="h-5 w-5" />} isActive={false} />
      <MockNavItem label="재고" icon={<Warehouse className="h-5 w-5" />} isActive={false} />
    </div>
  ),
};
