'use client';

/**
 * 제품 목록 패널
 * 제품 카드 목록과 활성화 토글 스위치
 */

import React, { memo } from 'react';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils/ui';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import type { ProductListPanelProps } from './types';

function ProductListPanelComponent({
  products,
  selectedProduct,
  onProductSelect,
  onToggleActive,
  isLoading,
  getDisplayName,
}: ProductListPanelProps): React.ReactElement {
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
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="등록된 제품이 없습니다"
            description="입고받은 제품이 자동으로 등록됩니다."
          />
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {products.map((product) => (
              <div
                key={product.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                  selectedProduct?.id === product.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50',
                  !product.isActive && 'opacity-60'
                )}
                onClick={() => onProductSelect(product)}
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
                  onClick={(e) => onToggleActive(product, e)}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const ProductListPanel = memo(ProductListPanelComponent);
