'use client';

/**
 * 제품 등록/수정 폼 컴포넌트
 * Dialog 형태로 제품 정보 입력
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productCreateSchema, type ProductCreateData } from '@/lib/validations/product';
import { createProductAction, updateProductAction } from '@/app/(dashboard)/manufacturer/actions';
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
import { ERROR_MESSAGES } from '@/constants';
import type { Product } from '@/types/api.types';

interface ProductFormProps {
  /** 수정할 제품 (없으면 신규 등록) */
  product?: Product;
  /** Dialog 열림 상태 */
  open: boolean;
  /** Dialog 열림 상태 변경 핸들러 */
  onOpenChange: (open: boolean) => void;
  /** 성공 시 콜백 */
  onSuccess?: () => void;
}

export function ProductForm({
  product,
  open,
  onOpenChange,
  onSuccess,
}: ProductFormProps): React.ReactElement {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!product;

  const form = useForm<ProductCreateData>({
    resolver: zodResolver(productCreateSchema),
    defaultValues: {
      name: '',
      udiDi: '',
      modelName: '',
    },
  });

  // 수정 모드일 때 기존 값 설정
  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        udiDi: product.udi_di,
        modelName: product.model_name,
      });
    } else {
      form.reset({
        name: '',
        udiDi: '',
        modelName: '',
      });
    }
  }, [product, form]);

  async function onSubmit(data: ProductCreateData) {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('udiDi', data.udiDi);
      formData.append('modelName', data.modelName);

      if (product) {
        formData.append('id', product.id);
      }

      const result = isEditing
        ? await updateProductAction(formData)
        : await createProductAction(formData);

      if (result.success) {
        onOpenChange(false);
        form.reset();
        onSuccess?.();
      } else {
        // 필드별 에러 설정
        if (result.error?.details) {
          Object.entries(result.error.details).forEach(([field, messages]) => {
            if (messages.length > 0) {
              form.setError(field as keyof ProductCreateData, {
                message: messages[0],
              });
            }
          });
        }
        setError(result.error?.message || '처리에 실패했습니다.');
      }
    } catch {
      setError(ERROR_MESSAGES.GENERAL.SERVER_ERROR);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? '제품 수정' : '제품 등록'}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>
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
