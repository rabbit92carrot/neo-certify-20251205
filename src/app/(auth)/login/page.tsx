import { Suspense } from 'react';
import { LoginForm } from '@/components/forms/LoginForm';

export const metadata = {
  title: '로그인 | 네오인증서',
  description: 'JAMBER 정품 인증 시스템 로그인',
};

/**
 * 로그인 페이지
 */
export default function LoginPage(): React.ReactElement {
  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

/**
 * 로그인 폼 로딩 스켈레톤
 */
function LoginFormSkeleton(): React.ReactElement {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="text-center">
        <div className="h-8 bg-gray-200 rounded w-24 mx-auto" />
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
        <div className="h-10 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
