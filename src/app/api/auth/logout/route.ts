import { revalidatePath } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';
import { LOGIN_PATH } from '@/constants/routes';

/**
 * POST /api/auth/logout
 * 로그아웃 API Route Handler
 *
 * 공식 Supabase 문서 패턴:
 * https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs
 *
 * HTML form의 action으로 직접 호출 가능 (JavaScript hydration 불필요)
 */
export async function POST(request: NextRequest) {
  // 프록시/로드밸런서 환경에서 올바른 origin 결정
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    request.headers.get('x-forwarded-host')
      ? `https://${request.headers.get('x-forwarded-host')}`
      : request.url;

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
