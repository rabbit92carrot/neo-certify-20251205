'use client';

/**
 * 시술 폼 컴포넌트
 * 병원에서 시술한 제품을 선택하고 환자 정보를 입력하여 시술을 등록합니다.
 *
 * SSOT: 환자 검색 로직은 usePatientSearch 훅으로 분리됨
 */

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Package, Stethoscope, Phone, Calendar, Loader2, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductCard } from '@/components/shared/ProductCard';
import { CartDisplay } from '@/components/shared/CartDisplay';
import { EmptyState } from '@/components/shared/EmptyState';
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
import type { ProductForTreatment } from '@/types/api.types';
import type { TreatmentItemData } from '@/lib/validations/treatment';

interface TreatmentFormProps {
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
}

/**
 * 시술 폼 컴포넌트
 */
export function TreatmentForm({
  products,
  onSubmit,
  searchFn = searchHospitalPatientsAction,
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

        {/* 제품 선택 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">제품 선택</CardTitle>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <EmptyState
                icon={Package}
                title="시술 가능한 제품이 없습니다"
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
              // 재고 확인
              const product = products.find((p) => p.productId === productId);
              if (product) {
                const availableQty = getAvailableQuantity(product);
                const currentItem = items.find((item) => item.productId === productId && item.lotId === lotId);
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
