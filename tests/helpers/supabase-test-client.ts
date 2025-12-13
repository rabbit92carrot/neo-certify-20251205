/**
 * 테스트용 Supabase 클라이언트
 * 환경 변수에서 Supabase 인스턴스에 연결합니다.
 * (.env.local의 Cloud 또는 로컬 Supabase)
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

/**
 * 환경 변수를 지연 평가로 가져옵니다.
 * 모듈 로드 시점이 아닌 함수 호출 시점에 환경 변수를 읽습니다.
 */
function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:55001';
}

function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
}

function getSupabaseServiceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

/**
 * 테스트용 일반 클라이언트 (anon key)
 * RLS 정책이 적용됩니다.
 */
export function createTestClient(): SupabaseClient<Database> {
  return createClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * 테스트용 관리자 클라이언트 (service role key)
 * RLS를 우회하여 모든 데이터에 접근할 수 있습니다.
 * 테스트 데이터 생성/정리에 사용합니다.
 */
export function createTestAdminClient(): SupabaseClient<Database> {
  return createClient<Database>(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * 인증된 테스트 클라이언트 생성
 * 특정 사용자로 로그인된 클라이언트를 반환합니다.
 */
export async function createAuthenticatedTestClient(
  email: string,
  password: string
): Promise<SupabaseClient<Database>> {
  const client = createTestClient();

  const { error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(`테스트 로그인 실패: ${error.message}`);
  }

  return client;
}

/**
 * Supabase 연결 상태 확인
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const client = createTestAdminClient();
    const { error } = await client.from('organizations').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

/**
 * 테스트 환경 정보를 반환합니다.
 * 환경 변수가 로드된 후 호출해야 합니다.
 */
export function getTestEnv() {
  return {
    supabaseUrl: getSupabaseUrl(),
    hasAnonKey: !!getSupabaseAnonKey(),
    hasServiceRoleKey: !!getSupabaseServiceRoleKey(),
  };
}
