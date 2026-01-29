'use client';

/**
 * 비밀번호 찾기 폼 컴포넌트
 * 사업자등록번호 + 이메일로 비밀번호 재설정 메일 발송
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations';
import { forgotPasswordAction } from '@/app/(auth)/actions';
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

export function ForgotPasswordForm(): React.ReactElement {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      businessNumber: '',
      email: '',
    },
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('businessNumber', data.businessNumber);
      formData.append('email', data.email);

      const result = await forgotPasswordAction(formData);

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error?.message || '비밀번호 재설정에 실패했습니다.');
      }
    } catch {
      setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">이메일 발송 완료</h2>
          <p className="mt-4 text-sm text-gray-600">
            비밀번호 재설정 링크가 이메일로 발송되었습니다.
            <br />
            이메일을 확인하고 링크를 클릭하여 비밀번호를 재설정해주세요.
          </p>
        </div>
        <div className="text-center">
          <Link href="/login" className="text-primary hover:underline font-medium text-sm">
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">비밀번호 찾기</h2>
        <p className="mt-2 text-sm text-gray-600">
          가입 시 등록한 사업자등록번호와 이메일을 입력해주세요.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이메일</FormLabel>
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '발송 중…' : '비밀번호 재설정 메일 발송'}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm space-y-2">
        <div>
          <Link href="/find-account" className="text-primary hover:underline font-medium">
            계정 찾기
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
