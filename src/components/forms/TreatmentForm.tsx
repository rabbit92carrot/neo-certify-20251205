'use client';

/**
 * 시술 폼 컴포넌트
 * 병원에서 시술한 제품을 선택하고 환자 정보를 입력하여 시술을 등록합니다.
 */

import { useState, useTransition, useRef, useCallback, useEffect, useMemo, useDeferredValue } from 'react';
import { toast } from 'sonner';
import { Package, Stethoscope, Phone, Calendar, Loader2, User, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CartDisplay } from '@/components/shared/CartDisplay';
import { EmptyState } from '@/components/shared/EmptyState';
import { PaginatedProductGrid } from '@/components/shared/PaginatedProductGrid';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCart } from '@/hooks/useCart';
import { formatPhoneNumber, normalizePhoneNumber } from '@/lib/validations/common';
import { searchHospitalPatientsAction } from '@/app/(dashboard)/hospital/actions';
import type { Product } from '@/types/api.types';
import type { TreatmentItemData } from '@/lib/validations/treatment';

interface ProductWithInventory extends Product {
  availableQuantity: number;
}

interface TreatmentFormProps {
  /** 시술 가능한 제품 목록 (재고 포함) */
  products: ProductWithInventory[];
  /** 시술 등록 액션 */
  onSubmit: (
    patientPhone: string,
    treatmentDate: string,
    items: TreatmentItemData[]
  ) => Promise<{ success: boolean; error?: { message: string } }>;
}

/**
 * 시술 폼 컴포넌트
 */
export function TreatmentForm({
  products,
  onSubmit,
}: TreatmentFormProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();
  const [selectedProduct, setSelectedProduct] = useState<ProductWithInventory | null>(null);
  const [quantity, setQuantity] = useState<string>('1');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [treatmentDate, setTreatmentDate] = useState<string>(() => {
    const today = new Date().toISOString().split('T')[0];
    return today ?? '';
  });
  const [productSearchInput, setProductSearchInput] = useState<string>('');
  const [productSearch, setProductSearch] = useState<string>('');
  const deferredProductSearch = useDeferredValue(productSearch);
  const productDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // 제품 검색어 디바운스 (150ms)
  useEffect(() => {
    if (productDebounceRef.current) {
      clearTimeout(productDebounceRef.current);
    }
    productDebounceRef.current = setTimeout(() => {
      setProductSearch(productSearchInput);
    }, 150);
    return () => {
      if (productDebounceRef.current) {
        clearTimeout(productDebounceRef.current);
      }
    };
  }, [productSearchInput]);

  // 환자 검색 관련 상태
  const [phoneInputValue, setPhoneInputValue] = useState<string>('');
  const [patientSuggestions, setPatientSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const patientDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    totalItems,
  } = useCart();

  // 선택된 제품의 현재 가용 수량 계산 (장바구니에 담긴 수량 제외)
  const getAvailableQuantity = (product: ProductWithInventory): number => {
    const cartQuantity = items
      .filter((item) => item.productId === product.id && !item.lotId)
      .reduce((sum, item) => sum + item.quantity, 0);
    return product.availableQuantity - cartQuantity;
  };

  // 환자 검색 핸들러 (debounce 300ms)
  const handlePatientSearch = useCallback((value: string) => {
    // 기존 타이머 취소
    if (patientDebounceRef.current) {
      clearTimeout(patientDebounceRef.current);
    }

    const normalized = normalizePhoneNumber(value);

    // 3자리 미만이면 검색하지 않음
    if (normalized.length < 3) {
      setPatientSuggestions([]);
      return;
    }

    // 300ms 후 검색 실행
    patientDebounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      const result = await searchHospitalPatientsAction(normalized);
      if (result.success && result.data) {
        setPatientSuggestions(result.data);
      } else {
        setPatientSuggestions([]);
      }
      setIsSearching(false);
    }, 300);
  }, []);

  // 환자 선택 핸들러
  const handlePatientSelect = useCallback((phone: string) => {
    const formatted = formatPhoneNumber(phone);
    setPatientPhone(formatted);
    setPhoneInputValue(formatted);
    setIsPopoverOpen(false);
    setPatientSuggestions([]);
  }, []);

  // 전화번호 입력 핸들러 (자동 포맷팅 + 검색)
  const handlePhoneInputChange = useCallback((value: string) => {
    const digitsOnly = value.replace(/[^0-9]/g, '');
    if (digitsOnly.length <= 11) {
      const formatted = formatPhoneNumber(digitsOnly);
      setPhoneInputValue(formatted);
      setPatientPhone(formatted);
      handlePatientSearch(digitsOnly);

      // 입력값이 있으면 팝오버 열기
      if (digitsOnly.length >= 3) {
        setIsPopoverOpen(true);
      }
    }
  }, [handlePatientSearch]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (patientDebounceRef.current) {
        clearTimeout(patientDebounceRef.current);
      }
    };
  }, []);

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
      productId: selectedProduct.id,
      productName: selectedProduct.name,
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
        setPatientPhone('');
        setPhoneInputValue('');
        setPatientSuggestions([]);
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

  // 검색 필터링된 제품 목록 (useDeferredValue로 입력 응답성 유지)
  const filteredProducts = useMemo(() => {
    if (!deferredProductSearch.trim()) return products;
    const searchLower = deferredProductSearch.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchLower) ||
        product.model_name.toLowerCase().includes(searchLower)
    );
  }, [products, deferredProductSearch]);

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
                            검색 중...
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg">제품 선택</CardTitle>
            {products.length > 0 && (
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="제품명, 모델명 검색..."
                  value={productSearchInput}
                  onChange={(e) => setProductSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <EmptyState
                icon={Package}
                title="시술 가능한 제품이 없습니다"
                description="재고가 있는 제품이 없습니다."
              />
            ) : filteredProducts.length === 0 ? (
              <EmptyState
                icon={Search}
                title="검색 결과가 없습니다"
                description="다른 검색어로 시도해보세요."
              />
            ) : (
              <PaginatedProductGrid
                products={filteredProducts}
                selectedProductId={selectedProduct?.id}
                onSelect={setSelectedProduct}
                getAvailableQuantity={getAvailableQuantity}
              />
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
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
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
