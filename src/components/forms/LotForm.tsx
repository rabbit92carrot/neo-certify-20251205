'use client';

/**
 * Lot 생산 등록 폼 컴포넌트
 * 제품 선택 + 생산 정보 입력
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { createLotAction } from '@/app/(dashboard)/manufacturer/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { Package, Check, Search, X } from 'lucide-react';
import { CONFIG, ERROR_MESSAGES } from '@/constants';
import type { Product, ManufacturerSettings } from '@/types/api.types';

interface LotFormProps {
  /** 선택 가능한 제품 목록 (활성 제품만) */
  products: Product[];
  /** 제조사 설정 (사용기한 계산용) */
  settings?: ManufacturerSettings;
}

// 제품명으로 그룹화하는 유틸리티 함수
function groupProductsByName(products: Product[]): Map<string, Product[]> {
  const grouped = new Map<string, Product[]>();
  products.forEach((product) => {
    const existing = grouped.get(product.name) || [];
    existing.push(product);
    grouped.set(product.name, existing);
  });
  return grouped;
}

// 아코디언 내부 모델 선택 카드
interface ModelCardProps {
  product: Product;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function ModelCard({ product, selected, onClick, disabled }: ModelCardProps): React.ReactElement {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={cn(
        'cursor-pointer rounded-lg border p-2.5 transition-all duration-200',
        'hover:border-primary hover:shadow-sm',
        selected && 'border-primary ring-2 ring-primary/20 bg-primary/5',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'rounded-full p-1 shrink-0 transition-colors',
            selected ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-600'
          )}
        >
          {selected ? <Check className="h-3 w-3" /> : <Package className="h-3 w-3" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{product.model_name}</p>
          <p className="text-[10px] text-muted-foreground truncate">UDI: {product.udi_di}</p>
        </div>
      </div>
    </div>
  );
}

// 폼 입력용 스키마 (모두 문자열)
const lotFormInputSchema = z.object({
  productId: z.string().min(1, '제품을 선택해주세요.'),
  quantity: z.string().min(1, ERROR_MESSAGES.GENERAL.REQUIRED_FIELD('수량')),
  manufactureDate: z.string().min(1, ERROR_MESSAGES.GENERAL.REQUIRED_FIELD('생산일자')),
  expiryDate: z.string().min(1, ERROR_MESSAGES.GENERAL.REQUIRED_FIELD('사용기한')),
});

type LotFormInputData = z.infer<typeof lotFormInputSchema>;

export function LotForm({ products, settings }: LotFormProps): React.ReactElement {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ lotNumber: string } | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // E안: 검색 및 아코디언 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // 오늘 날짜
  const today = new Date().toISOString().split('T')[0] ?? '';
  const expiryMonths = settings?.expiry_months || CONFIG.DEFAULT_EXPIRY_MONTHS;

  // 제품명별로 그룹화
  const groupedProducts = useMemo(() => groupProductsByName(products), [products]);

