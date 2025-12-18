'use client';

/**
 * 선택된 제품 표시 컴포넌트
 * 현재 선택된 제품의 정보를 표시합니다.
 */

import React, { memo } from 'react';
import { Check } from 'lucide-react';
import type { Product } from '@/types/api.types';

export interface SelectedProductDisplayProps {
  /** 선택된 제품 */
  product: Product;
}

function SelectedProductDisplayComponent({
  product,
}: SelectedProductDisplayProps): React.ReactElement {
  return (
    <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
      <div className="flex items-center gap-2">
        <div className="rounded-full p-1.5 bg-primary text-primary-foreground shrink-0">
          <Check className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{product.name}</p>
          <p className="text-xs text-muted-foreground truncate">{product.model_name}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * 메모이제이션된 선택된 제품 표시
 */
export const SelectedProductDisplay = memo(SelectedProductDisplayComponent);
