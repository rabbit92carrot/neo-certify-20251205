'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

/**
 * ProductForm은 Server Actions에 의존합니다.
 * Storybook에서는 Mock 컴포넌트로 UI를 시뮬레이션합니다.
 */

const productSchema = z.object({
  name: z.string().min(1, '제품명을 입력해주세요'),
  udiDi: z.string().min(1, 'UDI-DI를 입력해주세요'),
  modelName: z.string().min(1, '모델명을 입력해주세요'),
});

type ProductFormData = z.infer<typeof productSchema>;

interface MockProduct {
  id: string;
  name: string;
  udi_di: string;
  model_name: string;
}

function MockProductForm({
  product,
  open,
  onOpenChange,
  error = null,
}: {
  product?: MockProduct;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error?: string | null;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(error);
  const isEditing = !!product;

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? '',
      udiDi: product?.udi_di ?? '',
      modelName: product?.model_name ?? '',
    },
  });

  async function onSubmit(data: ProductFormData) {
    setIsLoading(true);
    setFormError(null);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert(`${isEditing ? '수정' : '등록'} 성공 (Mock): ${data.name}`);

    setIsLoading(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? '제품 수정' : '제품 등록'}</DialogTitle>
        </DialogHeader>

        {formError && (
          <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">{formError}</div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>제품명 *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="제품명을 입력하세요"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="udiDi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UDI-DI *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="의료기기 고유식별코드"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>의료기기 고유식별코드 (제품 종류별 고유 값)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="modelName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>모델명 *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="모델명을 입력하세요"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Lot 번호 생성에 사용됩니다</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                취소
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '처리 중...' : isEditing ? '수정' : '등록'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const meta = {
  title: 'Forms/Manufacturer/ProductForm',
  component: MockProductForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MockProductForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>제품 등록</Button>
        <MockProductForm open={open} onOpenChange={setOpen} />
      </>
    );
  },
};

export const Edit: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const existingProduct: MockProduct = {
      id: 'prod-001',
      name: 'PDO Thread Type A',
      udi_di: '1234567890123',
      model_name: 'PDO-A-100',
    };
    return (
      <>
        <Button onClick={() => setOpen(true)}>제품 수정</Button>
        <MockProductForm product={existingProduct} open={open} onOpenChange={setOpen} />
      </>
    );
  },
};

export const WithError: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>제품 등록 (에러)</Button>
        <MockProductForm
          open={open}
          onOpenChange={setOpen}
          error="이미 등록된 UDI-DI입니다."
        />
      </>
    );
  },
};

export const OpenByDefault: Story = {
  render: () => (
    <MockProductForm open={true} onOpenChange={() => {}} />
  ),
};
