import type { Meta, StoryObj } from '@storybook/react';
import { StatCard } from './StatCard';
import { Package, ShoppingCart, Users, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

/**
 * AsyncStatCard는 Server Component이므로 Storybook에서 직접 렌더링할 수 없습니다.
 * 대신 StatCard 컴포넌트의 다양한 상태를 시뮬레이션합니다.
 *
 * 실제 사용 예:
 * ```tsx
 * <Suspense fallback={<StatCardSkeleton />}>
 *   <AsyncStatCard
 *     title="총 재고"
 *     getValue={async () => await getInventoryCount()}
 *     icon={Package}
 *   />
 * </Suspense>
 * ```
 */
const meta = {
  title: 'Shared/Statistics/AsyncStatCard',
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

// 로딩 스켈레톤 컴포넌트
function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <Skeleton className="h-3 w-24 mt-2" />
      </CardContent>
    </Card>
  );
}

export const LoadingState: Story = {
  render: () => <StatCardSkeleton />,
};

export const LoadedState: Story = {
  args: {
    title: '총 재고',
    value: '1,234',
    icon: Package,
    description: '비동기로 불러온 값',
  },
};

export const WithAsyncData: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        AsyncStatCard는 Suspense와 함께 사용됩니다
      </p>
      <StatCard
        title="오늘 출고"
        value="56"
        icon={ShoppingCart}
        description="비동기 데이터"
      />
    </div>
  ),
};

export const DashboardUsage: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-[600px]">
      {/* 로딩 중인 카드 */}
      <StatCardSkeleton />
      {/* 로드된 카드들 */}
      <StatCard
        title="총 재고"
        value="1,234"
        icon={Package}
        description="현재 보유량"
      />
      <StatCard
        title="오늘 출고"
        value="56"
        icon={ShoppingCart}
        description="금일 출고량"
      />
      <StatCard
        title="이번 달 시술"
        value="892"
        icon={Users}
        description="월간 시술 건수"
      />
    </div>
  ),
};

export const ServerComponentNote: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-lg text-sm">
        <strong>AsyncStatCard 사용법:</strong>
        <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto">
{`// Server Component
export async function AsyncStatCard({
  title,
  getValue,
  icon,
  description,
}) {
  const value = await getValue();

  return (
    <StatCard
      title={title}
      value={value.toLocaleString()}
      icon={icon}
      description={description}
    />
  );
}

// 사용 예시
<Suspense fallback={<StatCardSkeleton />}>
  <AsyncStatCard
    title="총 재고"
    getValue={() => getInventoryCount()}
    icon={Package}
  />
</Suspense>`}
        </pre>
      </div>
      <StatCard
        title="로드된 결과"
        value="1,234"
        icon={TrendingUp}
        description="비동기 로드 완료"
      />
    </div>
  ),
};
