'use client';

/**
 * 옵션 D: 2열 + 검색 필터
 * 옵션 B의 개선판 - 좌측에 검색 필터 추가
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Package, Check, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductionForm } from './ProductionForm';
import { MOCK_PRODUCTS, type MockProduct } from '../_data/mock-products';

interface ProductCardMiniProps {
  product: MockProduct;
  selected: boolean;
  onClick: () => void;
  highlighted?: string; // 검색어 하이라이트용
}

function ProductCardMini({
  product,
  selected,
  onClick,
  highlighted,
}: ProductCardMiniProps): React.ReactElement {
  // 텍스트 하이라이트 함수
  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) {
      return text;
    }
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-lg border p-3 transition-all duration-200',
        'hover:border-primary hover:shadow-sm',
        selected && 'border-primary ring-2 ring-primary/20 bg-primary/5'
      )}
    >
      <div className="flex items-start gap-2">
        <div
          className={cn(
            'rounded-full p-1.5 shrink-0 transition-colors',
            selected ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-600'
          )}
        >
          {selected ? <Check className="h-3 w-3" /> : <Package className="h-3 w-3" />}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">
            {highlightText(product.name, highlighted || '')}
          </h4>
          <p className="text-xs text-muted-foreground truncate">
            {highlightText(product.model_name, highlighted || '')}
          </p>
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
            UDI: {highlightText(product.udi_di, highlighted || '')}
          </p>
        </div>
      </div>
    </div>
  );
}

export function OptionD_TwoColumnSearch(): React.ReactElement {
  const [selectedProduct, setSelectedProduct] = useState<MockProduct | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 검색 필터링
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return MOCK_PRODUCTS;
    }
    const query = searchQuery.toLowerCase();
    return MOCK_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.model_name.toLowerCase().includes(query) ||
        p.udi_di.includes(query)
    );
  }, [searchQuery]);

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
      {/* 좌측: 제품 선택 영역 */}
      <div className="flex-1 lg:max-w-[60%]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">제품 선택</CardTitle>
            <CardDescription>
              검색하여 제품을 찾거나 목록에서 선택하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 검색 입력 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="제품명, 모델명, UDI 검색..."
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

            {/* 검색 결과 상태 표시 */}
            {searchQuery && (
              <div className="text-sm text-muted-foreground">
                {filteredProducts.length === 0 ? (
                  '검색 결과가 없습니다'
                ) : (
                  <>
                    <span className="font-medium text-foreground">{filteredProducts.length}</span>
                    개의 제품이 검색되었습니다
                  </>
                )}
              </div>
            )}

            {/* 스크롤 가능한 그리드 영역 */}
            <div className="max-h-[350px] overflow-y-auto pr-2 -mr-2">
              {filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>검색 결과가 없습니다</p>
                  <p className="text-sm mt-1">다른 검색어로 시도해보세요</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredProducts.map((product) => (
                    <ProductCardMini
                      key={product.id}
                      product={product}
                      selected={selectedProduct?.id === product.id}
                      onClick={() => handleProductSelect(product)}
                      highlighted={searchQuery}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 전체 제품 수 표시 */}
            {!searchQuery && (
              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                전체 {MOCK_PRODUCTS.length}개 제품
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
