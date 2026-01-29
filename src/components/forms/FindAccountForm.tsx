'use client';

/**
 * 계정 찾기 폼 컴포넌트
 * 사업자등록번호 + 대표연락처로 가입 이메일 조회
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

import { findAccountSchema, type FindAccountFormData } from '@/lib/validations';
import { findAccountAction } from '@/app/(auth)/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

export function FindAccountForm(): React.ReactElement {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);

  const form = useForm<FindAccountFormData>({
    resolver: zodResolver(findAccountSchema),
    defaultValues: {
      businessNumber: '',
      representativeContact: '',
    },
  });

  async function onSubmit(data: FindAccountFormData) {
    setIsLoading(true);
    setError(null);
    setMaskedEmail(null);

    try {
      const formData = new FormData();
      formData.append('businessNumber', data.businessNumber);
      formData.append('representativeContact', data.representativeContact);

      const result = await findAccountAction(formData);

      if (result.success && result.data) {
        setMaskedEmail(result.data.maskedEmail);
      } else {
        setError(result.error?.message || '계정을 찾을 수 없습니다.');
      }
    } catch {
      setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">계정 찾기</h2>
        <p className="mt-2 text-sm text-gray-600">
          가입 시 등록한 사업자등록번호와 대표연락처를 입력해주세요.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {maskedEmail && (
        <div className="p-4 rounded-md bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-800 font-medium">가입된 이메일</p>
          <p className="mt-1 text-lg font-semibold text-blue-900">{maskedEmail}</p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="businessNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>사업자등록번호</FormLabel>
                <FormControl>
                  <Input
                    placeholder="000-00-00000"
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
            name="representativeContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>대표연락처</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="010-0000-0000"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '조회 중…' : '계정 찾기'}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm space-y-2">
        <div>
          <Link href="/forgot-password" className="text-primary hover:underline font-medium">
            비밀번호 찾기
          </Link>
        </div>
        <div>
          <Link href="/login" className="text-gray-600 hover:underline">
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
