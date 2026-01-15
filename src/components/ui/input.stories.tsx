import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './input';
import { Label } from './label';

const meta = {
  title: 'UI/Forms/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date'],
      description: '입력 타입',
    },
    placeholder: {
      control: 'text',
      description: '플레이스홀더',
    },
    disabled: {
      control: 'boolean',
      description: '비활성화',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: '텍스트를 입력하세요',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="email">이메일</Label>
      <Input id="email" type="email" placeholder="example@email.com" />
    </div>
  ),
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: '비밀번호',
  },
};

export const Number: Story = {
  args: {
    type: 'number',
    placeholder: '0',
    min: 0,
    max: 100,
  },
};

export const Search: Story = {
  args: {
    type: 'search',
    placeholder: '검색어를 입력하세요',
  },
};

export const Date: Story = {
  args: {
    type: 'date',
  },
};

export const Disabled: Story = {
  args: {
    placeholder: '비활성화된 입력',
    disabled: true,
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: '입력된 값',
  },
};

export const Invalid: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="invalid">필수 입력</Label>
      <Input id="invalid" aria-invalid="true" placeholder="오류 상태" />
      <p className="text-sm text-destructive">필수 입력 항목입니다.</p>
    </div>
  ),
};

export const AllTypes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>텍스트</Label>
        <Input type="text" placeholder="텍스트 입력" />
      </div>
      <div className="space-y-2">
        <Label>이메일</Label>
        <Input type="email" placeholder="email@example.com" />
      </div>
      <div className="space-y-2">
        <Label>비밀번호</Label>
        <Input type="password" placeholder="비밀번호" />
      </div>
      <div className="space-y-2">
        <Label>전화번호</Label>
        <Input type="tel" placeholder="010-0000-0000" />
      </div>
      <div className="space-y-2">
        <Label>숫자</Label>
        <Input type="number" placeholder="0" />
      </div>
    </div>
  ),
};
