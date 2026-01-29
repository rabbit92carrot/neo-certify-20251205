/**
 * OAuth 콜백 라우트
 * 이메일 인증 또는 OAuth 인증 후 리다이렉트 처리
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_REDIRECT, LOGIN_PATH } from '@/constants/routes';
import type { OrganizationType } from '@/constants';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  const type = searchParams.get('type');

  // recovery 타입: 비밀번호 재설정 페이지로 리다이렉트
  if (type === 'recovery') {
    if (code) {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL('/reset-password', origin));
      }
    }
    return NextResponse.redirect(new URL(`/login?error=recovery_failed`, origin));
  }

  if (code) {
    const supabase = await createClient();

    // 코드를 세션으로 교환
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 사용자 정보 조회
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

        if (org?.status === 'ACTIVE') {
          // 조직 유형별 대시보드로 리다이렉트
          const redirectPath = DEFAULT_REDIRECT[org.type as OrganizationType];
          return NextResponse.redirect(new URL(redirectPath, origin));
        }

        if (org?.status === 'PENDING_APPROVAL') {
          // 승인 대기 페이지로 리다이렉트
          return NextResponse.redirect(new URL('/pending', origin));
        }
      }

      // 기본 리다이렉트
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        return NextResponse.redirect(new URL(next, origin));
      } else if (forwardedHost) {
        return NextResponse.redirect(new URL(next, `https://${forwardedHost}`));
      } else {
        return NextResponse.redirect(new URL(next, origin));
      }
    }
  }

  // 에러 발생 시 로그인 페이지로
  return NextResponse.redirect(new URL(`${LOGIN_PATH}?error=auth_callback_error`, origin));
}
