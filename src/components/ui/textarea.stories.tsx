import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './textarea';
import { Label } from './label';

const meta = {
  title: 'UI/Forms/Textarea',
  component: Textarea,
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
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: '내용을 입력하세요',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="memo">메모</Label>
      <Textarea id="memo" placeholder="메모를 입력하세요" />
    </div>
  ),
};

export const WithRows: Story = {
  args: {
    placeholder: '긴 내용을 입력하세요',
    rows: 6,
  },
};

export const Disabled: Story = {
  args: {
    placeholder: '비활성화된 텍스트 영역',
    disabled: true,
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: '이미 입력된 내용이 있습니다.\n여러 줄로 표시됩니다.',
  },
};

export const Invalid: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="invalid">필수 입력</Label>
      <Textarea id="invalid" aria-invalid="true" placeholder="오류 상태" />
      <p className="text-sm text-destructive">내용을 입력해주세요.</p>
    </div>
  ),
};
