'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState, useMemo } from 'react';
import { Search, X, Package, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

/**
 * ProductSelector 컴포넌트 - Lot 생성 시 제품을 선택하는 UI
 */

interface MockProduct {
  id: string;
  name: string;
  model_name: string;
  udi_di: string;
}

const mockProducts: MockProduct[] = [
  { id: 'prod-001', name: 'PDO Thread Type A', model_name: 'PDO-A-100', udi_di: '00123456789012A' },
  { id: 'prod-002', name: 'PDO Thread Type A', model_name: 'PDO-A-200', udi_di: '00123456789012B' },
  { id: 'prod-003', name: 'PDO Thread Type A', model_name: 'PDO-A-300', udi_di: '00123456789012C' },
  { id: 'prod-004', name: 'PDO Thread Type B', model_name: 'PDO-B-100', udi_di: '00123456789013A' },
  { id: 'prod-005', name: 'PDO Thread Type B', model_name: 'PDO-B-200', udi_di: '00123456789013B' },
  { id: 'prod-006', name: 'PDO Thread Premium', model_name: 'PDO-P-500', udi_di: '00123456789014A' },
  { id: 'prod-007', name: 'PDO Thread Economy', model_name: 'PDO-E-100', udi_di: '00123456789015A' },
];

// ModelCard 컴포넌트 (인라인)
function ModelCard({
  product,
  selected,
  onClick,
  disabled = false,
}: {
  product: MockProduct;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
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

function groupProductsByName(products: MockProduct[]): Map<string, MockProduct[]> {
  const grouped = new Map<string, MockProduct[]>();
  products.forEach((product) => {
    const existing = grouped.get(product.name) ?? [];
    existing.push(product);
    grouped.set(product.name, existing);
  });
  return grouped;
}

function MockProductSelector({
  products = mockProducts,
  disabled = false,
}: {
  products?: MockProduct[];
  disabled?: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const groupedProducts = useMemo(() => groupProductsByName(products), [products]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return groupedProducts;
    }

    const query = searchQuery.toLowerCase();
    const filtered = new Map<string, MockProduct[]>();

    groupedProducts.forEach((prods, name) => {
      const matchingProducts = prods.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.model_name.toLowerCase().includes(query) ||
          p.udi_di.includes(query)
      );

      if (matchingProducts.length > 0) {
        filtered.set(name, matchingProducts);
      }
    });

    return filtered;
  }, [groupedProducts, searchQuery]);

  const effectiveExpandedItems = useMemo(() => {
    if (searchQuery.trim()) {
      return [...filteredGroups.keys()];
    }
    return expandedItems;
  }, [filteredGroups, expandedItems, searchQuery]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">제품 선택</CardTitle>
        <CardDescription>제품군을 선택한 후 모델을 선택하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {products.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-30 text-gray-400" />
            <p className="text-gray-500">활성화된 제품이 없습니다.</p>
            <p className="text-gray-400 text-sm mt-1">
              제품 관리 메뉴에서 제품을 먼저 등록해주세요.
            </p>
          </div>
        ) : (
          <>
            {/* 검색 입력 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="제품명 또는 모델명 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
                disabled={disabled}
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* 아코디언 그룹 */}
            <div className="max-h-[400px] overflow-y-auto pr-2 -mr-2">
              {filteredGroups.size === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>검색 결과가 없습니다</p>
                </div>
              ) : (
                <Accordion
                  type="multiple"
                  value={effectiveExpandedItems}
                  onValueChange={setExpandedItems}
                  className="space-y-2"
                >
                  {[...filteredGroups.entries()].map(([productName, prods]) => (
                    <AccordionItem
                      key={productName}
                      value={productName}
                      className="border rounded-lg px-3"
                    >
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{productName}</span>
                          <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">
                            {prods.length}개
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {prods.map((product) => (
                            <ModelCard
                              key={product.id}
                              product={product}
                              selected={selectedProductId === product.id}
                              onClick={() => setSelectedProductId(product.id)}
                              disabled={disabled}
                            />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>

            {/* 선택된 제품 표시 */}
            {selectedProductId && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm">
                  <span className="text-muted-foreground">선택된 제품:</span>{' '}
                  <span className="font-medium">
                    {products.find((p) => p.id === selectedProductId)?.model_name}
                  </span>
                </p>
              </div>
            )}

            {/* 전체 그룹 수 표시 */}
            {!searchQuery && (
              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                {groupedProducts.size}개 제품군 · 총 {products.length}개 제품
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

const meta = {
  title: 'Forms/Manufacturer/Lot/ProductSelector',
  component: MockProductSelector,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MockProductSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSearch: Story = {
  render: () => {
    const [search, setSearch] = useState('Type A');
    return <MockProductSelector />;
  },
};

export const Empty: Story = {
  args: {
    products: [],
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const SingleProduct: Story = {
  args: {
    products: [
      { id: 'prod-001', name: 'PDO Thread Special', model_name: 'PDO-S-100', udi_di: '00123456789099A' },
    ],
  },
};
