import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';
import {
  AUTH_ROUTES,
  PROTECTED_ROUTES,
  DEFAULT_REDIRECT,
  LOGIN_PATH,
  PENDING_PATH,
  ORGANIZATION_TYPES,
} from '@/constants';

/**
 * 미들웨어: 세션 갱신 및 권한 체크
 *
 * 1. 세션 갱신 (모든 요청)
 * 2. 공개 라우트는 통과 (/mock/*)
 * 3. 인증 라우트 처리 (로그인된 사용자는 대시보드로)
 * 4. 보호된 라우트 처리 (미인증 시 로그인으로, 권한 체크)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Supabase 클라이언트 생성 및 세션 갱신
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 세션 갱신을 위해 getUser() 호출 (getSession() 대신)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Mock 라우트는 항상 통과
  if (pathname.startsWith('/mock')) {
    return supabaseResponse;
  }

  // 2. 인증 라우트 처리 (로그인/회원가입)
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isAuthRoute) {
    if (user) {
      // 이미 로그인된 사용자는 조직 정보 조회 후 대시보드로 리다이렉트
      const { data: org } = await supabase
        .from('organizations')
        .select('type, status')
        .eq('auth_user_id', user.id)
        .single();

      if (org) {
        if (org.status === 'ACTIVE') {
          const redirectPath = DEFAULT_REDIRECT[org.type as keyof typeof DEFAULT_REDIRECT];
          return NextResponse.redirect(new URL(redirectPath, request.url));
        } else if (org.status === 'PENDING_APPROVAL') {
          return NextResponse.redirect(new URL(PENDING_PATH, request.url));
        }
      }
    }
    return supabaseResponse;
  }

  // 3. 보호된 라우트 처리
  const isProtectedRoute = Object.values(PROTECTED_ROUTES).some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // 미인증 사용자는 로그인 페이지로
    if (!user) {
      const loginUrl = new URL(LOGIN_PATH, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 조직 정보 조회
    const { data: org } = await supabase
      .from('organizations')
      .select('type, status')
      .eq('auth_user_id', user.id)
      .single();

    // 조직 정보가 없는 경우
    if (!org) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    }

    // 비활성 상태 체크
    if (org.status !== 'ACTIVE') {
      if (org.status === 'PENDING_APPROVAL') {
        return NextResponse.redirect(new URL(PENDING_PATH, request.url));
      }
      // INACTIVE, DELETED 상태는 로그인 페이지로
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    }

    // 권한 체크: 조직 유형과 라우트 매칭
    const allowedRoute = PROTECTED_ROUTES[org.type as keyof typeof PROTECTED_ROUTES];

    // ADMIN은 모든 라우트 접근 가능
    if (org.type !== ORGANIZATION_TYPES.ADMIN && !pathname.startsWith(allowedRoute)) {
      // 자신의 대시보드로 리다이렉트
      return NextResponse.redirect(new URL(allowedRoute, request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * 다음 경로 제외:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico
     * - 이미지 파일
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
