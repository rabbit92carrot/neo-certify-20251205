/* eslint-disable react-hooks/rules-of-hooks */
// Note: ESLint가 Playwright의 use()를 React Hook으로 잘못 인식함
import { test as base, Page } from '@playwright/test';
import path from 'path';

/**
 * 테스트 계정 정보
 */
export const TEST_ACCOUNTS = {
  admin: {
    email: 'admin@neocert.com',
    password: 'admin123',
    dashboardUrl: '/admin/dashboard',
  },
  manufacturer: {
    email: 'manufacturer@neocert.com',
    password: 'test123',
    dashboardUrl: '/manufacturer/dashboard',
  },
  distributor: {
    email: 'distributor@neocert.com',
    password: 'test123',
    dashboardUrl: '/distributor/dashboard',
  },
  hospital: {
    email: 'hospital@neocert.com',
    password: 'test123',
    dashboardUrl: '/hospital/dashboard',
  },
} as const;

export type UserRole = keyof typeof TEST_ACCOUNTS;

/**
 * Next.js 개발 오버레이를 숨기는 함수
 * 개발 모드에서 nextjs-portal이 클릭 이벤트를 가로채는 문제 해결
 * @see https://github.com/vercel/next.js/discussions/23970
 */
export async function hideNextJsDevOverlay(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      nextjs-portal {
        display: none !important;
      }
    `,
  });
}

/**
 * 인증 상태 파일 경로
 */
const authFile = (role: string) => path.join(__dirname, `../.auth/${role}.json`);

/**
 * 로그인 수행
 */
export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');

  // 이메일 입력
  await page.locator('input[type="email"]').fill(email);

  // 비밀번호 입력
  await page.locator('input[type="password"]').fill(password);

  // 로그인 버튼 클릭
  await page.locator('button[type="submit"]').click();

  // 대시보드로 리다이렉트 대기 (성능 테스트 시 연속 로그인으로 인한 지연 대응)
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
}

/**
 * 로그인 후 인증 상태 저장
 */
export async function loginAndSaveState(
  page: Page,
  role: UserRole
): Promise<void> {
  const account = TEST_ACCOUNTS[role];
  await login(page, account.email, account.password);

  // 인증 상태 저장
  await page.context().storageState({ path: authFile(role) });
}

/**
 * 로그아웃 수행
 */
export async function logout(page: Page): Promise<void> {
  // 로그아웃 버튼 클릭 (드롭다운 메뉴 또는 직접 버튼)
  const logoutButton = page.getByRole('button', { name: /로그아웃/i });

  if (await logoutButton.isVisible()) {
    await logoutButton.click();
  } else {
    // 드롭다운 메뉴에서 로그아웃
    const userMenu = page.locator('[data-testid="user-menu"]');
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await page.getByText('로그아웃').click();
    }
  }

  // 로그인 페이지로 리다이렉트 대기
  await page.waitForURL(/\/login/, { timeout: 10000 });
}

/**
 * 역할별 로그인된 페이지를 제공하는 fixture
 */
export const test = base.extend<{
  adminPage: Page;
  manufacturerPage: Page;
  distributorPage: Page;
  hospitalPage: Page;
}>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, TEST_ACCOUNTS.admin.email, TEST_ACCOUNTS.admin.password);
    await use(page);
    await context.close();
  },

  manufacturerPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, TEST_ACCOUNTS.manufacturer.email, TEST_ACCOUNTS.manufacturer.password);
    await use(page);
    await context.close();
  },

  distributorPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, TEST_ACCOUNTS.distributor.email, TEST_ACCOUNTS.distributor.password);
    await use(page);
    await context.close();
  },

  hospitalPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, TEST_ACCOUNTS.hospital.email, TEST_ACCOUNTS.hospital.password);
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
