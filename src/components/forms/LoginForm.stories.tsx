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
} from '@/components/ui/form';

/**
 * LoginForm은 Next.js Router와 Server Actions에 의존합니다.
 * Storybook에서는 Mock 컴포넌트로 UI를 시뮬레이션합니다.
 */

const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function MockLoginForm({
  showRegisteredMessage = false,
  error = null,
}: {
  showRegisteredMessage?: boolean;
  error?: string | null;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(error);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true);
    setFormError(null);

    // 시뮬레이션
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (data.email === 'error@example.com') {
      setFormError('로그인에 실패했습니다. 이메일 또는 비밀번호를 확인해주세요.');
    } else {
      alert(`로그인 성공 (Mock): ${data.email}`);
    }

    setIsLoading(false);
  }

  return (
    <div className="space-y-6 w-[350px]">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">로그인</h2>
        {showRegisteredMessage && (
          <p className="mt-2 text-sm text-green-600">
            회원가입이 완료되었습니다. 로그인해주세요.
          </p>
        )}
      </div>

      {formError && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">{formError}</div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    autoComplete="email"
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
                <FormLabel>비밀번호</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    autoComplete="current-password"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <span className="text-gray-600">계정이 없으신가요? </span>
        <a href="#" className="text-primary hover:underline font-medium">
          회원가입
        </a>
      </div>
    </div>
  );
}

const meta = {
  title: 'Forms/Auth/LoginForm',
  component: MockLoginForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MockLoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithRegisteredMessage: Story = {
  args: {
    showRegisteredMessage: true,
  },
};

export const WithError: Story = {
  args: {
    error: '로그인에 실패했습니다. 이메일 또는 비밀번호를 확인해주세요.',
  },
};

export const FilledForm: Story = {
  render: () => {
    const form = useForm<LoginFormData>({
      resolver: zodResolver(loginSchema),
      defaultValues: {
        email: 'user@example.com',
        password: 'password123',
      },
    });

    return (
      <div className="space-y-6 w-[350px]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">로그인</h2>
        </div>

        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이메일</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
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
                  <FormLabel>비밀번호</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">로그인</Button>
          </form>
        </Form>
      </div>
    );
  },
};
