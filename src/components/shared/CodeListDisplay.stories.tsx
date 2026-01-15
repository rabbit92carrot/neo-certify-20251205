'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { CodeListDisplay } from './CodeListDisplay';
import { Toaster } from '@/components/ui/sonner';

const meta = {
  title: 'Shared/Data/CodeListDisplay',
  component: CodeListDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[500px] border rounded-lg p-4">
        <Story />
        <Toaster />
      </div>
    ),
  ],
} satisfies Meta<typeof CodeListDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

// 코드 생성 헬퍼
const generateCodes = (count: number): string[] =>
  Array.from({ length: count }, (_, i) =>
    `NC-${String(i + 1).padStart(8, '0')}`
  );

export const Default: Story = {
  args: {
    codes: generateCodes(20),
  },
};

export const FewCodes: Story = {
  args: {
    codes: generateCodes(5),
  },
};

export const SinglePage: Story = {
  args: {
    codes: generateCodes(12),
  },
};

export const ManyCodes: Story = {
  args: {
    codes: generateCodes(100),
  },
};

export const CustomPageSize: Story = {
  args: {
    codes: generateCodes(50),
    pageSize: 10,
  },
};

export const Empty: Story = {
  args: {
    codes: [],
  },
};

export const WithRealCodes: Story = {
  args: {
    codes: [
      'NC-00000001',
      'NC-00000002',
      'NC-00000003',
      'NC-00000004',
      'NC-00000005',
      'NC-00000006',
      'NC-00000007',
      'NC-00000008',
      'NC-00000009',
      'NC-00000010',
      'NC-00000011',
      'NC-00000012',
      'NC-00000013',
      'NC-00000014',
      'NC-00000015',
      'NC-00000016',
      'NC-00000017',
      'NC-00000018',
      'NC-00000019',
      'NC-00000020',
      'NC-00000021',
      'NC-00000022',
      'NC-00000023',
      'NC-00000024',
      'NC-00000025',
    ],
    pageSize: 20,
  },
};
