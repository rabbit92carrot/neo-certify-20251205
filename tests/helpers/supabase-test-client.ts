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
 * RPC 호출을 timeout 재시도와 함께 실행합니다.
 * DB 부하 시 statement_timeout(8s)에 걸리는 경우 1회 재시도합니다.
 */
export async function rpcWithRetry<T>(
  client: SupabaseClient<Database>,
  fnName: string,
  params: Record<string, unknown>,
  maxRetries = 2
): Promise<{ data: T | null; error: { code: string; message: string } | null }> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const { data, error } = await client.rpc(fnName as never, params as never);
    if (!error || error.code !== '57014' || attempt === maxRetries) {
      return { data: data as T | null, error };
    }
    // timeout 시 점진적 대기 후 재시도 (2s, 4s, 6s...)
    await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
  }
  // unreachable
  return { data: null, error: { code: 'RETRY_EXHAUSTED', message: 'Max retries exceeded' } };
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
