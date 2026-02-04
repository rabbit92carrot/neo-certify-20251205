'use client';

/**
 * 출고 폼 컴포넌트 V2
 * 최적화된 버전: Lot lazy loading, 12개 제품 초기 로딩, 즐겨찾기 지원
 */

import { useState, useTransition, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { SearchableCombobox, type SearchableComboboxOption } from '@/components/ui/searchable-combobox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ShipmentProductSelector } from '@/components/forms/shipment/ShipmentProductSelector';
import { CartDisplay } from '@/components/shared/CartDisplay';
import { QuantityInputPanel } from '@/components/shared/QuantityInputPanel';
import { useCart } from '@/hooks/useCart';
import type {
  ShipmentProductSummary,
  OrganizationType,
  InventoryByLot,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api.types';
import type { ShipmentItemData } from '@/lib/validations/shipment';

interface ShipmentFormV2Props {
  /** 조직 ID */
  organizationId: string;
  /** 현재 조직 유형 */
  organizationType: OrganizationType;
  /** 초기 제품 목록 (상위 12개) */
  initialProducts: ShipmentProductSummary[];
  /** 출고 대상 조직 검색 함수 */
  onSearchOrganizations: (query: string) => Promise<SearchableComboboxOption[]>;
  /** 출고 액션 */
  onSubmit: (
    toOrganizationId: string,
    items: ShipmentItemData[]
  ) => Promise<{ success: boolean; error?: { message: string } }>;
  /** Lot 선택 가능 여부 */
  canSelectLot?: boolean;
  /** 제품 검색 액션 */
  searchProductsAction: (
    search: string,
    favoriteIds: string[]
  ) => Promise<ApiResponse<ShipmentProductSummary[]>>;
  /** Lot 조회 액션 */
  getProductLotsAction: (productId: string) => Promise<ApiResponse<InventoryByLot[]>>;
  /** 전체 제품 조회 액션 (다이얼로그용) */
  getAllProductsAction?: (
    page: number,
    search: string
  ) => Promise<ApiResponse<PaginatedResponse<ShipmentProductSummary>>>;
}

/**
 * 출고 폼 컴포넌트 V2 (최적화)
 */
export function ShipmentFormV2({
  organizationId,
  organizationType: _organizationType,
  initialProducts,
  onSearchOrganizations,
  onSubmit,
  canSelectLot = false,
  searchProductsAction,
  getProductLotsAction,
  getAllProductsAction,
}: ShipmentFormV2Props): React.ReactElement {
  const [isPending, startTransition] = useTransition();
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<ShipmentProductSummary | null>(null);
  const [selectedLotId, setSelectedLotId] = useState<string>('auto');
  const [quantity, setQuantity] = useState<string>('1');

  // Lot lazy loading 상태
  const [productLots, setProductLots] = useState<InventoryByLot[]>([]);
  const [isLoadingLots, setIsLoadingLots] = useState(false);

  const {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    totalItems,
  } = useCart();

  // 제품별 장바구니 수량 계산
  const cartQuantityByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      const current = map.get(item.productId) ?? 0;
      map.set(item.productId, current + item.quantity);
    }
    return map;
  }, [items]);

  // 선택된 제품 변경 시 Lot 로딩
  useEffect(() => {
    if (!selectedProduct || !canSelectLot) {
      setProductLots([]);
      setSelectedLotId('auto');
      return;
    }

    setIsLoadingLots(true);
    getProductLotsAction(selectedProduct.productId)
      .then((result) => {
        if (result.success && result.data) {
          setProductLots(result.data);
        } else {
          setProductLots([]);
        }
      })
      .catch(() => {
        setProductLots([]);
      })
      .finally(() => {
        setIsLoadingLots(false);
        setSelectedLotId('auto');
      });
  }, [selectedProduct, canSelectLot, getProductLotsAction]);

  // 선택된 제품의 현재 가용 수량 계산
  const getAvailableQuantity = useCallback(
    (product: ShipmentProductSummary, lotId?: string): number => {
      if (lotId && lotId !== 'auto' && productLots.length > 0) {
        const lot = productLots.find((l) => l.lotId === lotId);
        if (!lot) return 0;

        // 해당 Lot에서 장바구니에 담긴 수량 제외
        const cartQtyForLot = items
          .filter((item) => item.productId === product.productId && item.lotId === lotId)
          .reduce((sum, item) => sum + item.quantity, 0);

        return lot.quantity - cartQtyForLot;
      }

      // 전체 재고에서 장바구니 수량 제외
      const cartQty = cartQuantityByProduct.get(product.productId) ?? 0;
      return product.totalQuantity - cartQty;
    },
    [items, productLots, cartQuantityByProduct]
  );

  // 제품 선택 핸들러
  const handleSelectProduct = useCallback((product: ShipmentProductSummary) => {
    setSelectedProduct(product);
    setQuantity('1');
  }, []);

  // 장바구니 추가 핸들러
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

    const availableQty = getAvailableQuantity(
      selectedProduct,
      selectedLotId === 'auto' ? undefined : selectedLotId
    );
    if (qty > availableQty) {
      toast.error(`재고가 부족합니다. 현재 재고: ${availableQty}개`);
      return;
    }

    // Lot 정보 조회
    let lotNumber: string | undefined;
    if (selectedLotId !== 'auto' && productLots.length > 0) {
      const lot = productLots.find((l) => l.lotId === selectedLotId);
      lotNumber = lot?.lotNumber;
    }

    addItem({
      productId: selectedProduct.productId,
      productName: selectedProduct.productName,
      quantity: qty,
      lotId: selectedLotId === 'auto' ? undefined : selectedLotId,
      lotNumber,
    });

    toast.success('장바구니에 추가되었습니다.');
    setQuantity('1');
    setSelectedLotId('auto');
  };

  // 출고 제출 핸들러
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

  // Lot 옵션 생성
  const lotOptions: ComboboxOption[] = useMemo(() => {
    if (!selectedProduct || productLots.length === 0) {
      return [];
    }

    const options: ComboboxOption[] = [
      { value: 'auto', label: '자동 선택 (FIFO)' },
    ];

    productLots.forEach((lot) => {
      const lotAvailableQty = getAvailableQuantity(selectedProduct, lot.lotId);
      options.push({
        value: lot.lotId,
        label: `${lot.lotNumber} (재고: ${lotAvailableQty}개)`,
        description: `유효기한: ${lot.expiryDate}`,
      });
    });

    return options;
  }, [selectedProduct, productLots, getAvailableQuantity]);

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
            <SearchableCombobox
              value={selectedOrganizationId}
              onValueChange={setSelectedOrganizationId}
              onSearch={onSearchOrganizations}
              placeholder="출고 대상을 검색하세요"
              searchPlaceholder="조직명 검색 (2자 이상)..."
              emptyMessage="검색 결과가 없습니다."
              minCharsMessage="2글자 이상 입력하세요."
              debounceMs={300}
              minSearchLength={2}
            />
          </CardContent>
        </Card>

        {/* 제품 선택 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">제품 선택</CardTitle>
          </CardHeader>
          <CardContent>
            <ShipmentProductSelector
              organizationId={organizationId}
              initialProducts={initialProducts}
              selectedProduct={selectedProduct}
              onSelectProduct={handleSelectProduct}
              searchProductsAction={searchProductsAction}
              getProductLotsAction={getProductLotsAction}
              getAllProductsAction={getAllProductsAction}
              cartQuantityByProduct={cartQuantityByProduct}
              cartItems={items}
              onAddToCart={addItem}
              onRemoveFromCart={removeItem}
            />
          </CardContent>
        </Card>
      </div>

      {/* 오른쪽: 수량 입력 + 장바구니 */}
      <div className="lg:col-span-1">
        <div className="sticky top-20 space-y-4">
          {/* 수량 입력 */}
          <QuantityInputPanel
            selectedProduct={
              selectedProduct
                ? {
                    productId: selectedProduct.productId,
                    displayName: selectedProduct.productName,
                  }
                : null
            }
            availableQuantity={currentAvailableQty}
            quantity={quantity}
            onQuantityChange={setQuantity}
            onAddToCart={handleAddToCart}
            lotSelector={
              canSelectLot && selectedProduct ? (
                <div className="space-y-2">
                  <Label>Lot 선택 (선택사항)</Label>
                  {isLoadingLots ? (
                    <Skeleton className="h-10 w-full" />
                  ) : productLots.length > 0 ? (
                    <>
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
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Lot 정보가 없습니다.</p>
                  )}
                </div>
              ) : undefined
            }
          />

          {/* 장바구니 */}
          <CartDisplay
            items={items}
            onUpdateQuantity={(productId, qty, lotId) => {
              // 재고 확인 후 수량 업데이트
              const product = initialProducts.find((p) => p.productId === productId);
              if (product) {
                const availableQty = getAvailableQuantity(product, lotId);
                const currentItem = items.find(
                  (item) =>
                    item.productId === productId &&
                    (lotId ? item.lotId === lotId : !item.lotId)
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
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700">
                <Send className="h-4 w-4" />
                <span className="text-sm font-medium">출고 안내</span>
              </div>
              <p className="mt-2 text-xs text-blue-600">
                출고 확인 시 즉시 소유권이 이전됩니다. 오류 시 24시간 이내에 회수할 수
                있습니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
