import '@testing-library/jest-dom';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { config } from 'dotenv';
import { resolve } from 'path';

// 환경 변수 로드 (.env.local)
config({ path: resolve(process.cwd(), '.env.local') });

// React 컴포넌트 테스트 후 자동 정리
afterEach(() => {
  cleanup();
});

// Supabase 연결 확인 (통합 테스트용)
beforeAll(async () => {
  // 환경 변수 확인
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      '⚠️  Supabase 환경 변수가 설정되지 않았습니다. 통합 테스트가 실패할 수 있습니다.'
    );
    console.warn('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '설정됨' : '없음');
    console.warn('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '설정됨' : '없음');
  }

  if (!supabaseServiceRoleKey) {
    console.warn(
      '⚠️  SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다. 관리자 권한 테스트가 실패할 수 있습니다.'
    );
  }
});

// 전역 정리 (테스트 종료 시)
afterAll(async () => {
  // 필요시 전역 정리 로직 추가
});

// 전역 타임아웃 설정 (통합 테스트는 더 오래 걸릴 수 있음)
// vitest.config.ts에서 설정
