'use client';

/**
 * 옵션 B: 2열 레이아웃
 * 좌측: 제품 카드 그리드 (스크롤), 우측: 생산 정보 폼 (sticky)
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Package, Check } from 'lucide-react';
import { ProductionForm } from './ProductionForm';
import { MOCK_PRODUCTS, type MockProduct } from '../_data/mock-products';

interface ProductCardMiniProps {
  product: MockProduct;
  selected: boolean;
  onClick: () => void;
}

function ProductCardMini({ product, selected, onClick }: ProductCardMiniProps): React.ReactElement {
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
          <h4 className="font-medium text-sm truncate">{product.name}</h4>
          <p className="text-xs text-muted-foreground truncate">{product.model_name}</p>
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
            UDI: {product.udi_di}
          </p>
        </div>
      </div>
    </div>
  );
}

export function OptionB_TwoColumn(): React.ReactElement {
  const [selectedProduct, setSelectedProduct] = useState<MockProduct | null>(null);

  const handleProductSelect = (product: MockProduct) => {
    setSelectedProduct(product);
  };

  const handleClearSelection = () => {
    setSelectedProduct(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* 좌측: 제품 선택 영역 */}
      <div className="flex-1 lg:max-w-[60%]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">제품 선택</CardTitle>
            <CardDescription>생산할 제품을 선택하세요 ({MOCK_PRODUCTS.length}개)</CardDescription>
          </CardHeader>
          <CardContent>
            {/* 스크롤 가능한 그리드 영역 */}
            <div className="max-h-[400px] overflow-y-auto pr-2 -mr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MOCK_PRODUCTS.map((product) => (
                  <ProductCardMini
                    key={product.id}
                    product={product}
                    selected={selectedProduct?.id === product.id}
                    onClick={() => handleProductSelect(product)}
                  />
                ))}
              </div>
            </div>
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
