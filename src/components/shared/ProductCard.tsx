'use client';

/**
 * 제품 선택 카드 컴포넌트 (박스형 UI)
 * 생산 등록 시 제품 선택에 사용
 * memo로 감싸서 useDeferredValue와 함께 사용 시 불필요한 리렌더링 방지
 */

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Package, Check } from 'lucide-react';
import type { Product } from '@/types/api.types';

export interface ProductCardProps {
  /** 제품 정보 (product 전달 시 사용) */
  product?: Product;
  /** 제품명 (직접 전달 시 사용) */
  name?: string;
  /** 모델명 (직접 전달 시 사용) */
  modelName?: string;
  /** 추가 정보 (예: 재고 수량) */
  additionalInfo?: string;
  /** 선택 여부 */
  selected?: boolean;
  /** 선택 여부 (isSelected alias) */
  isSelected?: boolean;
  /** 클릭 핸들러 */
  onClick?: () => void;
  /** 비활성화 여부 */
  disabled?: boolean;
}

export const ProductCard = memo(function ProductCard({
  product,
  name,
  modelName,
  additionalInfo,
  selected = false,
  isSelected,
  onClick,
  disabled = false,
}: ProductCardProps): React.ReactElement {
  // isSelected가 전달되면 우선 사용
  const isProductSelected = isSelected ?? selected;

  // product 또는 직접 전달된 값 사용
  const displayName = name ?? product?.name ?? '';
  const displayModelName = modelName ?? product?.model_name ?? '';
  const displayUdi = product?.udi_di;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200',
        'hover:border-primary hover:shadow-md',
        isProductSelected && 'border-primary ring-2 ring-primary/20 bg-primary/5',
        disabled && 'opacity-50 cursor-not-allowed hover:border-border hover:shadow-none'
      )}
      onClick={disabled ? undefined : onClick}
    >
      <CardContent className="p-4 flex items-start gap-3">
        <div
          className={cn(
            'rounded-full p-2 shrink-0 transition-colors',
            isProductSelected ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-600'
          )}
        >
          {isProductSelected ? <Check className="h-5 w-5" /> : <Package className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{displayName}</h4>
          <p className="text-sm text-gray-500 truncate">{displayModelName}</p>
          {displayUdi && (
            <p className="text-xs text-gray-400 truncate mt-1">UDI: {displayUdi}</p>
          )}
          {additionalInfo && (
            <p className="text-xs text-blue-600 font-medium mt-1">{additionalInfo}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
