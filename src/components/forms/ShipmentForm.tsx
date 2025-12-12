'use client';

/**
 * 출고 폼 컴포넌트
 * 제조사/유통사에서 출고할 제품을 선택하고 장바구니에 담아 출고합니다.
 */

import { useState, useTransition, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { Package, Send, Building2, Hospital } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductCard } from '@/components/shared/ProductCard';
import { CartDisplay } from '@/components/shared/CartDisplay';
import { EmptyState } from '@/components/shared/EmptyState';
import { useCart } from '@/hooks/useCart';
import type { Product, Organization, OrganizationType, InventoryByLot } from '@/types/api.types';
import type { ShipmentItemData } from '@/lib/validations/shipment';

interface ProductWithInventory extends Product {
  availableQuantity: number;
  lots?: InventoryByLot[];
}

interface ShipmentFormProps {
  /** 현재 조직 유형 (향후 확장용) */
  organizationType: OrganizationType;
  /** 출고 가능한 제품 목록 (재고 포함) */
  products: ProductWithInventory[];
  /** 출고 대상 조직 목록 */
  targetOrganizations: Pick<Organization, 'id' | 'name' | 'type'>[];
  /** 출고 액션 */
  onSubmit: (
    toOrganizationId: string,
    items: ShipmentItemData[]
  ) => Promise<{ success: boolean; error?: { message: string } }>;
  /** Lot 선택 가능 여부 (제조사만) */
  canSelectLot?: boolean;
}

/**
 * 출고 폼 컴포넌트
 */
