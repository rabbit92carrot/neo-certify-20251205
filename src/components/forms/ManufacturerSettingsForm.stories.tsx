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
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

/**
 * ManufacturerSettingsForm은 Server Actions에 의존합니다.
 * Storybook에서는 Mock 컴포넌트로 UI를 시뮬레이션합니다.
 */

const settingsSchema = z.object({
  lotPrefix: z.string().min(1, '접두어를 입력해주세요').max(10),
  lotModelDigits: z.number().min(1).max(10),
  lotDateFormat: z.string().min(1, '날짜 형식을 선택해주세요'),
  expiryMonths: z.number().min(6).max(60),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const DATE_FORMAT_OPTIONS: ComboboxOption[] = [
  { value: 'yymmdd', label: 'YYMMDD (예: 241209)' },
  { value: 'yyyymmdd', label: 'YYYYMMDD (예: 20241209)' },
  { value: 'yymm', label: 'YYMM (예: 2412)' },
];

const EXPIRY_MONTH_OPTIONS: ComboboxOption[] = [6, 12, 18, 24, 30, 36, 48, 60].map((months) => ({
  value: String(months),
  label: `${months}개월`,
}));

function MockManufacturerSettingsForm({
  initialSettings = {
    lotPrefix: 'ND',
    lotModelDigits: 5,
    lotDateFormat: 'yymmdd',
    expiryMonths: 24,
  },
}: {
  initialSettings?: SettingsFormData;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialSettings,
  });

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

  async function onSubmit(data: SettingsFormData) {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSuccess(true);
    setIsLoading(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {success && (
        <div className="p-4 rounded-md bg-green-50 border border-green-200">
          <p className="text-green-800">설정이 저장되었습니다.</p>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>
      )}

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
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

const meta = {
  title: 'Forms/Manufacturer/ManufacturerSettingsForm',
  component: MockManufacturerSettingsForm,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MockManufacturerSettingsForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDifferentSettings: Story = {
  args: {
    initialSettings: {
      lotPrefix: 'NM',
      lotModelDigits: 3,
      lotDateFormat: 'yyyymmdd',
      expiryMonths: 36,
    },
  },
};
