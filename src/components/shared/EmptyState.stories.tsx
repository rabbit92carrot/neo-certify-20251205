import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from './EmptyState';
import { Button } from '@/components/ui/button';
import { Package, FileSearch, Users, ShoppingCart, Plus, Search } from 'lucide-react';

const meta = {
  title: 'Shared/Feedback/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[400px] border rounded-lg p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: '데이터가 없습니다',
    description: '아직 등록된 데이터가 없습니다.',
  },
};

export const WithAction: Story = {
  args: {
    icon: Package,
    title: '등록된 제품이 없습니다',
    description: '새 제품을 등록하여 시작하세요.',
    action: <Button><Plus className="mr-2 h-4 w-4" /> 제품 등록</Button>,
  },
};

export const NoSearchResults: Story = {
  args: {
    icon: Search,
    title: '검색 결과가 없습니다',
    description: '다른 검색어로 다시 시도해보세요.',
  },
};

export const NoInventory: Story = {
  args: {
    icon: Package,
    title: '재고가 없습니다',
    description: '현재 보유 중인 재고가 없습니다.',
    action: (
      <Button variant="outline">
        재고 입고 요청
      </Button>
    ),
  },
};

export const NoShipments: Story = {
  args: {
    icon: ShoppingCart,
    title: '출고 이력이 없습니다',
    description: '아직 출고된 내역이 없습니다.',
    action: (
      <Button>
        <Plus className="mr-2 h-4 w-4" /> 새 출고 등록
      </Button>
    ),
  },
};

export const NoPatients: Story = {
  args: {
    icon: Users,
    title: '환자 기록이 없습니다',
    description: '시술 기록을 등록하면 환자 정보가 저장됩니다.',
  },
};

export const NoHistory: Story = {
  args: {
    icon: FileSearch,
    title: '이력이 없습니다',
    description: '선택한 기간에 해당하는 이력이 없습니다.',
    action: (
      <Button variant="outline">
        기간 변경
      </Button>
    ),
  },
};

export const NoPendingApprovals: Story = {
  args: {
    title: '승인 대기 중인 조직이 없습니다',
    description: '모든 가입 신청이 처리되었습니다.',
  },
};

export const CustomIcon: Story = {
  render: () => (
    <EmptyState
      icon={FileSearch}
      title="문서를 찾을 수 없습니다"
      description="요청하신 문서가 존재하지 않거나 삭제되었습니다."
      action={
        <div className="flex gap-2">
          <Button variant="outline">뒤로 가기</Button>
          <Button>홈으로</Button>
        </div>
      }
    />
  ),
};
