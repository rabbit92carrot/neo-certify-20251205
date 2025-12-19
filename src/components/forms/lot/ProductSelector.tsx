'use client';

/**
 * 제품 선택기 컴포넌트
 * 제품을 검색하고 아코디언 형태로 그룹화하여 선택할 수 있습니다.
 */

import React, { useMemo, useState, memo } from 'react';
import { Search, X, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ModelCard } from './ModelCard';
import type { Product } from '@/types/api.types';

export interface ProductSelectorProps {
  /** 선택 가능한 제품 목록 */
  products: Product[];
  /** 현재 선택된 제품 ID */
  selectedProductId: string | null;
  /** 제품 선택 핸들러 */
  onProductSelect: (productId: string) => void;
  /** 비활성화 상태 */
  disabled?: boolean;
}

/**
 * 제품명으로 그룹화하는 유틸리티 함수
 */
function groupProductsByName(products: Product[]): Map<string, Product[]> {
  const grouped = new Map<string, Product[]>();
  products.forEach((product) => {
    const existing = grouped.get(product.name) || [];
    existing.push(product);
    grouped.set(product.name, existing);
  });
  return grouped;
}

function ProductSelectorComponent({
  products,
  selectedProductId,
  onProductSelect,
  disabled = false,
}: ProductSelectorProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // 제품명별로 그룹화
  const groupedProducts = useMemo(() => groupProductsByName(products), [products]);

  // 검색 필터링
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return groupedProducts;
    }

    const query = searchQuery.toLowerCase();
    const filtered = new Map<string, Product[]>();

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

  // 검색 시 자동으로 아코디언 열기
  const effectiveExpandedItems = useMemo(() => {
    if (searchQuery.trim()) {
      return [...filteredGroups.keys()];
    }
    return expandedItems;
  }, [filteredGroups, expandedItems, searchQuery]);

  // 검색 초기화
  const handleClearSearch = () => {
    setSearchQuery('');
  };

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
                              onClick={() => onProductSelect(product.id)}
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

/**
 * 메모이제이션된 제품 선택기
 */
export const ProductSelector = memo(ProductSelectorComponent);
