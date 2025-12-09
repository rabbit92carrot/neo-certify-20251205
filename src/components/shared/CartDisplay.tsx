'use client';

/**
 * 장바구니 표시 컴포넌트
 * 출고/시술 등록에서 장바구니 아이템을 표시합니다.
 */

import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from './EmptyState';
import { cn } from '@/lib/utils';
import type { CartItem } from '@/hooks/useCart';

interface CartDisplayProps {
  /** 장바구니 아이템 목록 */
  items: CartItem[];
  /** 수량 업데이트 핸들러 */
  onUpdateQuantity: (productId: string, quantity: number, lotId?: string) => void;
  /** 아이템 삭제 핸들러 */
  onRemove: (productId: string, lotId?: string) => void;
  /** 장바구니 비우기 핸들러 */
  onClear?: () => void;
  /** 확인 버튼 핸들러 */
  onConfirm?: () => void;
  /** 확인 버튼 텍스트 */
  confirmText?: string;
  /** 확인 버튼 비활성화 */
  confirmDisabled?: boolean;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 제목 */
  title?: string;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 장바구니 아이템 행 컴포넌트
 */
function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number, lotId?: string) => void;
  onRemove: (productId: string, lotId?: string) => void;
}): React.ReactElement {
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      onUpdateQuantity(item.productId, newQuantity, item.lotId);
    }
  };

  return (
    <div className="flex items-center justify-between py-3 gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
        {item.lotNumber && (
          <p className="text-xs text-gray-500 mt-0.5">Lot: {item.lotNumber}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* 수량 조절 */}
        <div className="flex items-center border rounded-md">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            min={1}
            value={item.quantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
            className="h-8 w-16 text-center border-0 focus-visible:ring-0"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleQuantityChange(item.quantity + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* 삭제 버튼 */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 hover:text-red-600"
          onClick={() => onRemove(item.productId, item.lotId)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * 장바구니 표시 컴포넌트
 */
export function CartDisplay({
  items,
  onUpdateQuantity,
  onRemove,
  onClear,
  onConfirm,
  confirmText = '확인',
  confirmDisabled = false,
  isLoading = false,
  title = '장바구니',
  className,
}: CartDisplayProps): React.ReactElement {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{title}</CardTitle>
            {items.length > 0 && (
              <Badge variant="secondary" className="rounded-full">
                {items.length}종 / {totalItems}개
              </Badge>
            )}
          </div>
          {items.length > 0 && onClear && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-red-600"
              onClick={onClear}
            >
              전체 삭제
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="장바구니가 비어있습니다"
            description="제품을 선택하여 장바구니에 담아주세요."
            className="py-8"
          />
        ) : (
          <div className="divide-y">
            {items.map((item) => (
              <CartItemRow
                key={`${item.productId}-${item.lotId ?? ''}`}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemove}
              />
            ))}
          </div>
        )}
      </CardContent>

      {items.length > 0 && onConfirm && (
        <>
          <Separator />
          <CardFooter className="pt-4">
            <Button
              className="w-full"
              onClick={onConfirm}
              disabled={confirmDisabled || isLoading}
            >
              {isLoading ? '처리 중...' : `${confirmText} (${totalItems}개)`}
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
