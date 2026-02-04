'use client';

/**
 * 제품 선택 카드 컴포넌트 (박스형 UI)
 * 생산 등록 시 제품 선택에 사용
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Package, Check, Star } from 'lucide-react';
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
  /** 즐겨찾기 여부 */
  isFavorite?: boolean;
  /** 즐겨찾기 토글 핸들러 */
  onFavoriteToggle?: (isFavorite: boolean) => void;
  /** 즐겨찾기 버튼 표시 여부 */
  showFavoriteButton?: boolean;
}

export function ProductCard({
  product,
  name,
  modelName,
  additionalInfo,
  selected = false,
  isSelected,
  onClick,
  disabled = false,
  isFavorite = false,
  onFavoriteToggle,
  showFavoriteButton = false,
}: ProductCardProps): React.ReactElement {
  // isSelected가 전달되면 우선 사용
  const isProductSelected = isSelected ?? selected;

  // product 또는 직접 전달된 값 사용
  const displayName = name ?? product?.name ?? '';
  const displayModelName = modelName ?? product?.model_name ?? '';
  const displayUdi = product?.udi_di;

  // 즐겨찾기 클릭 핸들러
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지
    onFavoriteToggle?.(!isFavorite);
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 relative group',
        'hover:border-primary hover:shadow-md',
        isProductSelected && 'border-primary ring-2 ring-primary/20 bg-primary/5',
        disabled && 'opacity-50 cursor-not-allowed hover:border-border hover:shadow-none'
      )}
      onClick={disabled ? undefined : onClick}
    >
      {/* 즐겨찾기 버튼 */}
      {showFavoriteButton && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            'absolute top-2 right-2 h-7 w-7 z-10',
            'transition-opacity duration-200',
            isFavorite
              ? 'opacity-100 text-yellow-500 hover:text-yellow-600'
              : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-yellow-500'
          )}
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        >
          <Star
            className={cn(
              'h-4 w-4 transition-all',
              isFavorite && 'fill-current'
            )}
          />
        </Button>
      )}

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
}
