import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_REDIRECT, PENDING_PATH } from '@/constants/routes';
import type { OrganizationType } from '@/constants';

/**
 * 인증 페이지 레이아웃
 * 로그인/회원가입 페이지의 공통 레이아웃
 */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  // 이미 로그인된 사용자 체크
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // 조직 정보 조회
    const { data: org } = await supabase
      .from('organizations')
      .select('type, status')
      .eq('auth_user_id', user.id)
      .single();

    if (org) {
      if (org.status === 'ACTIVE') {
        // 활성 상태면 대시보드로 리다이렉트
        const redirectPath = DEFAULT_REDIRECT[org.type as OrganizationType];
        redirect(redirectPath);
      } else if (org.status === 'PENDING_APPROVAL') {
        // 승인 대기 상태면 대기 페이지로
        redirect(PENDING_PATH);
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">네오인증서</h1>
          <p className="mt-2 text-sm text-gray-600">JAMBER 정품 인증 시스템</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">{children}</div>
      </div>
    </div>
  );
}