export function ShipmentForm({
  organizationType: _organizationType,
  products,
  targetOrganizations,
  onSubmit,
  canSelectLot = false,
}: ShipmentFormProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<ProductWithInventory | null>(null);
  const [selectedLotId, setSelectedLotId] = useState<string>('auto');
  const [quantity, setQuantity] = useState<string>('1');

  const {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    totalItems,
  } = useCart();

  // 선택된 제품의 현재 가용 수량 계산 (장바구니에 담긴 수량 제외)
  const getAvailableQuantity = useCallback((product: ProductWithInventory, lotId?: string): number => {
    // 장바구니에 담긴 수량
    const cartQuantity = items
      .filter((item) => {
        if (lotId) {
          return item.productId === product.id && item.lotId === lotId;
        }
        return item.productId === product.id && !item.lotId;
      })
      .reduce((sum, item) => sum + item.quantity, 0);

    if (lotId && product.lots) {
      const lot = product.lots.find((l) => l.lotId === lotId);
      return (lot?.quantity ?? 0) - cartQuantity;
    }

    // 전체 재고에서 장바구니 수량 제외
    const totalCartQuantity = items
      .filter((item) => item.productId === product.id)
      .reduce((sum, item) => sum + item.quantity, 0);

    return product.availableQuantity - totalCartQuantity;
  }, [items]);

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

    const availableQty = getAvailableQuantity(selectedProduct, selectedLotId === 'auto' ? undefined : selectedLotId);
    if (qty > availableQty) {
      toast.error(`재고가 부족합니다. 현재 재고: ${availableQty}개`);
      return;
    }

    // Lot 정보 조회
    let lotNumber: string | undefined;
    if (selectedLotId !== 'auto' && selectedProduct.lots) {
      const lot = selectedProduct.lots.find((l) => l.lotId === selectedLotId);
      lotNumber = lot?.lotNumber;
    }

    addItem({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: qty,
      lotId: selectedLotId === 'auto' ? undefined : selectedLotId,
      lotNumber,
    });

    toast.success('장바구니에 추가되었습니다.');
    setQuantity('1');
    setSelectedLotId('');
  };

  const handleSubmit = () => {
    if (!selectedOrganizationId) {
      toast.error('출고 대상을 선택해주세요.');
      return;
    }

    if (items.length === 0) {
      toast.error('장바구니가 비어있습니다.');
      return;
    }

    startTransition(async () => {
      const shipmentItems: ShipmentItemData[] = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        lotId: item.lotId,
      }));

      const result = await onSubmit(selectedOrganizationId, shipmentItems);

      if (result.success) {
        toast.success(`${totalItems}개 제품이 출고되었습니다.`);
        clearCart();
        setSelectedOrganizationId('');
        setSelectedProduct(null);
      } else {
        toast.error(result.error?.message || '출고에 실패했습니다.');
      }
    });
  };

  // 조직 옵션 생성
  const organizationOptions: ComboboxOption[] = useMemo(() => {
    return targetOrganizations.map((org) => ({
      value: org.id,
      label: org.name,
      icon: org.type === 'HOSPITAL' ? <Hospital className="h-4 w-4" /> : <Building2 className="h-4 w-4" />,
      description: org.type === 'HOSPITAL' ? '병원' : '유통사',
    }));
  }, [targetOrganizations]);

  // Lot 옵션 생성
  const lotOptions: ComboboxOption[] = useMemo(() => {
    if (!selectedProduct?.lots) {return [];}

    const options: ComboboxOption[] = [
      { value: 'auto', label: '자동 선택 (FIFO)' },
    ];

    selectedProduct.lots.forEach((lot) => {
      const lotAvailableQty = getAvailableQuantity(selectedProduct, lot.lotId);
      options.push({
        value: lot.lotId,
        label: `${lot.lotNumber} (재고: ${lotAvailableQty}개)`,
        description: `유효기한: ${lot.expiryDate}`,
      });
    });

    return options;
  }, [selectedProduct, getAvailableQuantity]);

  // 현재 선택된 제품의 가용 수량
  const currentAvailableQty = selectedProduct
    ? getAvailableQuantity(selectedProduct, selectedLotId === 'auto' ? undefined : selectedLotId)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 왼쪽: 제품 선택 및 수량 입력 */}
      <div className="lg:col-span-2 space-y-6">
        {/* 출고 대상 선택 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">출고 대상</CardTitle>
          </CardHeader>
          <CardContent>
            <Combobox
              options={organizationOptions}
              value={selectedOrganizationId}
              onValueChange={setSelectedOrganizationId}
              placeholder="출고할 대상을 선택하세요"
              searchPlaceholder="조직명 검색..."
              emptyMessage="검색 결과가 없습니다."
            />
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
                title="출고 가능한 제품이 없습니다"
                description="재고가 있는 제품이 없습니다."
              />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {products.map((product) => {
                  const availableQty = getAvailableQuantity(product);
                  return (
                    <ProductCard
                      key={product.id}
                      name={product.name}
                      modelName={product.model_name}
                      additionalInfo={`재고: ${availableQty}개`}
                      isSelected={selectedProduct?.id === product.id}
                      onClick={() => {
                        setSelectedProduct(product);
                        setSelectedLotId('');
                      }}
                      disabled={availableQty === 0}
                    />
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 수량 입력 */}
        {selectedProduct && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">수량 입력</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  선택된 제품: <strong>{selectedProduct.name}</strong>
                  {' '}- 가용 재고: <strong>{currentAvailableQty}개</strong>
                </p>
              </div>

              {/* Lot 선택 (제조사만) */}
              {canSelectLot && selectedProduct.lots && selectedProduct.lots.length > 0 && (
                <div className="space-y-2">
                  <Label>Lot 선택 (선택사항)</Label>
                  <Combobox
                    options={lotOptions}
                    value={selectedLotId}
                    onValueChange={setSelectedLotId}
                    placeholder="자동 선택 (FIFO)"
                    searchPlaceholder="Lot 번호 검색..."
                    emptyMessage="검색 결과가 없습니다."
                  />
                  <p className="text-xs text-muted-foreground">
                    Lot을 선택하지 않으면 FIFO 방식으로 자동 출고됩니다.
                  </p>
                </div>
              )}

              {/* 수량 입력 */}
              <div className="space-y-2">
                <Label htmlFor="quantity">수량</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    max={currentAvailableQty}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">
                    / {currentAvailableQty}개
                  </span>
                </div>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={currentAvailableQty === 0}
                className="w-full"
              >
                장바구니에 담기
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 오른쪽: 장바구니 */}
      <div className="lg:col-span-1">
        <div className="sticky top-6">
          <CartDisplay
            items={items}
            onUpdateQuantity={(productId, qty, lotId) => {
              // 재고 확인
              const product = products.find((p) => p.id === productId);
              if (product) {
                const availableQty = getAvailableQuantity(product, lotId);
                const currentItem = items.find(
                  (item) => item.productId === productId && item.lotId === lotId
                );
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
            onConfirm={handleSubmit}
            confirmText="출고하기"
            confirmDisabled={!selectedOrganizationId || items.length === 0}
            isLoading={isPending}
            title="출고 장바구니"
          />

          {items.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700">
                <Send className="h-4 w-4" />
                <span className="text-sm font-medium">출고 안내</span>
              </div>
              <p className="mt-2 text-xs text-blue-600">
                출고 확인 시 즉시 소유권이 이전됩니다.
                오류 시 24시간 이내에 회수할 수 있습니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
