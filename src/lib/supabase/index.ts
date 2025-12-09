/**
 * Supabase 클라이언트 모듈
 *
 * 사용 가이드:
 * - 클라이언트 컴포넌트: createClient from './client'
 * - 서버 컴포넌트/Server Actions: createClient from './server'
 * - 미들웨어: updateSession from './middleware'
 * - Admin 작업 (RLS 우회): createAdminClient from './admin'
 */

export { createClient as createBrowserClient } from './client';
export { createClient as createServerClient } from './server';
export { updateSession } from './middleware';
export { createAdminClient } from './admin';
