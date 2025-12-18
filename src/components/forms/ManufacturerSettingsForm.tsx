'use client';

/**
 * 제조사 설정 폼 컴포넌트
 * Lot 번호 생성 규칙 및 사용기한 설정
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import {
  manufacturerSettingsSchema,
  type ManufacturerSettingsData,
} from '@/lib/validations/organization';
import { updateManufacturerSettingsAction } from '@/app/(dashboard)/manufacturer/actions';
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
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CONFIG, ERROR_MESSAGES } from '@/constants';
import type { ManufacturerSettings } from '@/types/api.types';

interface ManufacturerSettingsFormProps {
  /** 현재 설정 값 */
  settings: ManufacturerSettings;
}

// 날짜 형식 옵션
const DATE_FORMAT_OPTIONS: ComboboxOption[] = [
  { value: 'yymmdd', label: 'YYMMDD (예: 241209)' },
  { value: 'yyyymmdd', label: 'YYYYMMDD (예: 20241209)' },
  { value: 'yymm', label: 'YYMM (예: 2412)' },
];

// 사용기한 옵션
const EXPIRY_MONTH_OPTIONS: ComboboxOption[] = CONFIG.EXPIRY_MONTH_OPTIONS.map((months) => ({
  value: String(months),
  label: `${months}개월`,
}));

export function ManufacturerSettingsForm({
  settings,
}: ManufacturerSettingsFormProps): React.ReactElement {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ManufacturerSettingsData>({
    resolver: zodResolver(manufacturerSettingsSchema),
    defaultValues: {
      lotPrefix: settings.lot_prefix,
      lotModelDigits: settings.lot_model_digits,
      lotDateFormat: settings.lot_date_format,
      expiryMonths: settings.expiry_months,
    },
  });

  // Lot 번호 미리보기 생성
  const watchedValues = form.watch();
  const getLotPreview = () => {
    const prefix = watchedValues.lotPrefix || 'ND';
    const modelPart = 'X'.repeat(watchedValues.lotModelDigits || 5);
    let datePart = '';

    switch (watchedValues.lotDateFormat) {
      case 'yymmdd':
        datePart = '241209';
        break;
      case 'yyyymmdd':
        datePart = '20241209';
        break;
      case 'yymm':
        datePart = '2412';
        break;
      default:
        datePart = '241209';
    }

    return `${prefix}${modelPart}${datePart}`;
  };

  async function onSubmit(data: ManufacturerSettingsData) {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('lotPrefix', data.lotPrefix);
      formData.append('lotModelDigits', String(data.lotModelDigits));
      formData.append('lotDateFormat', data.lotDateFormat);
      formData.append('expiryMonths', String(data.expiryMonths));

      const result = await updateManufacturerSettingsAction(formData);

      if (result.success) {
        setSuccess(true);
        router.refresh();
      } else {
        // 필드별 에러 설정
        if (result.error?.details) {
          Object.entries(result.error.details).forEach(([field, messages]) => {
            if (messages.length > 0) {
              form.setError(field as keyof ManufacturerSettingsData, {
                message: messages[0],
              });
            }
          });
        }
        setError(result.error?.message || '설정 저장에 실패했습니다.');
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
          <p className="text-green-800">설정이 저장되었습니다.</p>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {/* Lot 번호 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>Lot 번호 설정</CardTitle>
          <CardDescription>
            생산 등록 시 자동 생성되는 Lot 번호 형식을 설정합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="lotPrefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>접두어 *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ND"
                        maxLength={10}
                        disabled={isLoading}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormDescription>
                      Lot 번호 맨 앞에 붙는 문자열 (대문자 알파벳만, 최대 10자)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lotModelDigits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>모델 코드 자릿수 *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        disabled={isLoading}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                      />
                    </FormControl>
                    <FormDescription>모델명에서 추출할 문자 수 (1~10)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lotDateFormat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>날짜 형식 *</FormLabel>
                    <FormControl>
                      <Combobox
                        options={DATE_FORMAT_OPTIONS}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="날짜 형식 선택"
                        searchPlaceholder="형식 검색..."
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Lot 번호 미리보기 */}
              <div className="p-4 bg-gray-50 rounded-lg border">
                <p className="text-sm text-gray-500 mb-1">Lot 번호 미리보기</p>
                <p className="text-lg font-mono font-semibold text-gray-900">
                  {getLotPreview()}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  실제 Lot 번호는 모델명과 생산일자에 따라 생성됩니다.
                </p>
              </div>

              <hr />

              <FormField
                control={form.control}
                name="expiryMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>기본 사용기한 *</FormLabel>
                    <FormControl>
                      <Combobox
                        options={EXPIRY_MONTH_OPTIONS}
                        value={String(field.value)}
                        onValueChange={(val) => field.onChange(parseInt(val, 10))}
                        placeholder="사용기한 선택"
                        searchPlaceholder="개월 검색..."
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      생산일자 + N개월로 자동 계산됩니다
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading}>
                {isLoading ? '저장 중...' : '설정 저장'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
