'use client';

/**
 * 회원가입 폼 컴포넌트
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

import {
  organizationRegisterSchema,
  type OrganizationRegisterData,
} from '@/lib/validations';
import { registerAction } from '@/app/(auth)/actions';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ORGANIZATION_TYPES,
  ORGANIZATION_TYPE_LABELS,
  CONFIG,
  ERROR_MESSAGES,
} from '@/constants';

export function RegisterForm(): React.ReactElement {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const router = useRouter();

  const form = useForm<OrganizationRegisterData>({
    resolver: zodResolver(organizationRegisterSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      organizationType: undefined,
      name: '',
      businessNumber: '',
      representativeName: '',
      representativeContact: '',
      address: '',
    },
  });

  // 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    // 파일 크기 검증
    if (file.size > CONFIG.FILE_UPLOAD.MAX_SIZE_BYTES) {
      setError(ERROR_MESSAGES.FILE.SIZE_EXCEEDED);
      e.target.value = '';
      return;
    }

    // 파일 타입 검증
    if (!(CONFIG.FILE_UPLOAD.ALLOWED_TYPES as readonly string[]).includes(file.type)) {
      setError(ERROR_MESSAGES.FILE.INVALID_TYPE);
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  async function onSubmit(data: OrganizationRegisterData) {
    // 파일 검증
    if (!selectedFile) {
      setError('사업자등록증 파일을 업로드해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('confirmPassword', data.confirmPassword);
      formData.append('organizationType', data.organizationType);
      formData.append('name', data.name);
      formData.append('businessNumber', data.businessNumber);
      formData.append('representativeName', data.representativeName);
      formData.append('representativeContact', data.representativeContact);
      formData.append('address', data.address);
      formData.append('businessLicenseFile', selectedFile);

      const result = await registerAction(formData);

      if (result.success && result.data) {
        router.push(result.data.redirect);
      } else {
        // 필드별 에러 설정
        if (result.error?.details) {
          Object.entries(result.error.details).forEach(([field, messages]) => {
            if (messages.length > 0) {
              form.setError(field as keyof OrganizationRegisterData, {
                message: messages[0],
              });
            }
          });
        }
        setError(result.error?.message || '회원가입에 실패했습니다.');
      }
    } catch {
      setError(ERROR_MESSAGES.GENERAL.SERVER_ERROR);
    } finally {
      setIsLoading(false);
    }
  }

  // 조직 유형 옵션 (ADMIN 제외)
  const organizationTypeOptions = [
    { value: ORGANIZATION_TYPES.MANUFACTURER, label: ORGANIZATION_TYPE_LABELS.MANUFACTURER },
    { value: ORGANIZATION_TYPES.DISTRIBUTOR, label: ORGANIZATION_TYPE_LABELS.DISTRIBUTOR },
    { value: ORGANIZATION_TYPES.HOSPITAL, label: ORGANIZATION_TYPE_LABELS.HOSPITAL },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">회원가입</h2>
        <p className="mt-1 text-sm text-gray-600">조직 정보를 입력하여 가입하세요</p>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* 조직 유형 선택 */}
          <FormField
            control={form.control}
            name="organizationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>조직 유형 *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="조직 유형을 선택하세요" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {organizationTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 이메일 */}
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
                    autoComplete="email"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 비밀번호 */}
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
                    autoComplete="new-password"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormDescription>최소 6자 이상 입력하세요</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 비밀번호 확인 */}
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
                    autoComplete="new-password"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <hr className="my-4" />

          {/* 조직명 */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>조직명 *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="조직명을 입력하세요"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 사업자등록번호 */}
          <FormField
            control={form.control}
            name="businessNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>사업자등록번호 *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="000-00-00000"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormDescription>하이픈(-) 포함 또는 숫자만 입력</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 대표자명 */}
          <FormField
            control={form.control}
            name="representativeName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>대표자명 *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="대표자명을 입력하세요"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 대표연락처 */}
          <FormField
            control={form.control}
            name="representativeContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>대표연락처 *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="010-0000-0000"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 주소 */}
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>주소 *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="사업장 주소를 입력하세요"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 사업자등록증 파일 업로드 */}
          <FormItem>
            <FormLabel>사업자등록증 *</FormLabel>
            <FormControl>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
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
        <Link href="/login" className="text-primary hover:underline font-medium">
          로그인
        </Link>
      </div>
    </div>
  );
}
