'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CartDisplay } from './CartDisplay';
import type { CartItem } from '@/hooks/useCart';

const meta = {
  title: 'Shared/Cart/CartDisplay',
  component: CartDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CartDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

// 샘플 장바구니 아이템
const sampleItems: CartItem[] = [
  {
    productId: 'prod-001',
    productName: 'PDO Thread Type A',
    quantity: 10,
  },
  {
    productId: 'prod-002',
    productName: 'PDO Thread Type B',
    quantity: 5,
  },
  {
    productId: 'prod-003',
    productName: 'PDO Thread Premium',
    quantity: 3,
    lotId: 'lot-001',
    lotNumber: 'LOT-2024-001',
  },
];

export const Default: Story = {
  args: {
    items: sampleItems,
    onUpdateQuantity: () => {},
    onRemove: () => {},
  },
};

export const Empty: Story = {
  args: {
    items: [],
    onUpdateQuantity: () => {},
    onRemove: () => {},
  },
};

export const WithConfirmButton: Story = {
  args: {
    items: sampleItems,
    onUpdateQuantity: () => {},
    onRemove: () => {},
    onConfirm: () => alert('출고 확인'),
    confirmText: '출고 등록',
  },
};

export const WithClearButton: Story = {
  args: {
    items: sampleItems,
    onUpdateQuantity: () => {},
    onRemove: () => {},
    onClear: () => alert('장바구니 비우기'),
    onConfirm: () => alert('출고 확인'),
    confirmText: '출고 등록',
  },
};

export const Loading: Story = {
  args: {
    items: sampleItems,
    onUpdateQuantity: () => {},
    onRemove: () => {},
    onConfirm: () => {},
    confirmText: '출고 등록',
    isLoading: true,
  },
};

export const ConfirmDisabled: Story = {
  args: {
    items: sampleItems,
    onUpdateQuantity: () => {},
    onRemove: () => {},
    onConfirm: () => {},
    confirmText: '출고 등록',
    confirmDisabled: true,
  },
};

export const CustomTitle: Story = {
  args: {
    items: sampleItems,
    onUpdateQuantity: () => {},
    onRemove: () => {},
    title: '시술 목록',
    onConfirm: () => alert('시술 등록'),
    confirmText: '시술 등록',
  },
};

export const WithLotInfo: Story = {
  args: {
    items: [
      {
        productId: 'prod-001',
        productName: 'PDO Thread Type A',
        quantity: 10,
        lotId: 'lot-001',
        lotNumber: 'LOT-2024-001',
      },
      {
        productId: 'prod-001',
        productName: 'PDO Thread Type A',
        quantity: 5,
        lotId: 'lot-002',
        lotNumber: 'LOT-2024-002',
      },
      {
        productId: 'prod-002',
        productName: 'PDO Thread Type B',
        quantity: 8,
        lotId: 'lot-003',
        lotNumber: 'LOT-2024-003',
      },
    ],
    onUpdateQuantity: () => {},
    onRemove: () => {},
    onConfirm: () => alert('출고 확인'),
    confirmText: '출고 등록',
  },
};

export const Interactive: Story = {
  render: () => {
    const [items, setItems] = useState<CartItem[]>([
      { productId: 'prod-001', productName: 'PDO Thread Type A', quantity: 10 },
      { productId: 'prod-002', productName: 'PDO Thread Type B', quantity: 5 },
    ]);

    const handleUpdateQuantity = (productId: string, quantity: number) => {
      setItems(items.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      ));
    };

    const handleRemove = (productId: string) => {
      setItems(items.filter(item => item.productId !== productId));
    };

    const handleClear = () => {
      setItems([]);
    };

    return (
      <CartDisplay
        items={items}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemove}
        onClear={handleClear}
        onConfirm={() => alert(`${items.reduce((sum, i) => sum + i.quantity, 0)}개 출고 등록`)}
        confirmText="출고 등록"
      />
    );
  },
};
