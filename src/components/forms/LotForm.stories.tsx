'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Check, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * LotForm은 Server Actions와 Router에 의존합니다.
 * Storybook에서는 Mock 컴포넌트로 UI를 시뮬레이션합니다.
 */

interface MockProduct {
  id: string;
  name: string;
  modelName: string;
  udiDi: string;
}

const mockProducts: MockProduct[] = [
  { id: 'prod-001', name: 'PDO Thread Type A', modelName: 'PDO-A-100', udiDi: '1234567890123' },
  { id: 'prod-002', name: 'PDO Thread Type B', modelName: 'PDO-B-200', udiDi: '1234567890124' },
  { id: 'prod-003', name: 'PDO Thread Premium', modelName: 'PDO-P-500', udiDi: '1234567890125' },
];

const lotFormSchema = z.object({
  productId: z.string().min(1, '제품을 선택해주세요'),
  quantity: z.string().min(1, '수량을 입력해주세요'),
  manufactureDate: z.string().min(1, '생산일자를 입력해주세요'),
  expiryDate: z.string().min(1, '사용기한을 입력해주세요'),
});

type LotFormData = z.infer<typeof lotFormSchema>;

function MockLotForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ lotNumber: string } | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0] ?? '';
  const expiryDate = (() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 24);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0] ?? '';
  })();

  const form = useForm<LotFormData>({
    resolver: zodResolver(lotFormSchema),
    defaultValues: {
      productId: '',
      quantity: '',
      manufactureDate: today,
      expiryDate: expiryDate,
    },
  });

  const manufactureDate = form.watch('manufactureDate');

  useEffect(() => {
    if (manufactureDate) {
      const date = new Date(manufactureDate);
      date.setMonth(date.getMonth() + 24);
      date.setDate(date.getDate() - 1);
      form.setValue('expiryDate', date.toISOString().split('T')[0] ?? '');
    }
  }, [manufactureDate, form]);

  const selectedProduct = mockProducts.find(p => p.id === selectedProductId);

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    form.setValue('productId', productId);
    form.clearErrors('productId');
  };

  async function onSubmit(data: LotFormData) {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const product = mockProducts.find(p => p.id === data.productId);
    const lotNumber = `${product?.modelName}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001`;

    setSuccess({ lotNumber });
    form.reset();
    setSelectedProductId(null);
    setIsLoading(false);
  }

  return (
    <div className="space-y-4 max-w-4xl">
      {success && (
        <div className="p-4 rounded-md bg-green-50 border border-green-200">
          <p className="text-green-800 font-medium">생산 등록이 완료되었습니다!</p>
          <p className="text-green-700 text-sm mt-1">
            Lot 번호: <span className="font-mono font-semibold">{success.lotNumber}</span>
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* 제품 선택 */}
        <div className="flex-1 lg:max-w-[60%]">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">제품 선택</CardTitle>
              <CardDescription>생산할 제품을 선택하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {mockProducts.map((product) => (
                  <AccordionItem key={product.id} value={product.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'rounded-full p-2 shrink-0 transition-colors',
                            selectedProductId === product.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-gray-100 text-gray-600'
                          )}
                        >
                          {selectedProductId === product.id ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Package className="h-4 w-4" />
                          )}
                        </div>
                        <div className="text-left">
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">{product.modelName}</div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-11 space-y-2 text-sm">
                        <p>UDI-DI: <code>{product.udiDi}</code></p>
                        <Button
                          size="sm"
                          onClick={() => handleProductSelect(product.id)}
                          variant={selectedProductId === product.id ? 'secondary' : 'default'}
                        >
                          {selectedProductId === product.id ? '선택됨' : '이 제품 선택'}
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* 생산 정보 폼 */}
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
                {selectedProduct && (
                  <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full p-1.5 bg-primary text-primary-foreground shrink-0">
                        <Check className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{selectedProduct.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {selectedProduct.modelName}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>수량 *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={10000}
                              placeholder="생산 수량 (1 ~ 10,000)"
                              disabled={isLoading || !selectedProductId}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>최대 10,000개까지 입력 가능합니다.</FormDescription>
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
                            />
                          </FormControl>
                          <FormDescription>기본값: 생산일자 + 24개월</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || !selectedProductId}
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

const meta = {
  title: 'Forms/Manufacturer/LotForm',
  component: MockLotForm,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MockLotForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
