import type { Meta, StoryObj } from '@storybook/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from './card';
import { Button } from './button';
import { Badge } from './badge';
import { MoreHorizontal } from 'lucide-react';

const meta = {
  title: 'UI/Layout/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>카드 제목</CardTitle>
        <CardDescription>카드에 대한 설명입니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>카드 내용이 여기에 표시됩니다.</p>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>카드 제목</CardTitle>
        <CardDescription>카드 설명</CardDescription>
      </CardHeader>
      <CardContent>
        <p>카드 내용</p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline">취소</Button>
        <Button>확인</Button>
      </CardFooter>
    </Card>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>카드 제목</CardTitle>
        <CardDescription>액션 버튼이 있는 카드</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon">
            <MoreHorizontal />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p>카드 내용</p>
      </CardContent>
    </Card>
  ),
};

export const ProductCard: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>PDO Thread Type A</CardTitle>
        <CardDescription>PDO-A-100</CardDescription>
        <CardAction>
          <Badge>활성</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">UDI-DI</dt>
            <dd>1234567890123</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">총 재고</dt>
            <dd>150개</dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          상세보기
        </Button>
      </CardFooter>
    </Card>
  ),
};

export const StatsCard: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">1,234</CardTitle>
        <CardDescription>총 재고 수량</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-green-600">+12.5% 전주 대비</p>
      </CardContent>
    </Card>
  ),
};

export const SimpleCard: Story = {
  render: () => (
    <Card>
      <CardContent className="pt-6">
        <p>헤더 없는 간단한 카드입니다.</p>
      </CardContent>
    </Card>
  ),
};
