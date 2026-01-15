'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { QuantityInputPanel } from './QuantityInputPanel';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';

const meta = {
  title: 'Shared/Cart/QuantityInputPanel',
  component: QuantityInputPanel,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[350px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof QuantityInputPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    selectedProduct: {
      productId: 'prod-001',
      displayName: 'PDO Thread Type A',
      modelName: 'PDO-A-100',
    },
    availableQuantity: 150,
    quantity: '10',
    onQuantityChange: () => {},
    onAddToCart: () => alert('장바구니에 추가됨'),
  },
};

export const NoProductSelected: Story = {
  args: {
    selectedProduct: null,
    availableQuantity: 0,
    quantity: '',
    onQuantityChange: () => {},
    onAddToCart: () => {},
  },
};

export const ZeroStock: Story = {
  args: {
    selectedProduct: {
      productId: 'prod-001',
      displayName: 'PDO Thread Type A',
      modelName: 'PDO-A-100',
    },
    availableQuantity: 0,
    quantity: '0',
    onQuantityChange: () => {},
    onAddToCart: () => {},
  },
};

export const WithLotSelector: Story = {
  args: {
    selectedProduct: {
      productId: 'prod-001',
      displayName: 'PDO Thread Type A',
      modelName: 'PDO-A-100',
    },
    availableQuantity: 80,
    quantity: '10',
    onQuantityChange: () => {},
    onAddToCart: () => alert('장바구니에 추가됨'),
    lotSelector: (
      <div className="space-y-2">
        <Label className="text-sm">Lot 선택</Label>
        <Combobox
          options={[
            { value: 'lot-001', label: 'LOT-2024-001 (80개)' },
            { value: 'lot-002', label: 'LOT-2024-002 (45개)' },
            { value: 'lot-003', label: 'LOT-2024-003 (25개)' },
          ]}
          value="lot-001"
          onValueChange={() => {}}
          placeholder="Lot 선택"
        />
      </div>
    ),
  },
};

export const CustomTitle: Story = {
  args: {
    selectedProduct: {
      productId: 'prod-001',
      displayName: 'PDO Thread Type A',
      modelName: 'PDO-A-100',
    },
    availableQuantity: 50,
    quantity: '5',
    onQuantityChange: () => {},
    onAddToCart: () => alert('시술 목록에 추가됨'),
    title: '시술 수량',
    addButtonText: '시술 목록에 추가',
  },
};

export const Disabled: Story = {
  args: {
    selectedProduct: {
      productId: 'prod-001',
      displayName: 'PDO Thread Type A',
      modelName: 'PDO-A-100',
    },
    availableQuantity: 100,
    quantity: '0',
    onQuantityChange: () => {},
    onAddToCart: () => {},
    addDisabled: true,
  },
};

export const Interactive: Story = {
  render: () => {
    const [quantity, setQuantity] = useState('10');

    return (
      <QuantityInputPanel
        selectedProduct={{
          productId: 'prod-001',
          displayName: 'PDO Thread Type A',
          modelName: 'PDO-A-100',
        }}
        availableQuantity={150}
        quantity={quantity}
        onQuantityChange={setQuantity}
        onAddToCart={() => alert(`${quantity}개 장바구니에 추가됨`)}
      />
    );
  },
};

export const ShipmentFlow: Story = {
  render: () => {
    const [selectedLot, setSelectedLot] = useState('lot-001');
    const [quantity, setQuantity] = useState('10');

    const lotOptions = [
      { value: 'lot-001', label: 'LOT-2024-001 (80개)', stock: 80 },
      { value: 'lot-002', label: 'LOT-2024-002 (45개)', stock: 45 },
      { value: 'lot-003', label: 'LOT-2024-003 (25개)', stock: 25 },
    ];

    const currentLot = lotOptions.find(l => l.value === selectedLot);

    return (
      <QuantityInputPanel
        selectedProduct={{
          productId: 'prod-001',
          displayName: 'PDO Thread Type A',
          modelName: 'PDO-A-100',
        }}
        availableQuantity={currentLot?.stock ?? 0}
        quantity={quantity}
        onQuantityChange={setQuantity}
        onAddToCart={() => alert(`Lot: ${selectedLot}, 수량: ${quantity}개 추가됨`)}
        lotSelector={
          <div className="space-y-2">
            <Label className="text-sm">Lot 선택</Label>
            <Combobox
              options={lotOptions}
              value={selectedLot}
              onValueChange={setSelectedLot}
              placeholder="Lot 선택"
            />
          </div>
        }
      />
    );
  },
};
