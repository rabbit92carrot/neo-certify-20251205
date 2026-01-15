'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { CollapsibleCard } from './CollapsibleCard';
import { Badge } from '@/components/ui/badge';

const meta = {
  title: 'Shared/Layout/CollapsibleCard',
  component: CollapsibleCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[600px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CollapsibleCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: '출고 이력',
    subtitle: '2024-01-15 14:30',
    children: (
      <div className="space-y-2">
        <p className="text-sm">제품: PDO Thread Type A</p>
        <p className="text-sm">수량: 100개</p>
        <p className="text-sm">수신자: 서울미래의원</p>
      </div>
    ),
  },
};

export const WithBadges: Story = {
  args: {
    title: 'LOT-2024-001',
    subtitle: '2024-01-15 생산',
    badges: [
      { text: 'PDO-A-100', variant: 'secondary' },
      { text: '150개', variant: 'outline' },
    ],
    children: (
      <div className="space-y-2">
        <p className="text-sm">제품명: PDO Thread Type A</p>
        <p className="text-sm">생산일: 2024-01-15</p>
        <p className="text-sm">유효기간: 2026-01-15</p>
      </div>
    ),
  },
};

export const WithSummary: Story = {
  args: {
    title: '출고 #1234',
    subtitle: '서울미래의원으로 출고',
    summary: (
      <div className="flex items-center gap-2">
        <Badge variant="secondary">PDO Thread Type A</Badge>
        <span>x 50개</span>
      </div>
    ),
    children: (
      <div className="space-y-3">
        <div className="text-sm">
          <strong>출고일시:</strong> 2024-01-15 14:30:00
        </div>
        <div className="text-sm">
          <strong>수신 조직:</strong> 서울미래의원
        </div>
        <div className="text-sm">
          <strong>코드 목록:</strong>
        </div>
        <div className="grid grid-cols-4 gap-1 text-xs font-mono">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="bg-gray-100 px-2 py-1 rounded">
              NC-{String(i + 1).padStart(8, '0')}
            </span>
          ))}
        </div>
      </div>
    ),
  },
};

export const DefaultOpen: Story = {
  args: {
    title: '펼쳐진 상태로 시작',
    subtitle: '기본값이 open인 카드',
    defaultOpen: true,
    children: (
      <div className="space-y-2">
        <p className="text-sm">이 카드는 기본적으로 펼쳐진 상태로 렌더링됩니다.</p>
        <p className="text-sm">사용자가 접기 버튼을 클릭하면 접힙니다.</p>
      </div>
    ),
  },
};

export const Recalled: Story = {
  args: {
    title: '출고 #1234',
    subtitle: '2024-01-15 14:30',
    isRecalled: true,
    recallReason: '배송 오류로 인한 회수',
    badges: [{ text: 'PDO-A-100', variant: 'secondary' }],
    children: (
      <div className="space-y-2">
        <p className="text-sm">원래 수신자: 서울미래의원</p>
        <p className="text-sm">출고 수량: 50개</p>
        <p className="text-sm">회수 일시: 2024-01-15 16:00</p>
      </div>
    ),
  },
};

export const HistoryList: Story = {
  render: () => (
    <div className="space-y-3">
      <CollapsibleCard
        title="출고 #1235"
        subtitle="2024-01-16 10:00"
        badges={[
          { text: 'PDO-A-100', variant: 'secondary' },
          { text: '30개', variant: 'outline' },
        ]}
        summary={<span>서울미래의원 → 30개</span>}
      >
        <div className="text-sm">출고 상세 정보</div>
      </CollapsibleCard>

      <CollapsibleCard
        title="출고 #1234"
        subtitle="2024-01-15 14:30"
        isRecalled
        recallReason="배송 오류"
        badges={[
          { text: 'PDO-B-200', variant: 'secondary' },
          { text: '50개', variant: 'outline' },
        ]}
        summary={<span>강남클리닉 → 50개</span>}
      >
        <div className="text-sm text-red-600">회수된 출고 건입니다.</div>
      </CollapsibleCard>

      <CollapsibleCard
        title="출고 #1233"
        subtitle="2024-01-14 09:00"
        badges={[
          { text: 'PDO-P-500', variant: 'secondary' },
          { text: '100개', variant: 'outline' },
        ]}
        summary={<span>메디컬 유통 → 100개</span>}
      >
        <div className="text-sm">출고 상세 정보</div>
      </CollapsibleCard>
    </div>
  ),
};
