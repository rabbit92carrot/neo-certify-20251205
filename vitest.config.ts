import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// 테스트 실행 전에 .env.local 환경 변수를 먼저 로드
// override: true - 이미 설정된 환경 변수도 덮어씀
import { config } from 'dotenv';
config({ path: '.env.local', override: true });

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    exclude: ['node_modules', '.next', 'out', 'build'],
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
    },
    clearMocks: true,
    restoreMocks: true,
    // Unit: 병렬, Integration: 병렬 (데이터 격리 완료) + maxWorkers 제한 (Cloud DB 부하 방지)
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: [
            'tests/unit/**/*.test.ts',
            'tests/unit/**/*.test.tsx',
            'src/**/*.test.ts',
            'src/**/*.test.tsx',
          ],
          sequence: { groupOrder: 1 },
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: [
            'tests/integration/**/*.test.ts',
            'tests/integration/**/*.test.tsx',
          ],
          fileParallelism: true,
          maxWorkers: 4,
          sequence: { groupOrder: 2 },
        },
      },
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
