import type { Meta, StoryObj } from '@storybook/react';
import { PageHeader } from './PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, Download, RefreshCw, Settings } from 'lucide-react';

const meta = {
  title: 'Shared/Layout/PageHeader',
  component: PageHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-full max-w-4xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: '페이지 제목',
    description: '페이지에 대한 설명입니다.',
  },
};

export const WithoutDescription: Story = {
  args: {
    title: '대시보드',
  },
};

export const WithSingleAction: Story = {
  args: {
    title: '제품 관리',
    description: '등록된 제품 목록을 관리합니다.',
    actions: (
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        새 제품 등록
      </Button>
    ),
  },
};

export const WithMultipleActions: Story = {
  args: {
    title: '재고 현황',
    description: '현재 보유 재고를 확인합니다.',
    actions: (
      <>
        <Button variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          새로고침
        </Button>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          내보내기
        </Button>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          생산 등록
        </Button>
      </>
    ),
  },
};

export const ManufacturerDashboard: Story = {
  args: {
    title: '제조사 대시보드',
    description: '제품 생산 및 출고 현황을 확인합니다.',
    actions: (
      <Button variant="outline">
        <Settings className="mr-2 h-4 w-4" />
        설정
      </Button>
    ),
  },
};

export const InventoryPage: Story = {
  args: {
    title: '재고 관리',
    description: '현재 보유 중인 재고 목록입니다.',
    actions: (
      <>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          CSV 내보내기
        </Button>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          출고 등록
        </Button>
      </>
    ),
  },
};

export const HistoryPage: Story = {
  args: {
    title: '거래 이력',
    description: '출고, 입고, 시술 이력을 조회합니다.',
    actions: (
      <Button variant="ghost" size="sm">
        <RefreshCw className="h-4 w-4" />
      </Button>
    ),
  },
};
