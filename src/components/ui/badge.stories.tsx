import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './badge';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

const meta = {
  title: 'UI/Data Display/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline'],
      description: '배지 스타일 변형',
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: '배지',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Badge variant="default">
        <Check /> 승인됨
      </Badge>
      <Badge variant="destructive">
        <X /> 거부됨
      </Badge>
      <Badge variant="secondary">
        <AlertTriangle /> 대기중
      </Badge>
      <Badge variant="outline">
        <Info /> 정보
      </Badge>
    </div>
  ),
};

export const StatusBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Badge variant="default">활성</Badge>
      <Badge variant="secondary">비활성</Badge>
      <Badge variant="destructive">만료</Badge>
      <Badge variant="outline">보류</Badge>
    </div>
  ),
};

export const OrganizationTypes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Badge variant="default">제조사</Badge>
      <Badge variant="secondary">유통사</Badge>
      <Badge variant="outline">병원</Badge>
    </div>
  ),
};
