'use client';

/**
 * Lot 생산 등록 폼 컴포넌트
 * 제품 선택 + 생산 정보 입력
 */

import { useState, useEffect, useCallback } from 'react';
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
import { ProductCard } from '@/components/shared/ProductCard';
import { CONFIG, ERROR_MESSAGES } from '@/constants';
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
    <div className="space-y-6">
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

      {/* 제품 선택 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>제품 선택</CardTitle>
          <CardDescription>생산할 제품을 선택하세요</CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">활성화된 제품이 없습니다.</p>
              <p className="text-gray-400 text-sm mt-1">
                제품 관리 메뉴에서 제품을 먼저 등록해주세요.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  selected={selectedProductId === product.id}
                  onClick={() => handleProductSelect(product.id)}
                  disabled={isLoading}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 생산 정보 입력 */}
      <Card>
        <CardHeader>
          <CardTitle>생산 정보</CardTitle>
          <CardDescription>생산 수량 및 일자를 입력하세요</CardDescription>
        </CardHeader>
        <CardContent>
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
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      최대 {CONFIG.QUANTITY.MAX_PRODUCTION.toLocaleString()}개까지 입력 가능합니다.
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
                      <Input type="date" disabled={isLoading} {...field} />
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
                        disabled={isLoading}
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
  );
}
