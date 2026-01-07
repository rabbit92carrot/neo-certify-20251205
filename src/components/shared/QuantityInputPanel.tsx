'use client';

/**
 * 수량 입력 패널 컴포넌트
 * 출고/시술/폐기 등록에서 제품 선택 후 수량을 입력하는 UI를 제공합니다.
 *
 * SSOT: 여러 폼에서 공통으로 사용되는 수량 입력 UI를 통합 관리합니다.
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface SelectedProductInfo {
  /** 제품 ID */
  productId: string;
  /** 표시명 (별칭 또는 제품명) */
  displayName: string;
  /** 모델명 (선택사항) */
  modelName?: string;
}

interface QuantityInputPanelProps {
  /** 선택된 제품 정보 (null이면 패널 미표시) */
  selectedProduct: SelectedProductInfo | null;
  /** 선택된 제품/Lot의 가용 수량 */
  availableQuantity: number;
  /** 현재 수량 입력값 (controlled) */
  quantity: string;
  /** 수량 변경 핸들러 */
  onQuantityChange: (value: string) => void;
  /** 장바구니 추가 핸들러 */
  onAddToCart: () => void;
  /** 장바구니 추가 버튼 비활성화 */
  addDisabled?: boolean;
  /** Lot 선택 UI 슬롯 (ShipmentForm 전용) */
  lotSelector?: React.ReactNode;
  /** 카드 제목 (기본: "수량 입력") */
  title?: string;
  /** 추가 버튼 텍스트 (기본: "장바구니에 담기") */
  addButtonText?: string;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 수량 입력 패널 컴포넌트
 */
export function QuantityInputPanel({
  selectedProduct,
  availableQuantity,
  quantity,
  onQuantityChange,
  onAddToCart,
  addDisabled = false,
  lotSelector,
  title = '수량 입력',
  addButtonText = '장바구니에 담기',
  className,
}: QuantityInputPanelProps): React.ReactElement | null {
  // 제품이 선택되지 않으면 패널 미표시
  if (!selectedProduct) {
    return null;
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 선택된 제품 정보 */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            선택된 제품: <strong>{selectedProduct.displayName}</strong>
            {' '}- 가용 재고: <strong>{availableQuantity}개</strong>
          </p>
        </div>

        {/* Lot 선택 슬롯 (선택사항) */}
        {lotSelector}

        {/* 수량 입력 */}
        <div className="space-y-2">
          <Label htmlFor="quantity">수량</Label>
          <div className="flex items-center gap-2">
            <Input
              id="quantity"
              type="number"
              min={1}
              max={availableQuantity}
              value={quantity}
              onChange={(e) => onQuantityChange(e.target.value)}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">
              / {availableQuantity}개
            </span>
          </div>
        </div>

        <Button
          onClick={onAddToCart}
          disabled={addDisabled || availableQuantity === 0}
          className="w-full"
        >
          {addButtonText}
        </Button>
      </CardContent>
    </Card>
  );
}
