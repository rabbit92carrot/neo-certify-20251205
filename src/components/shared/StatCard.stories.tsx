import type { Meta, StoryObj } from '@storybook/react';
import { StatCard } from './StatCard';
import { Package, TrendingUp, Users, ShoppingCart, Activity, Box } from 'lucide-react';

const meta = {
  title: 'Shared/Statistics/StatCard',
  component: StatCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: '총 재고',
    value: '1,234',
    icon: Package,
    description: '현재 보유 재고',
  },
};

export const WithTrend: Story = {
  args: {
    title: '오늘 출고',
    value: 56,
    icon: ShoppingCart,
    trend: 12.5,
    description: '전일 대비',
  },
};

export const NegativeTrend: Story = {
  args: {
    title: '이번 주 시술',
    value: 89,
    icon: Users,
    trend: -5.2,
    description: '전주 대비',
  },
};

export const Loading: Story = {
  args: {
    title: '통계 로딩 중',
    value: 0,
    isLoading: true,
  },
};

export const WithoutIcon: Story = {
  args: {
    title: '활성 제품',
    value: 8,
    description: '현재 활성화된 제품 수',
  },
};

export const LargeNumber: Story = {
  args: {
    title: '총 가상코드',
    value: '125,847',
    icon: Activity,
    description: '누적 생성된 코드',
  },
};

export const DashboardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-[600px]">
      <StatCard title="총 재고" value="1,234" icon={Package} description="현재 보유량" />
      <StatCard title="오늘 출고" value={56} icon={ShoppingCart} trend={12.5} description="전일 대비" />
      <StatCard title="활성 제품" value={8} icon={TrendingUp} />
      <StatCard title="오늘 생산" value={200} icon={Box} trend={-3.1} description="전일 대비" />
    </div>
  ),
};

export const ManufacturerDashboard: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-[600px]">
      <StatCard title="총 재고" value="5,234" icon={Package} />
      <StatCard title="오늘 생산" value={200} icon={Box} trend={15} description="전일 대비" />
      <StatCard title="오늘 출고" value={56} icon={ShoppingCart} />
      <StatCard title="활성 제품" value={12} icon={TrendingUp} />
    </div>
  ),
};

export const Clickable: Story = {
  args: {
    title: '클릭 가능',
    value: 100,
    icon: Package,
    description: '클릭하세요',
    onClick: () => alert('클릭됨!'),
    className: 'cursor-pointer hover:bg-gray-50 transition-colors',
  },
};
