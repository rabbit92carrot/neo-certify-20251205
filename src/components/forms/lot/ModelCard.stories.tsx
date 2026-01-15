'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { Package, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ModelCard는 아코디언 내부에서 개별 제품 모델을 표시하는 컴포넌트입니다.
 */

interface MockProduct {
  id: string;
  name: string;
  model_name: string;
  udi_di: string;
}

interface MockModelCardProps {
  product?: MockProduct;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

const defaultProduct: MockProduct = {
  id: 'prod-001',
  name: 'PDO Thread Type A',
  model_name: 'PDO-A-100',
  udi_di: '04012345678901',
};

function MockModelCard({
  product = defaultProduct,
  selected = false,
  disabled = false,
  onClick,
}: MockModelCardProps): React.ReactElement {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={cn(
        'cursor-pointer rounded-lg border p-2.5 transition-all duration-200',
        'hover:border-primary hover:shadow-sm',
        selected && 'border-primary ring-2 ring-primary/20 bg-primary/5',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'rounded-full p-1 shrink-0 transition-colors',
            selected ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-600'
          )}
        >
          {selected ? <Check className="h-3 w-3" /> : <Package className="h-3 w-3" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{product.model_name}</p>
          <p className="text-[10px] text-muted-foreground truncate">UDI: {product.udi_di}</p>
        </div>
      </div>
    </div>
  );
}

const meta = {
  title: 'Forms/Lot/ModelCard',
  component: MockModelCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[200px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MockModelCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    product: defaultProduct,
    selected: false,
    disabled: false,
  },
};

export const Selected: Story = {
  args: {
    product: defaultProduct,
    selected: true,
    disabled: false,
  },
};

export const Disabled: Story = {
  args: {
    product: defaultProduct,
    selected: false,
    disabled: true,
  },
};

export const LongModelName: Story = {
  args: {
    product: {
      id: 'prod-002',
      name: 'PDO Thread Premium Extra Long Version',
      model_name: 'PDO-PREMIUM-EXTRA-LONG-500',
      udi_di: '04012345678901234567890',
    },
    selected: false,
    disabled: false,
  },
};

export const MultipleCards: Story = {
  render: () => (
    <div className="space-y-2">
      <MockModelCard
        product={{ id: '1', name: 'Type A', model_name: 'PDO-A-100', udi_di: '04012345678901' }}
        selected={true}
      />
      <MockModelCard
        product={{ id: '2', name: 'Type B', model_name: 'PDO-B-200', udi_di: '04012345678902' }}
        selected={false}
      />
      <MockModelCard
        product={{ id: '3', name: 'Type C', model_name: 'PDO-C-300', udi_di: '04012345678903' }}
        selected={false}
        disabled={true}
      />
    </div>
  ),
};
