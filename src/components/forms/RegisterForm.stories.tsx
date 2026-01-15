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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { Factory, Building2, Hospital } from 'lucide-react';

/**
 * RegisterForm은 Next.js Router와 Server Actions에 의존합니다.
 * Storybook에서는 Mock 컴포넌트로 UI를 시뮬레이션합니다.
 */

const registerSchema = z.object({
  organizationType: z.string().min(1, '조직 유형을 선택해주세요'),
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
  confirmPassword: z.string(),
  name: z.string().min(1, '조직명을 입력해주세요'),
  businessNumber: z.string().min(1, '사업자등록번호를 입력해주세요'),
  representativeName: z.string().min(1, '대표자명을 입력해주세요'),
  representativeContact: z.string().min(1, '대표연락처를 입력해주세요'),
  address: z.string().min(1, '주소를 입력해주세요'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

function MockRegisterForm({ error = null }: { error?: string | null }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(error);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      organizationType: '',
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      businessNumber: '',
      representativeName: '',
      representativeContact: '',
      address: '',
    },
  });

  const organizationTypeOptions: ComboboxOption[] = [
    { value: 'MANUFACTURER', label: '제조사', icon: <Factory className="h-4 w-4" /> },
    { value: 'DISTRIBUTOR', label: '유통사', icon: <Building2 className="h-4 w-4" /> },
    { value: 'HOSPITAL', label: '병원', icon: <Hospital className="h-4 w-4" /> },
  ];

  async function onSubmit(data: RegisterFormData) {
    if (!selectedFile) {
      setFormError('사업자등록증 파일을 업로드해주세요.');
      return;
    }

    setIsLoading(true);
    setFormError(null);

    await new Promise((resolve) => setTimeout(resolve, 1500));
    alert(`회원가입 성공 (Mock): ${data.email}`);

    setIsLoading(false);
  }

  return (
    <div className="space-y-6 w-[400px]">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">회원가입</h2>
        <p className="mt-1 text-sm text-gray-600">조직 정보를 입력하여 가입하세요</p>
      </div>

      {formError && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">{formError}</div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="organizationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>조직 유형 *</FormLabel>
                <FormControl>
                  <Combobox
                    options={organizationTypeOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="조직 유형을 선택하세요"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이메일 *</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="email@example.com"
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>비밀번호 *</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="최소 6자 이상"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormDescription>최소 6자 이상 입력하세요</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>비밀번호 확인 *</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="비밀번호를 다시 입력하세요"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <hr className="my-4" />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>조직명 *</FormLabel>
                <FormControl>
                  <Input placeholder="조직명을 입력하세요" disabled={isLoading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="businessNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>사업자등록번호 *</FormLabel>
                <FormControl>
                  <Input placeholder="000-00-00000" disabled={isLoading} {...field} />
                </FormControl>
                <FormDescription>하이픈(-) 포함 또는 숫자만 입력</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="representativeName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>대표자명 *</FormLabel>
                <FormControl>
                  <Input placeholder="대표자명을 입력하세요" disabled={isLoading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="representativeContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>대표연락처 *</FormLabel>
                <FormControl>
                  <Input placeholder="010-0000-0000" disabled={isLoading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>주소 *</FormLabel>
                <FormControl>
                  <Input placeholder="사업장 주소를 입력하세요" disabled={isLoading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>사업자등록증 *</FormLabel>
            <FormControl>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                disabled={isLoading}
              />
            </FormControl>
            <FormDescription>PDF, JPG, PNG 파일 (최대 10MB)</FormDescription>
            {selectedFile && (
              <p className="text-sm text-green-600">선택된 파일: {selectedFile.name}</p>
            )}
          </FormItem>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '가입 처리 중...' : '회원가입'}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <span className="text-gray-600">이미 계정이 있으신가요? </span>
        <a href="#" className="text-primary hover:underline font-medium">
          로그인
        </a>
      </div>
    </div>
  );
}

const meta = {
  title: 'Forms/Auth/RegisterForm',
  component: MockRegisterForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MockRegisterForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithError: Story = {
  args: {
    error: '이미 등록된 이메일입니다.',
  },
};
