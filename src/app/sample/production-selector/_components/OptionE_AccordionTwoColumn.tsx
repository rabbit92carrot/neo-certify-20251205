'use client';

/**
 * 옵션 E: 아코디언 그룹 + 2열 레이아웃
 * 좌측: 제품명별 아코디언 그룹 (검색 + 스크롤)
 * 우측: 생산 정보 폼 (sticky)
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Package, Check, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductionForm } from './ProductionForm';
import {
  MOCK_PRODUCTS,
  groupProductsByName,
  type MockProduct,
} from '../_data/mock-products';

interface ModelCardProps {
  product: MockProduct;
  selected: boolean;
  onClick: () => void;
}

function ModelCard({ product, selected, onClick }: ModelCardProps): React.ReactElement {
  return (
    <div
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-lg border p-2.5 transition-all duration-200',
        'hover:border-primary hover:shadow-sm',
        selected && 'border-primary ring-2 ring-primary/20 bg-primary/5'
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

export function OptionE_AccordionTwoColumn(): React.ReactElement {
  const [selectedProduct, setSelectedProduct] = useState<MockProduct | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // 제품명별로 그룹화
  const groupedProducts = useMemo(() => groupProductsByName(MOCK_PRODUCTS), []);

  // 검색 필터링
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return groupedProducts;
    }

    const query = searchQuery.toLowerCase();
    const filtered = new Map<string, MockProduct[]>();

    groupedProducts.forEach((products, name) => {
      const matchingProducts = products.filter(
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

  // 검색 시 자동으로 아코디언 열기
  const effectiveExpandedItems = useMemo(() => {
    if (searchQuery.trim()) {
      return [...filteredGroups.keys()];
    }
    return expandedItems;
  }, [filteredGroups, expandedItems, searchQuery]);

  const handleProductSelect = (product: MockProduct) => {
    setSelectedProduct(product);
  };

  const handleClearSelection = () => {
    setSelectedProduct(null);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* 좌측: 아코디언 제품 선택 영역 */}
      <div className="flex-1 lg:max-w-[60%]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">제품 선택</CardTitle>
            <CardDescription>제품군을 선택한 후 모델을 선택하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 검색 입력 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="제품명 또는 모델명 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={handleClearSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* 아코디언 그룹 - 스크롤 영역 */}
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
                  {[...filteredGroups.entries()].map(([productName, products]) => (
                    <AccordionItem
                      key={productName}
                      value={productName}
                      className="border rounded-lg px-3"
                    >
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{productName}</span>
                          <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">
                            {products.length}개
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {products.map((product) => (
                            <ModelCard
                              key={product.id}
                              product={product}
                              selected={selectedProduct?.id === product.id}
                              onClick={() => handleProductSelect(product)}
                            />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>

            {/* 전체 그룹 수 표시 */}
            {!searchQuery && (
              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                {groupedProducts.size}개 제품군 · 총 {MOCK_PRODUCTS.length}개 제품
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 우측: 생산 정보 폼 (sticky) */}
      <div className="lg:w-[40%]">
        <ProductionForm
          selectedProduct={selectedProduct}
          onClearSelection={handleClearSelection}
          sticky
        />
      </div>
    </div>
  );
}
