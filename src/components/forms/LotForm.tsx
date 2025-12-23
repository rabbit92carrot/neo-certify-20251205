'use client';

/**
 * Lot 생산 등록 폼 컴포넌트
 * 제품 선택 + 생산 정보 입력
 *
 * SSOT: 제품 선택 UI는 lot/ProductSelector 컴포넌트 재사용
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
import { Check } from 'lucide-react';
import { CONFIG, ERROR_MESSAGES } from '@/constants';
import { ProductSelector } from './lot/ProductSelector';
import type { Product, ManufacturerSettings } from '@/types/api.types';

interface LotFormProps {
  /** 선택 가능한 제품 목록 (활성 제품만) */
  products: Product[];
  /** 제조사 설정 (사용기한 계산용) */
  settings?: ManufacturerSettings;
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

  // 오늘 날짜
  const today = new Date().toISOString().split('T')[0] ?? '';
  const expiryMonths = settings?.expiry_months || CONFIG.DEFAULT_EXPIRY_MONTHS;

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

      {/* 2열 레이아웃 (좌: 제품 선택, 우: 생산 정보) */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 좌측: 아코디언 제품 선택 영역 (ProductSelector 컴포넌트 재사용) */}
        <div className="flex-1 lg:max-w-[60%]">
          <ProductSelector
            products={products}
            selectedProductId={selectedProductId}
            onProductSelect={handleProductSelect}
            disabled={isLoading}
          />
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
