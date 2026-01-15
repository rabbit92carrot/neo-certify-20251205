'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';

/**
 * ProductListPanel은 병원 제품 목록을 표시하고 활성화 토글을 제공합니다.
 */

interface MockHospitalProduct {
  id: string;
  productName: string;
  modelName: string;
  alias?: string;
  isActive: boolean;
  currentInventory: number;
}

const mockProducts: MockHospitalProduct[] = [
  { id: 'hp-001', productName: 'PDO Thread Type A', modelName: 'PDO-A-100', alias: '볼', isActive: true, currentInventory: 50 },
  { id: 'hp-002', productName: 'PDO Thread Type B', modelName: 'PDO-B-200', isActive: true, currentInventory: 30 },
  { id: 'hp-003', productName: 'PDO Thread Premium', modelName: 'PDO-P-500', alias: '이마', isActive: false, currentInventory: 15 },
  { id: 'hp-004', productName: 'PDO Thread Type C', modelName: 'PDO-C-300', isActive: true, currentInventory: 0 },
];

interface MockProductListPanelProps {
  products?: MockHospitalProduct[];
  isLoading?: boolean;
}

function MockProductListPanel({
  products = mockProducts,
  isLoading = false,
}: MockProductListPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState(products);

  const getDisplayName = (product: MockHospitalProduct): string => {
    return product.alias || product.productName;
  };

  const handleToggleActive = (product: MockHospitalProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems(items.map((p) =>
      p.id === product.id ? { ...p, isActive: !p.isActive } : p
    ));
  };

  const selectedProduct = items.find((p) => p.id === selectedId) || null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5" />
          제품 목록
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Package}
            title="등록된 제품이 없습니다"
            description="입고받은 제품이 자동으로 등록됩니다."
          />
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {items.map((product) => (
              <div
                key={product.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                  selectedProduct?.id === product.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50',
                  !product.isActive && 'opacity-60'
                )}
                onClick={() => setSelectedId(product.id)}
              >
                <div className="flex-1 min-w-0 mr-3">
                  <p className="font-medium truncate">{getDisplayName(product)}</p>
                  {product.alias && (
                    <p className="text-xs text-muted-foreground truncate">
                      {product.productName} · {product.modelName}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    재고: {product.currentInventory}개
                  </p>
                </div>
                <Switch
                  checked={product.isActive}
                  onCheckedChange={() => {}}
                  onClick={(e) => handleToggleActive(product, e)}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const meta = {
  title: 'Forms/HospitalProduct/ProductListPanel',
  component: MockProductListPanel,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MockProductListPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    products: mockProducts,
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    products: [],
  },
};

export const AllInactive: Story = {
  args: {
    products: mockProducts.map((p) => ({ ...p, isActive: false })),
  },
};

export const NoAlias: Story = {
  args: {
    products: mockProducts.map((p) => ({ ...p, alias: undefined })),
  },
};
