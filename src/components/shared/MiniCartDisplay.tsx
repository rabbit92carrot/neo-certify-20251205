'use client';

/**
 * 미니 장바구니 표시 컴포넌트
 * AllProductsDialog 내에서 간략한 장바구니 현황을 표시합니다.
 */

import { Trash2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { CartItem } from '@/hooks/useCart';

interface MiniCartDisplayProps {
  /** 장바구니 아이템 목록 */
  items: CartItem[];
  /** 아이템 삭제 핸들러 */
  onRemove: (productId: string, lotId?: string) => void;
  /** 최대 높이 */
  maxHeight?: string;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 미니 장바구니 아이템 행
 */
function MiniCartItem({
  item,
  onRemove,
}: {
  item: CartItem;
  onRemove: (productId: string, lotId?: string) => void;
}): React.ReactElement {
  return (
    <div className="flex items-center justify-between py-2 px-3 gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.productName}</p>
        {item.lotNumber && (
          <p className="text-xs text-muted-foreground">Lot: {item.lotNumber}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="secondary" className="font-mono">
          {item.quantity}개
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(item.productId, item.lotId)}
          aria-label="항목 삭제"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

/**
 * 미니 장바구니 표시 컴포넌트
 */
export function MiniCartDisplay({
  items,
  onRemove,
  maxHeight = '200px',
  className,
}: MiniCartDisplayProps): React.ReactElement {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className={cn('border rounded-lg flex flex-col', className)}>
      {/* 헤더 */}
      <div className="p-3 border-b flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">장바구니</span>
        </div>
        {items.length > 0 && (
          <Badge variant="secondary" className="rounded-full">
            {items.length}종 / {totalItems}개
          </Badge>
        )}
      </div>

      {/* 아이템 목록 */}
      <ScrollArea style={{ maxHeight }} className="flex-1">
        {items.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            장바구니가 비어있습니다
          </div>
        ) : (
          <div className="divide-y">
            {items.map((item) => (
              <MiniCartItem
                key={`${item.productId}-${item.lotId ?? ''}`}
                item={item}
                onRemove={onRemove}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
