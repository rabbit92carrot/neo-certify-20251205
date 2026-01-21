import { revalidatePath } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';
import { LOGIN_PATH } from '@/constants/routes';

/**
 * CSRF 보호를 위한 Origin 헤더 검증
 *
 * @param request NextRequest 객체
 * @returns 요청이 유효한 origin에서 왔는지 여부
 */
function isValidOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // 허용된 origins 목록
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ].filter(Boolean) as string[];

  // Origin 헤더 검증
  if (origin) {
    return allowedOrigins.some((allowed) => origin.startsWith(allowed));
  }

  // Referer 헤더 검증 (일부 브라우저/환경에서 Origin이 없을 수 있음)
  if (referer) {
    return allowedOrigins.some((allowed) => referer.startsWith(allowed));
  }

  // Origin과 Referer 모두 없는 경우 거부
  return false;
}

/**
 * POST /api/auth/logout
 * 로그아웃 API Route Handler
 *
 * 공식 Supabase 문서 패턴:
 * https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs
 *
 * HTML form의 action으로 직접 호출 가능 (JavaScript hydration 불필요)
 *
 * 보안: Origin/Referer 헤더를 검증하여 CSRF 공격 방지
 */
export async function POST(request: NextRequest) {
  // CSRF 보호: Origin 검증
  if (!isValidOrigin(request)) {
    return NextResponse.json(
      { error: 'Invalid request origin' },
      { status: 403 }
    );
  }
  // 프록시/로드밸런서 환경에서 올바른 origin 결정
  const forwardedHost = request.headers.get('x-forwarded-host');
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (forwardedHost ? `https://${forwardedHost}` : new URL(request.url).origin);

  const response = NextResponse.redirect(new URL(LOGIN_PATH, origin), {
    status: 302,
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
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 현재 사용자 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.auth.signOut();
  }

  // 캐시 무효화
  revalidatePath('/', 'layout');

  return response;
}
