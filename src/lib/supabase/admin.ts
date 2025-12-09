import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

/**
 * Service Role 키를 사용하는 Admin 클라이언트
 * RLS를 우회해야 하는 서버 사이드 작업에서만 사용
 * 주의: 절대 클라이언트에 노출하지 말 것
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
