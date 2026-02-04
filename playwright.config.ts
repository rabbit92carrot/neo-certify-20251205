import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 테스트 설정
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // 순차 실행 (DB 상태 보존)
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'html',

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 개발 서버 자동 시작 (로컬 테스트용)
  // d3k 모니터링이 필요한 경우 별도 터미널에서 `d3k --servers-only --no-tui --script dev` 실행 후
  // reuseExistingServer로 기존 서버를 재사용합니다.
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120000,
        env: {
          ...process.env,
          E2E_TEST: 'true',
        },
      },

  // 테스트 타임아웃
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
});
