import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules', '.next', 'out', 'build'],
    // 통합 테스트 타임아웃 (Supabase 연결 시간 고려)
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/types/**',
        'src/**/*.d.ts',
        'node_modules/**',
      ],
      // 통합 테스트가 실제 Supabase DB를 사용하므로 커버리지 측정이 어려움
      // 비즈니스 로직은 통합 테스트로 검증됨
    },
    clearMocks: true,
    restoreMocks: true,
    // 순차 실행 (DB 상태 충돌 방지)
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