  // 검색 필터링
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return groupedProducts;
    }

    const query = searchQuery.toLowerCase();
    const filtered = new Map<string, Product[]>();

    groupedProducts.forEach((prods, name) => {
      const matchingProducts = prods.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.model_name.toLowerCase().includes(query) ||
          p.udi_di.includes(query)
      );

      if (matchingProducts.length > 0) {
        filtered.set(name, matchingProducts);
      }
    });

    return filtered;
  }, [groupedProducts, searchQuery]);

  // 검색 시 자동으로 아코디언 열기
  const effectiveExpandedItems = useMemo(() => {
    if (searchQuery.trim()) {
      return [...filteredGroups.keys()];
    }
    return expandedItems;
  }, [filteredGroups, expandedItems, searchQuery]);

  // 선택된 제품 정보
  const selectedProduct = useMemo(() => {
    if (!selectedProductId) {
      return null;
    }
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  // 기본 사용기한 계산 (오늘 + N개월 - 1일)
  const calculateDefaultExpiryDate = useCallback((baseDate: string): string => {
    const date = new Date(baseDate);
    date.setMonth(date.getMonth() + expiryMonths);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0] ?? '';
  }, [expiryMonths]);

  const defaultExpiryDate = calculateDefaultExpiryDate(today);

  const form = useForm<LotFormInputData>({
    resolver: zodResolver(lotFormInputSchema),
    defaultValues: {
      productId: '',
      quantity: '',
      manufactureDate: today,
      expiryDate: defaultExpiryDate,
    },
  });

  // 생산일자 변경 시 사용기한 자동 계산 (항상 덮어씌움)
  const manufactureDate = form.watch('manufactureDate');

  useEffect(() => {
    if (manufactureDate) {
      const expiry = calculateDefaultExpiryDate(manufactureDate);
      form.setValue('expiryDate', expiry);
    }
  }, [manufactureDate, form, calculateDefaultExpiryDate]);

  // 제품 선택 시 productId 업데이트
  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    form.setValue('productId', productId);
    form.clearErrors('productId');
  };

  async function onSubmit(data: LotFormInputData) {
    if (!selectedProductId) {
      setError('제품을 선택해주세요.');
      return;
    }

    // 수량 검증
    const quantity = parseInt(data.quantity, 10);
    if (isNaN(quantity) || quantity < CONFIG.QUANTITY.MIN) {
      form.setError('quantity', { message: ERROR_MESSAGES.QUANTITY.MIN });
      return;
    }
    if (quantity > CONFIG.QUANTITY.MAX_PRODUCTION) {
      form.setError('quantity', { message: ERROR_MESSAGES.QUANTITY.MAX_PRODUCTION });
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('productId', selectedProductId);
      formData.append('quantity', data.quantity);
      formData.append('manufactureDate', data.manufactureDate);
      formData.append('expiryDate', data.expiryDate);

      const result = await createLotAction(formData);

      if (result.success && result.data) {
        setSuccess({ lotNumber: result.data.lotNumber });
        form.reset({
          productId: '',
          quantity: '',
          manufactureDate: today,
          expiryDate: defaultExpiryDate,
        });
        setSelectedProductId(null);
        router.refresh();
      } else {
        // 필드별 에러 설정
        if (result.error?.details) {
          Object.entries(result.error.details).forEach(([field, messages]) => {
            if (messages.length > 0) {
              form.setError(field as keyof LotFormInputData, {
                message: messages[0],
              });
            }
          });
        }
        setError(result.error?.message || '생산 등록에 실패했습니다.');
      }
    } catch {
      setError(ERROR_MESSAGES.GENERAL.SERVER_ERROR);
    } finally {
      setIsLoading(false);
    }
  }

  // 검색 초기화
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="space-y-4">
      {/* 성공 메시지 */}
      {success && (
        <div className="p-4 rounded-md bg-green-50 border border-green-200">
          <p className="text-green-800 font-medium">생산 등록이 완료되었습니다!</p>
          <p className="text-green-700 text-sm mt-1">
            Lot 번호: <span className="font-mono font-semibold">{success.lotNumber}</span>
          </p>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {/* E안: 2열 레이아웃 (좌: 제품 선택, 우: 생산 정보) */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 좌측: 아코디언 제품 선택 영역 */}
        <div className="flex-1 lg:max-w-[60%]">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">제품 선택</CardTitle>
              <CardDescription>제품군을 선택한 후 모델을 선택하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {products.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-30 text-gray-400" />
                  <p className="text-gray-500">활성화된 제품이 없습니다.</p>
                  <p className="text-gray-400 text-sm mt-1">
                    제품 관리 메뉴에서 제품을 먼저 등록해주세요.
                  </p>
                </div>
              ) : (
                <>
                  {/* 검색 입력 */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="제품명 또는 모델명 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-9"
                      disabled={isLoading}
                    />
                    {searchQuery && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={handleClearSearch}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* 아코디언 그룹 - 스크롤 영역 */}
                  <div className="max-h-[400px] overflow-y-auto pr-2 -mr-2">
                    {filteredGroups.size === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>검색 결과가 없습니다</p>
                      </div>
                    ) : (
                      <Accordion
                        type="multiple"
                        value={effectiveExpandedItems}
                        onValueChange={setExpandedItems}
                        className="space-y-2"
                      >
                        {[...filteredGroups.entries()].map(([productName, prods]) => (
                          <AccordionItem
                            key={productName}
                            value={productName}
                            className="border rounded-lg px-3"
                          >
                            <AccordionTrigger className="hover:no-underline py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{productName}</span>
                                <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">
                                  {prods.length}개
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {prods.map((product) => (
                                  <ModelCard
                                    key={product.id}
                                    product={product}
                                    selected={selectedProductId === product.id}
                                    onClick={() => handleProductSelect(product.id)}
                                    disabled={isLoading}
                                  />
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                  </div>

                  {/* 전체 그룹 수 표시 */}
                  {!searchQuery && (
                    <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                      {groupedProducts.size}개 제품군 · 총 {products.length}개 제품
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 우측: 생산 정보 폼 (sticky) */}
        <div className="lg:w-[40%]">
          <div className="lg:sticky lg:top-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">생산 정보</CardTitle>
                <CardDescription>
                  {selectedProduct
                    ? '생산 수량 및 일자를 입력하세요'
                    : '제품을 먼저 선택해주세요'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* 선택된 제품 표시 */}
                {selectedProduct && (
                  <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full p-1.5 bg-primary text-primary-foreground shrink-0">
                        <Check className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{selectedProduct.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {selectedProduct.model_name}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* 숨겨진 productId 필드 */}
                    <input type="hidden" {...form.register('productId')} />

                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>수량 *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={CONFIG.QUANTITY.MIN}
                              max={CONFIG.QUANTITY.MAX_PRODUCTION}
                              placeholder={`생산 수량 (${CONFIG.QUANTITY.MIN} ~ ${CONFIG.QUANTITY.MAX_PRODUCTION.toLocaleString()})`}
                              disabled={isLoading || !selectedProductId}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            최대 {CONFIG.QUANTITY.MAX_PRODUCTION.toLocaleString()}개까지 입력
                            가능합니다.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="manufactureDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>생산일자 *</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              disabled={isLoading || !selectedProductId}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expiryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>사용기한 *</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              disabled={isLoading || !selectedProductId}
                              {...field}
                              onChange={(e) => field.onChange(e)}
                            />
                          </FormControl>
                          <FormDescription>
                            기본값: 생산일자 + {expiryMonths}개월 (수동 수정 가능)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || !selectedProductId || products.length === 0}
                    >
                      {isLoading ? '등록 중...' : '생산 등록'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
