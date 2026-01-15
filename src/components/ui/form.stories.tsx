'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './form';
import { Input } from './input';
import { Button } from './button';
import { Textarea } from './textarea';
import { Checkbox } from './checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { Toaster } from './sonner';
import { toast } from 'sonner';

const meta = {
  title: 'UI/Forms/Form',
  component: Form,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
        <Toaster />
      </div>
    ),
  ],
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 폼 스키마
const basicSchema = z.object({
  username: z.string().min(2, '2글자 이상 입력해주세요'),
  email: z.string().email('유효한 이메일을 입력해주세요'),
});

export const Basic: Story = {
  render: () => {
    const form = useForm<z.infer<typeof basicSchema>>({
      resolver: zodResolver(basicSchema),
      defaultValues: {
        username: '',
        email: '',
      },
    });

    function onSubmit(values: z.infer<typeof basicSchema>) {
      toast.success('폼이 제출되었습니다.', {
        description: JSON.stringify(values),
      });
    }

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>사용자명</FormLabel>
                <FormControl>
                  <Input placeholder="사용자명" {...field} />
                </FormControl>
                <FormDescription>
                  공개적으로 표시되는 이름입니다.
                </FormDescription>
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
                  <Input type="email" placeholder="email@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">제출</Button>
        </form>
      </Form>
    );
  },
};

// 제품 등록 스키마
const productSchema = z.object({
  name: z.string().min(1, '제품명을 입력해주세요'),
  modelName: z.string().min(1, '모델명을 입력해주세요'),
  udiDi: z.string().min(1, 'UDI-DI를 입력해주세요'),
});

export const ProductForm: Story = {
  render: () => {
    const form = useForm<z.infer<typeof productSchema>>({
      resolver: zodResolver(productSchema),
      defaultValues: {
        name: '',
        modelName: '',
        udiDi: '',
      },
    });

    function onSubmit(values: z.infer<typeof productSchema>) {
      toast.success('제품이 등록되었습니다.');
      console.log(values);
    }

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>제품명</FormLabel>
                <FormControl>
                  <Input placeholder="PDO Thread Type A" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="modelName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>모델명</FormLabel>
                <FormControl>
                  <Input placeholder="PDO-A-100" {...field} />
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
                <FormLabel>UDI-DI</FormLabel>
                <FormControl>
                  <Input placeholder="1234567890123" {...field} />
                </FormControl>
                <FormDescription>
                  의료기기 고유식별자를 입력하세요.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline">
              취소
            </Button>
            <Button type="submit">등록</Button>
          </div>
        </form>
      </Form>
    );
  },
};

// Select와 Checkbox 포함 스키마
const complexSchema = z.object({
  organizationType: z.string().min(1, '조직 유형을 선택해주세요'),
  memo: z.string().optional(),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: '약관에 동의해야 합니다.',
  }),
});

export const WithSelectAndCheckbox: Story = {
  render: () => {
    const form = useForm<z.infer<typeof complexSchema>>({
      resolver: zodResolver(complexSchema),
      defaultValues: {
        organizationType: '',
        memo: '',
        agreeTerms: false,
      },
    });

    function onSubmit(values: z.infer<typeof complexSchema>) {
      toast.success('등록되었습니다.');
      console.log(values);
    }

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="organizationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>조직 유형</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="유형 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="manufacturer">제조사</SelectItem>
                    <SelectItem value="distributor">유통사</SelectItem>
                    <SelectItem value="hospital">병원</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="memo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>메모 (선택)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="추가 메모를 입력하세요"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="agreeTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>이용약관에 동의합니다</FormLabel>
                  <FormDescription>
                    서비스 이용을 위해 약관에 동의해야 합니다.
                  </FormDescription>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">등록</Button>
        </form>
      </Form>
    );
  },
};

export const WithValidationErrors: Story = {
  render: () => {
    const form = useForm<z.infer<typeof basicSchema>>({
      resolver: zodResolver(basicSchema),
      defaultValues: {
        username: 'a', // 2글자 미만 - 에러 발생
        email: 'invalid', // 유효하지 않은 이메일
      },
    });

    // 초기 에러 표시를 위해 즉시 검증
    form.trigger();

    return (
      <Form {...form}>
        <form className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>사용자명</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">제출</Button>
        </form>
      </Form>
    );
  },
};
