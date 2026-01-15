'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { Check } from 'lucide-react';

/**
 * SelectedProductDisplay는 현재 선택된 제품의 정보를 표시하는 컴포넌트입니다.
 */

interface MockProduct {
  id: string;
  name: string;
  model_name: string;
}

interface MockSelectedProductDisplayProps {
  product?: MockProduct;
}

const defaultProduct: MockProduct = {
  id: 'prod-001',
  name: 'PDO Thread Type A',
  model_name: 'PDO-A-100',
};

function MockSelectedProductDisplay({
  product = defaultProduct,
}: MockSelectedProductDisplayProps): React.ReactElement {
  return (
    <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
      <div className="flex items-center gap-2">
        <div className="rounded-full p-1.5 bg-primary text-primary-foreground shrink-0">
          <Check className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{product.name}</p>
          <p className="text-xs text-muted-foreground truncate">{product.model_name}</p>
        </div>
      </div>
    </div>
  );
}

const meta = {
  title: 'Forms/Lot/SelectedProductDisplay',
  component: MockSelectedProductDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[300px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MockSelectedProductDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    product: defaultProduct,
  },
};

export const LongProductName: Story = {
  args: {
    product: {
      id: 'prod-002',
      name: 'PDO Thread Premium Extra Long Version Special Edition',
      model_name: 'PDO-PREMIUM-EXTRA-LONG-500-SE',
    },
  },
};

export const ShortProductName: Story = {
  args: {
    product: {
      id: 'prod-003',
      name: 'Type A',
      model_name: 'A-100',
    },
  },
};
