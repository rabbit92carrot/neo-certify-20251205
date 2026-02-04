'use client';

/**
 * 시술 폼 컴포넌트
 * 병원에서 시술한 제품을 선택하고 환자 정보를 입력하여 시술을 등록합니다.
 *
 * SSOT: 환자 검색 로직은 usePatientSearch 훅으로 분리됨
 */

import { useState, useTransition, useMemo } from 'react';
import { toast } from 'sonner';
import { Stethoscope, Phone, Calendar, Loader2, User, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductSelector } from '@/components/shared/ProductSelector';
import { CartDisplay } from '@/components/shared/CartDisplay';
import { QuantityInputPanel } from '@/components/shared/QuantityInputPanel';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCart, usePatientSearch } from '@/hooks';
import { formatPhoneNumber, normalizePhoneNumber } from '@/lib/validations/common';
import { searchHospitalPatientsAction } from '@/app/(dashboard)/hospital/actions';
import type {
  ProductForTreatment,
  SelectableProduct,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api.types';
import type { TreatmentItemData } from '@/lib/validations/treatment';

/**
 * ProductForTreatment를 SelectableProduct로 변환하는 어댑터
 */
const toSelectableProduct = (product: ProductForTreatment): SelectableProduct => ({
  productId: product.productId,
  productName: product.productName,
  modelName: product.modelName,
  quantity: product.availableQuantity,
  displayName: product.alias || undefined,
});

interface TreatmentFormProps {
  /** 조직 ID (즐겨찾기 저장용) */
  organizationId: string;
  /** 시술 가능한 제품 목록 (활성화 + 재고 있음) */
  products: ProductForTreatment[];
  /** 시술 등록 액션 */
  onSubmit: (
    patientPhone: string,
    treatmentDate: string,
    items: TreatmentItemData[]
  ) => Promise<{ success: boolean; error?: { message: string } }>;
  /** 환자 검색 함수 (Preview에서 mock 주입용) */
  searchFn?: (query: string) => Promise<{ success: boolean; data?: string[] }>;
  /** 제품 검색 액션 (선택적) */
  searchProductsAction?: (
    search: string,
    favoriteIds: string[]
  ) => Promise<ApiResponse<ProductForTreatment[]>>;
  /** 전체 제품 조회 액션 (다이얼로그용, 선택적) */
  getAllProductsAction?: (
    page: number,
    search: string
  ) => Promise<ApiResponse<PaginatedResponse<ProductForTreatment>>>;
}

/**
 * 시술 폼 컴포넌트
 */
export function TreatmentForm({
  organizationId,
  products,
  onSubmit,
  searchFn = searchHospitalPatientsAction,
  searchProductsAction,
  getAllProductsAction,
}: TreatmentFormProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();
  const [selectedProduct, setSelectedProduct] = useState<ProductForTreatment | null>(null);
  const [quantity, setQuantity] = useState<string>('1');
  const [treatmentDate, setTreatmentDate] = useState<string>(() => {
    const today = new Date().toISOString().split('T')[0] ?? '';
    return today;
  });

  // 환자 검색 훅 (SSOT: 검색 로직 통합)
  const {
    phoneInputValue,
    patientPhone,
    patientSuggestions,
    isSearching,
    isPopoverOpen,
    setIsPopoverOpen,
    handlePhoneInputChange,
    handlePatientSelect,
    reset: resetPatientSearch,
  } = usePatientSearch({
    searchFn,
  });

  const {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    totalItems,
  } = useCart();

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

  const handleSubmit = () => {
    // 전화번호 검증
    const normalizedPhone = patientPhone.replace(/[^0-9]/g, '');
    if (!/^0\d{9,10}$/.test(normalizedPhone)) {
      toast.error('올바른 전화번호를 입력해주세요.');
      return;
    }

    if (!treatmentDate) {
      toast.error('시술일을 선택해주세요.');
      return;
    }

    if (items.length === 0) {
      toast.error('장바구니가 비어있습니다.');
      return;
    }

    startTransition(async () => {
      const treatmentItems: TreatmentItemData[] = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const result = await onSubmit(normalizedPhone, treatmentDate, treatmentItems);

      if (result.success) {
        toast.success(`${totalItems}개 제품 시술이 등록되었습니다.`);

        // mock 알림톡 미리보기 새 창 열기 (개발/테스트 환경)
        // 해당 환자 번호로 필터링된 메시지만 표시
        if (process.env.NODE_ENV !== 'production') {
          const mockUrl = `/mock/kakao?phone=${encodeURIComponent(normalizedPhone)}`;
          window.open(mockUrl, 'mock-kakao', 'width=430,height=930,noopener,noreferrer');
        }

        clearCart();
        resetPatientSearch();
        setSelectedProduct(null);
        const today = new Date().toISOString().split('T')[0];
        setTreatmentDate(today ?? '');
      } else {
        toast.error(result.error?.message || '시술 등록에 실패했습니다.');
      }
    });
  };

  // O(1) 조회를 위한 Map 캐시
  const productMap = useMemo(() => {
    const map = new Map<string, ProductForTreatment>();
    for (const product of products) {
      map.set(product.productId, product);
    }
    return map;
  }, [products]);

  const itemMap = useMemo(() => {
    const map = new Map<string, { item: typeof items[number]; quantity: number }>();
    for (const item of items) {
      const key = item.lotId ? `${item.productId}-${item.lotId}` : item.productId;
      map.set(key, { item, quantity: item.quantity });
    }
    return map;
  }, [items]);

  // 장바구니 내 제품별 수량 (ProductSelector용)
  const cartQuantityByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      const current = map.get(item.productId) || 0;
      map.set(item.productId, current + item.quantity);
    }
    return map;
  }, [items]);

  // 현재 선택된 제품의 가용 수량
  const currentAvailableQty = selectedProduct
    ? getAvailableQuantity(selectedProduct)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 왼쪽: 제품 선택 및 수량 입력 */}
      <div className="lg:col-span-2 space-y-6">
        {/* 환자 정보 입력 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5" />
              환자 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientPhone">전화번호</Label>
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="patientPhone"
                        type="tel"
                        placeholder="010-0000-0000"
                        value={phoneInputValue}
                        onChange={(e) => handlePhoneInputChange(e.target.value)}
                        onFocus={() => {
                          if (normalizePhoneNumber(phoneInputValue).length >= 3) {
                            setIsPopoverOpen(true);
                          }
                        }}
                        className="pl-9"
                      />
                      {isSearching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0"
                    align="start"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <Command shouldFilter={false}>
                      <CommandList>
                        {patientSuggestions.length === 0 && !isSearching && (
                          <CommandEmpty className="py-3 text-sm text-muted-foreground">
                            {normalizePhoneNumber(phoneInputValue).length >= 3
                              ? '기존 환자가 없습니다. 새 환자로 등록됩니다.'
                              : '3자리 이상 입력하세요'}
                          </CommandEmpty>
                        )}
                        {isSearching && (
                          <div className="flex items-center justify-center py-3 gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            검색 중…
                          </div>
                        )}
                        {patientSuggestions.length > 0 && (
                          <CommandGroup heading="기존 환자">
                            {patientSuggestions.map((phone) => (
                              <CommandItem
                                key={phone}
                                value={phone}
                                onSelect={() => handlePatientSelect(phone)}
                                className="cursor-pointer"
                              >
                                <User className="h-4 w-4 mr-2" />
                                {formatPhoneNumber(phone)}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  기존 환자를 검색하거나 새 전화번호를 입력하세요.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="treatmentDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  시술일
                </Label>
                <Input
                  id="treatmentDate"
                  type="date"
                  value={treatmentDate}
                  onChange={(e) => setTreatmentDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 제품 선택 (V2: 검색, 즐겨찾기, 전체 제품 다이얼로그 지원) */}
        <ProductSelector<ProductForTreatment>
          organizationId={organizationId}
          initialProducts={products}
          selectedProduct={selectedProduct}
          onSelectProduct={setSelectedProduct}
          getProductId={(p) => p.productId}
          getDisplayName={(p) => p.alias || p.productName}
          getQuantity={(p) => p.availableQuantity}
          toSelectableProduct={toSelectableProduct}
          searchProductsAction={searchProductsAction}
          getAllProductsAction={getAllProductsAction}
          cartQuantityByProduct={cartQuantityByProduct}
          cartItems={items}
          onAddToCart={addItem}
          onRemoveFromCart={removeItem}
          showFavorites={true}
          searchPlaceholder="제품명, 모델명, 별칭으로 검색"
          emptySearchMessage="검색 결과가 없습니다"
          emptyProductsMessage="시술 가능한 제품이 없습니다"
        />
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
                const itemKey = lotId ? `${productId}-${lotId}` : productId;
                const currentItem = itemMap.get(itemKey);
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
            confirmText="시술 등록"
            confirmDisabled={items.length === 0 || !patientPhone || !treatmentDate}
            isLoading={isPending}
            title="시술 장바구니"
          />

          {items.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700">
                <Stethoscope className="h-4 w-4" />
                <span className="text-sm font-medium">시술 안내</span>
              </div>
              <p className="mt-2 text-xs text-blue-600">
                시술 등록 시 환자에게 정품 인증 알림이 발송됩니다.
                오류 시 24시간 이내에 회수할 수 있습니다.
              </p>
              {/* 알림톡 발송 테스트 버튼 (비밀번호 보호) */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 w-full text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                onClick={() => {
                  const params = new URLSearchParams({
                    template: 'CERT_COMPLETE',
                    phone: phoneInputValue || '',
                  });
                  window.open(
                    `/alimtalk-test?${params}`,
                    'alimtalk-test',
                    'width=1680,height=950,noopener'
                  );
                }}
              >
                <ExternalLink className="mr-1.5 h-3 w-3" />
                알림톡 발송 테스트
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
