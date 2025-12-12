import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, hideNextJsDevOverlay } from './fixtures/auth';

test.describe('인증 흐름', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('로그인 페이지가 올바르게 렌더링된다', async ({ page }) => {
    // 제목 확인 - 첫 번째 요소만 찾기
    await expect(page.locator('h2:has-text("로그인")').first()).toBeVisible();

    // 이메일 입력 필드 확인
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // 비밀번호 입력 필드 확인
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // 로그인 버튼 확인
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // 회원가입 링크 확인
    await expect(page.locator('a[href="/register"]')).toBeVisible();
  });

  test('제조사 계정으로 로그인하면 제조사 대시보드로 이동한다', async ({ page }) => {
    const account = TEST_ACCOUNTS.manufacturer;

    await page.locator('input[type="email"]').fill(account.email);
    await page.locator('input[type="password"]').fill(account.password);
    await page.locator('button[type="submit"]').click();

    // 대시보드로 리다이렉트 확인
    await expect(page).toHaveURL(/\/manufacturer\/dashboard/);

    // 환영 메시지 확인
    await expect(page.locator('text=환영합니다')).toBeVisible();
  });

  test('유통사 계정으로 로그인하면 유통사 대시보드로 이동한다', async ({ page }) => {
    const account = TEST_ACCOUNTS.distributor;

    await page.locator('input[type="email"]').fill(account.email);
    await page.locator('input[type="password"]').fill(account.password);
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/distributor\/dashboard/);
    await expect(page.locator('text=환영합니다')).toBeVisible();
  });

  test('병원 계정으로 로그인하면 병원 대시보드로 이동한다', async ({ page }) => {
    const account = TEST_ACCOUNTS.hospital;

    await page.locator('input[type="email"]').fill(account.email);
    await page.locator('input[type="password"]').fill(account.password);
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/hospital\/dashboard/);
    await expect(page.locator('text=환영합니다')).toBeVisible();
  });

  test('관리자 계정으로 로그인하면 관리자 대시보드로 이동한다', async ({ page }) => {
    const account = TEST_ACCOUNTS.admin;

    await page.locator('input[type="email"]').fill(account.email);
    await page.locator('input[type="password"]').fill(account.password);
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(page.locator('text=환영합니다')).toBeVisible();
  });

  test('잘못된 자격증명으로 로그인하면 에러 메시지가 표시된다', async ({ page }) => {
    await page.locator('input[type="email"]').fill('wrong@email.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();

    // 에러 메시지 확인 - 여러 가능한 셀렉터 중 하나 확인
    const errorMessage = page.locator('.bg-red-50').first();
    const errorText = page.locator('[class*="text-red"]').first();

    await expect(errorMessage.or(errorText)).toBeVisible({ timeout: 10000 });
  });

  test('빈 폼 제출 시 유효성 검사가 동작한다', async ({ page }) => {
    // 빈 상태로 제출 시도
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // 버튼이 여전히 페이지에 있는지 확인 (제출되지 않음)
    await expect(submitButton).toBeVisible();

    // URL이 변경되지 않았는지 확인 (여전히 로그인 페이지)
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('로그아웃 흐름', () => {
  test('로그아웃하면 로그인 페이지로 이동한다', async ({ page }) => {
    // 먼저 로그인
    await page.goto('/login');
    const account = TEST_ACCOUNTS.manufacturer;
    await page.locator('input[type="email"]').fill(account.email);
    await page.locator('input[type="password"]').fill(account.password);
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/manufacturer\/dashboard/);

    // Next.js 개발 오버레이 숨기기 (클릭 이벤트 가로채기 방지)
    // @see https://github.com/vercel/next.js/discussions/23970
    await hideNextJsDevOverlay(page);

    // 로그아웃 버튼 클릭
    const logoutButton = page.locator('form[action="/api/auth/logout"] button[type="submit"]');
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(/\/login/, { timeout: 30000 });
  });
});

test.describe('인증되지 않은 접근', () => {
  test('로그인하지 않은 상태에서 대시보드 접근 시 로그인 페이지로 리다이렉트된다', async ({
    page,
  }) => {
    // 직접 대시보드 URL 접근 시도
    await page.goto('/manufacturer/dashboard');

    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(/\/login/);
  });

  test('로그인하지 않은 상태에서 관리자 페이지 접근 시 로그인 페이지로 리다이렉트된다', async ({
    page,
  }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
