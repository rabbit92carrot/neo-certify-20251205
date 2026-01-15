import type { Meta, StoryObj } from '@storybook/react';
import { ProductCard } from './ProductCard';
import type { Product } from '@/types/api.types';

const meta = {
  title: 'Shared/Selection/ProductCard',
  component: ProductCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[320px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProductCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// 샘플 제품 데이터
const sampleProduct: Product = {
  id: 'prod-001',
  name: 'PDO Thread Type A',
  model_name: 'PDO-A-100',
  udi_di: '1234567890123',
  manufacturer_id: 'mfr-001',
  is_active: true,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

export const Default: Story = {
  args: {
    product: sampleProduct,
    onClick: () => alert('제품 선택됨'),
  },
};

export const Selected: Story = {
  args: {
    product: sampleProduct,
    selected: true,
    onClick: () => alert('제품 선택 해제'),
  },
};

export const WithAdditionalInfo: Story = {
  args: {
    product: sampleProduct,
    additionalInfo: '재고: 150개',
    onClick: () => alert('제품 선택됨'),
  },
};

export const SelectedWithInfo: Story = {
  args: {
    product: sampleProduct,
    selected: true,
    additionalInfo: '재고: 150개',
    onClick: () => alert('제품 선택 해제'),
  },
};

export const Disabled: Story = {
  args: {
    product: sampleProduct,
    disabled: true,
    additionalInfo: '재고: 0개',
    onClick: () => {},
  },
};

export const WithDirectProps: Story = {
  args: {
    name: 'PDO Thread Premium',
    modelName: 'PDO-P-500',
    additionalInfo: '고급형 제품',
    onClick: () => alert('제품 선택됨'),
  },
};

export const ProductList: Story = {
  render: () => {
    const products = [
      { id: '1', name: 'PDO Thread Type A', modelName: 'PDO-A-100', stock: 150 },
      { id: '2', name: 'PDO Thread Type B', modelName: 'PDO-B-200', stock: 80 },
      { id: '3', name: 'PDO Thread Premium', modelName: 'PDO-P-500', stock: 45 },
      { id: '4', name: 'PDO Thread Mono', modelName: 'PDO-M-300', stock: 0 },
    ];

    return (
      <div className="grid gap-3 w-[680px]">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            name={product.name}
            modelName={product.modelName}
            additionalInfo={`재고: ${product.stock}개`}
            selected={product.id === '1'}
            disabled={product.stock === 0}
            onClick={() => alert(`${product.name} 선택됨`)}
          />
        ))}
      </div>
    );
  },
};
