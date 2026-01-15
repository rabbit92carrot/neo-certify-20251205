import type { Meta, StoryObj } from '@storybook/react';
import { LoadingSpinner, PageLoading } from './LoadingSpinner';

const meta = {
  title: 'Shared/Feedback/LoadingSpinner',
  component: LoadingSpinner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LoadingSpinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

export const WithText: Story = {
  args: {
    text: '로딩 중...',
  },
};

export const WithCustomText: Story = {
  args: {
    size: 'lg',
    text: '데이터를 불러오는 중입니다...',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="sm" />
        <span className="text-xs text-gray-500">Small</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="md" />
        <span className="text-xs text-gray-500">Medium</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="lg" />
        <span className="text-xs text-gray-500">Large</span>
      </div>
    </div>
  ),
};

export const InButton: Story = {
  render: () => (
    <button
      disabled
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md opacity-70"
    >
      <LoadingSpinner size="sm" className="text-white [&_svg]:text-white" />
      <span>저장 중...</span>
    </button>
  ),
};

export const PageLoadingExample: Story = {
  render: () => (
    <div className="border rounded-lg w-[400px]">
      <PageLoading />
    </div>
  ),
};

export const InCard: Story = {
  render: () => (
    <div className="border rounded-lg p-8 w-[300px] flex flex-col items-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-sm text-gray-500">재고 정보 로딩 중...</p>
    </div>
  ),
};
