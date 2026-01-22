'use client';

/**
 * 폐기 폼 컴포넌트
 * 병원에서 손실, 만료, 불량 등의 이유로 제품을 폐기합니다.
 *
 * 특징:
 * - FIFO 기반 가상 코드 자동 선택 (수량만 입력)
 * - 사전 정의 사유 선택 + 기타 시 상세 입력
 * - 폐기 후 취소 불가 (즉시 확정)
 */

import { useState, useTransition, useMemo } from 'react';
import { toast } from 'sonner';
import { Package, Calendar, Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ProductCard } from '@/components/shared/ProductCard';
import { CartDisplay } from '@/components/shared/CartDisplay';
import { EmptyState } from '@/components/shared/EmptyState';
import { QuantityInputPanel } from '@/components/shared/QuantityInputPanel';
import { useCart } from '@/hooks';
import { DISPOSAL_REASON_OPTIONS, DISPOSAL_REASON_TYPES } from '@/constants/disposal';
import type { ProductForTreatment } from '@/types/api.types';
import type { DisposalItemData, DisposalReasonTypeValue } from '@/lib/validations/disposal';

interface DisposalFormProps {
  /** 폐기 가능한 제품 목록 (활성화 + 재고 있음) */
  products: ProductForTreatment[];
  /** 폐기 등록 액션 */
  onSubmit: (
    disposalDate: string,
    disposalReasonType: DisposalReasonTypeValue,
    disposalReasonCustom: string | null,
    items: DisposalItemData[]
  ) => Promise<{ success: boolean; error?: { message: string } }>;
}

/**
 * 폐기 폼 컴포넌트
 */
