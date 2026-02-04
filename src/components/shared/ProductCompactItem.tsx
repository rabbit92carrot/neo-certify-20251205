'use client';

/**
 * 컴팩트 제품 아이템 컴포넌트
 * 전체 제품 다이얼로그에서 사용되는 작은 제품 선택 아이템
 */

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductCompactItemProps {
  /** 제품명 */
  name: string;
  /** 표시명 (별칭 등) - name 대신 표시됨 */
  displayName?: string;
  /** 모델명 */
  modelName?: string;
  /** 재고 수량 */
  quantity: number;
  /** 선택 여부 */
  isSelected?: boolean;
  /** 클릭 핸들러 */
  onClick?: () => void;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 즐겨찾기 여부 */
  isFavorite?: boolean;
  /** 즐겨찾기 토글 핸들러 */
  onFavoriteToggle?: () => void;
}

/**
 * 컴팩트 제품 아이템 컴포넌트
 */
export function ProductCompactItem({
  name,
  displayName,
  modelName,
  quantity,
  isSelected = false,
  onClick,
  disabled = false,
  isFavorite = false,
  onFavoriteToggle,
}: ProductCompactItemProps): React.ReactElement {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteToggle?.();
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onClick}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        'group relative flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-all',
        'hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50',
        isSelected && 'border-primary bg-primary/5',
        disabled && 'opacity-50 cursor-not-allowed hover:border-border'
      )}
    >
      {/* 즐겨찾기 버튼 */}
      {onFavoriteToggle && (
        <button
          type="button"
          onClick={handleFavoriteClick}
          className={cn(
            'shrink-0 p-0.5 rounded transition-colors',
            isFavorite
              ? 'text-yellow-500'
              : 'text-muted-foreground/30 hover:text-yellow-500 opacity-0 group-hover:opacity-100'
          )}
        >
          <Star
            className={cn('h-3.5 w-3.5', isFavorite && 'fill-current')}
          />
        </button>
      )}

      {/* 제품 정보 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{displayName ?? name}</p>
        {modelName && (
          <p className="text-xs text-muted-foreground truncate">{modelName}</p>
        )}
      </div>

      {/* 재고 수량 */}
      <div className="shrink-0 text-xs text-muted-foreground">
        {quantity}개
      </div>
    </div>
  );
}
