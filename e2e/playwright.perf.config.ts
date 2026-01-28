import { defineConfig, devices } from '@playwright/test';

/**
 * UI 성능 측정 전용 Playwright 설정
 * 기존 E2E 테스트와 분리되어 독립적으로 실행 가능
 */
export default defineConfig({
  testDir: './performance/tests',
  testMatch: '**/*.perf.ts', // .perf.ts 파일 매칭
  globalSetup: './performance/global-setup.ts', // 인증 파일 사전 생성
  fullyParallel: false, // 순차 실행 (측정 일관성 보장)
  forbidOnly: !!process.env.CI,
  retries: 0, // 성능 측정은 재시도 없음
  workers: 1, // 단일 워커로 일관된 측정

  reporter: [
    ['list'],
    ['html', { outputFolder: './performance/reports/playwright-report' }],
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    // 측정 오버헤드 최소화
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },

  projects: [
    {
      name: 'performance',
      use: {
        ...devices['Desktop Chrome'],
        // 성능 측정을 위한 브라우저 설정
        launchOptions: {
          args: [
            '--disable-extensions',
            '--disable-background-networking',
            '--disable-sync',
            '--disable-translate',
            '--metrics-recording-only',
            '--no-first-run',
          ],
        },
      },
    },
  ],

  // 개발 서버 자동 시작 (로컬 테스트용)
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120000,
        // E2E 테스트 환경 변수 설정 (rate limit 비활성화)
        env: {
          ...process.env,
          E2E_TEST: 'true',
        },
      },

  // 타임아웃 설정 (성능 측정은 더 긴 시간 허용)
  timeout: 60000,
  expect: {
    timeout: 30000,
  },
});
