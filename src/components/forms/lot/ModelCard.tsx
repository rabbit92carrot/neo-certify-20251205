'use client';

/**
 * 모델 선택 카드 컴포넌트
 * 아코디언 내부에서 개별 제품 모델을 표시합니다.
 */

import React, { memo } from 'react';
import { Package, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '@/types/api.types';

export interface ModelCardProps {
  /** 제품 정보 */
  product: Product;
  /** 선택 상태 */
  selected: boolean;
  /** 클릭 핸들러 */
  onClick: () => void;
  /** 비활성화 상태 */
  disabled?: boolean;
}

function ModelCardComponent({
  product,
  selected,
  onClick,
  disabled,
}: ModelCardProps): React.ReactElement {
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

/**
 * 메모이제이션된 모델 카드
 * props가 변경되지 않으면 리렌더링을 건너뜁니다.
 */
export const ModelCard = memo(ModelCardComponent);