export function DisposalForm({
  products,
  onSubmit,
}: DisposalFormProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();
  const [selectedProduct, setSelectedProduct] = useState<ProductForTreatment | null>(null);
  const [quantity, setQuantity] = useState<string>('1');
  const [disposalDate, setDisposalDate] = useState<string>(() => {
    const today = new Date().toISOString().split('T')[0] ?? '';
    return today;
  });
  const [disposalReasonType, setDisposalReasonType] = useState<DisposalReasonTypeValue | ''>('');
  const [disposalReasonCustom, setDisposalReasonCustom] = useState<string>('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    totalItems,
  } = useCart();

  // O(1) 조회를 위한 Map 캐시 (Vercel React Best Practices)
  const productMap = useMemo(() => {
    return new Map(products.map((p) => [p.productId, p]));
  }, [products]);

  const itemMap = useMemo(() => {
    const map = new Map<string, { quantity: number }>();
    for (const item of items) {
      // 폐기는 lotId 없이 productId만 사용
      map.set(item.productId, { quantity: item.quantity });
    }
    return map;
  }, [items]);

  // 선택된 제품의 현재 가용 수량 계산 (장바구니에 담긴 수량 제외)
  const getAvailableQuantity = (product: ProductForTreatment): number => {
    const cartQuantity = items
      .filter((item) => item.productId === product.productId && !item.lotId)
      .reduce((sum, item) => sum + item.quantity, 0);
    return product.availableQuantity - cartQuantity;
  };

  // 제품 표시명 반환 (별칭 우선)
  const getDisplayName = (product: ProductForTreatment): string => {
    return product.alias || product.productName;
  };

  const handleAddToCart = () => {
    if (!selectedProduct) {
      toast.error('제품을 선택해주세요.');
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      toast.error('올바른 수량을 입력해주세요.');
      return;
    }

    const availableQty = getAvailableQuantity(selectedProduct);
    if (qty > availableQty) {
      toast.error(`재고가 부족합니다. 현재 재고: ${availableQty}개`);
      return;
    }

    addItem({
      productId: selectedProduct.productId,
      productName: getDisplayName(selectedProduct),
      quantity: qty,
    });

    toast.success('장바구니에 추가되었습니다.');
    setQuantity('1');
  };

  const validateForm = (): boolean => {
    if (!disposalDate) {
      toast.error('폐기일을 선택해주세요.');
      return false;
    }

    if (!disposalReasonType) {
      toast.error('폐기 사유를 선택해주세요.');
      return false;
    }

    if (disposalReasonType === DISPOSAL_REASON_TYPES.OTHER && !disposalReasonCustom.trim()) {
      toast.error('기타 사유를 입력해주세요.');
      return false;
    }

    if (items.length === 0) {
      toast.error('폐기할 제품을 장바구니에 담아주세요.');
      return false;
    }

    return true;
  };

  const handleConfirmClick = () => {
    if (!validateForm()) {
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleSubmit = () => {
    setIsConfirmOpen(false);

    startTransition(async () => {
      const disposalItems: DisposalItemData[] = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const customReason = disposalReasonType === DISPOSAL_REASON_TYPES.OTHER
        ? disposalReasonCustom.trim()
        : null;

      const result = await onSubmit(
        disposalDate,
        disposalReasonType as DisposalReasonTypeValue,
        customReason,
        disposalItems
      );

      if (result.success) {
        toast.success(`${totalItems}개 제품이 폐기 처리되었습니다.`);
        clearCart();
        setSelectedProduct(null);
        setDisposalReasonType('');
        setDisposalReasonCustom('');
        const today = new Date().toISOString().split('T')[0];
        setDisposalDate(today ?? '');
      } else {
        toast.error(result.error?.message || '폐기 등록에 실패했습니다.');
      }
    });
  };

  // 현재 선택된 제품의 가용 수량
  const currentAvailableQty = selectedProduct
    ? getAvailableQuantity(selectedProduct)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 왼쪽: 폐기 정보 및 제품 선택 */}
      <div className="lg:col-span-2 space-y-6">
        {/* 폐기 정보 입력 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              폐기 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="disposalDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  폐기일
                </Label>
                <Input
                  id="disposalDate"
                  type="date"
                  value={disposalDate}
                  onChange={(e) => setDisposalDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="disposalReason">폐기 사유</Label>
                <Select
                  value={disposalReasonType}
                  onValueChange={(value) => setDisposalReasonType(value as DisposalReasonTypeValue)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="사유를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISPOSAL_REASON_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 기타 사유 입력 */}
            {disposalReasonType === DISPOSAL_REASON_TYPES.OTHER && (
              <div className="space-y-2">
                <Label htmlFor="disposalReasonCustom">상세 사유</Label>
                <Textarea
                  id="disposalReasonCustom"
                  placeholder="폐기 사유를 상세히 입력해주세요"
                  value={disposalReasonCustom}
                  onChange={(e) => setDisposalReasonCustom(e.target.value)}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {disposalReasonCustom.length}/500자
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 제품 선택 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">제품 선택</CardTitle>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <EmptyState
                icon={Package}
                title="폐기 가능한 제품이 없습니다"
                description="재고가 있는 제품이 없습니다."
              />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {products.map((product) => {
                  const availableQty = getAvailableQuantity(product);
                  const displayName = getDisplayName(product);
                  return (
                    <ProductCard
                      key={product.productId}
                      name={displayName}
                      modelName={product.modelName}
                      additionalInfo={`재고: ${availableQty}개`}
                      isSelected={selectedProduct?.productId === product.productId}
                      onClick={() => setSelectedProduct(product)}
                      disabled={availableQty === 0}
                    />
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 오른쪽: 수량 입력 + 장바구니 */}
      <div className="lg:col-span-1">
        <div className="sticky top-20 space-y-4">
          {/* 수량 입력 */}
          <QuantityInputPanel
            selectedProduct={selectedProduct ? {
              productId: selectedProduct.productId,
              displayName: getDisplayName(selectedProduct),
            } : null}
            availableQuantity={currentAvailableQty}
            quantity={quantity}
            onQuantityChange={setQuantity}
            onAddToCart={handleAddToCart}
          />

          {/* 장바구니 */}
          <CartDisplay
            items={items}
            onUpdateQuantity={(productId, qty, lotId) => {
              // O(1) Map 조회로 재고 확인
              const product = productMap.get(productId);
              if (product) {
                const availableQty = getAvailableQuantity(product);
                const currentItem = itemMap.get(productId);
                const currentQty = currentItem?.quantity || 0;
                const maxQty = availableQty + currentQty;

                if (qty > maxQty) {
                  toast.error(`재고가 부족합니다. 최대: ${maxQty}개`);
                  return;
                }
              }
              updateQuantity(productId, qty, lotId);
            }}
            onRemove={removeItem}
            onClear={clearCart}
            onConfirm={handleConfirmClick}
            confirmText="폐기 등록"
            confirmDisabled={items.length === 0 || !disposalReasonType || !disposalDate}
            isLoading={isPending}
            title="폐기 장바구니"
          />

          {/* 경고 안내 */}
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">폐기 주의사항</span>
            </div>
            <p className="mt-2 text-xs text-amber-600">
              폐기 등록 후에는 <strong>취소가 불가능</strong>합니다.
              폐기 수량과 사유를 정확히 확인 후 등록해주세요.
            </p>
          </div>

          {/* 확인 다이얼로그 */}
          <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  폐기 등록 확인
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3">
                    <p>
                      아래 내용으로 폐기를 등록하시겠습니까?
                    </p>
                    <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                      <p><strong>폐기일:</strong> {disposalDate}</p>
                      <p><strong>사유:</strong> {
                        DISPOSAL_REASON_OPTIONS.find(o => o.value === disposalReasonType)?.label || ''
                      }</p>
                      {disposalReasonType === DISPOSAL_REASON_TYPES.OTHER && disposalReasonCustom && (
                        <p><strong>상세:</strong> {disposalReasonCustom}</p>
                      )}
                      <p><strong>총 수량:</strong> {totalItems}개</p>
                    </div>
                    <p className="text-destructive font-medium">
                      폐기 등록 후에는 취소가 불가능합니다.
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleSubmit}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      처리 중…
                    </>
                  ) : (
                    '폐기 등록'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
