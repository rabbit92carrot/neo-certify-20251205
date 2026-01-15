import type { Meta, StoryObj } from '@storybook/react';
import { Separator } from './separator';

const meta = {
  title: 'UI/Layout/Separator',
  component: Separator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-[300px]">
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">제품 정보</h4>
        <p className="text-sm text-muted-foreground">제품에 대한 상세 정보입니다.</p>
      </div>
      <Separator className="my-4" />
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">재고 현황</h4>
        <p className="text-sm text-muted-foreground">현재 재고 상태입니다.</p>
      </div>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-5 items-center space-x-4 text-sm">
      <div>홈</div>
      <Separator orientation="vertical" />
      <div>제품</div>
      <Separator orientation="vertical" />
      <div>재고</div>
      <Separator orientation="vertical" />
      <div>이력</div>
    </div>
  ),
};

export const InCard: Story = {
  render: () => (
    <div className="w-[350px] rounded-lg border p-4">
      <h3 className="font-semibold">PDO Thread Type A</h3>
      <p className="text-sm text-muted-foreground">PDO-A-100</p>
      <Separator className="my-4" />
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">UDI-DI</dt>
          <dd>1234567890123</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">상태</dt>
          <dd className="text-green-600">활성</dd>
        </div>
      </dl>
      <Separator className="my-4" />
      <div className="flex justify-end gap-2">
        <button className="text-sm text-muted-foreground hover:text-foreground">
          수정
        </button>
        <Separator orientation="vertical" className="h-4" />
        <button className="text-sm text-destructive hover:text-destructive/80">
          삭제
        </button>
      </div>
    </div>
  ),
};

export const FormSections: Story = {
  render: () => (
    <div className="w-[400px] space-y-6">
      <div>
        <h4 className="font-medium">기본 정보</h4>
        <p className="text-sm text-muted-foreground">제품의 기본 정보를 입력합니다.</p>
      </div>
      <Separator />
      <div>
        <h4 className="font-medium">상세 설정</h4>
        <p className="text-sm text-muted-foreground">추가 설정을 구성합니다.</p>
      </div>
      <Separator />
      <div>
        <h4 className="font-medium">알림 설정</h4>
        <p className="text-sm text-muted-foreground">알림 관련 설정입니다.</p>
      </div>
    </div>
  ),
};
