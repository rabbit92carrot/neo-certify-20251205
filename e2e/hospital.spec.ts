import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, login } from './fixtures/auth';

test.describe('병원 대시보드', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.hospital.email, TEST_ACCOUNTS.hospital.password);
  });

  test('대시보드가 올바르게 렌더링된다', async ({ page }) => {
    await expect(page).toHaveURL(/\/hospital\/dashboard/);

    // 환영 메시지 확인
    await expect(page.locator('text=환영합니다').first()).toBeVisible();

    // 통계 카드 확인
    await expect(page.locator('text=총 재고량')).toBeVisible();
    await expect(page.locator('text=오늘 시술 건수')).toBeVisible();
    await expect(page.locator('text=총 환자 수')).toBeVisible();
  });

  test('통계 카드에 숫자가 표시된다', async ({ page }) => {
    // 대시보드 통계 로딩 완료 대기 (스켈레톤이 사라지고 실제 값이 표시될 때까지)
    await expect(page.locator('text=총 재고량')).toBeVisible({ timeout: 15000 });

    // 통계 값이 숫자로 표시되는지 확인
    // 로딩 완료 대기: 첫 번째 통계 값이 나타날 때까지
    const statValues = page.locator('.text-2xl.font-bold');
    await expect(statValues.first()).toBeVisible({ timeout: 15000 });

    const count = await statValues.count();

    expect(count).toBeGreaterThanOrEqual(3);

    // 각 통계 값이 숫자 형식인지 확인
    for (let i = 0; i < count; i++) {
      const text = await statValues.nth(i).textContent();
      expect(text).toMatch(/^[\d,]+$/);
    }
  });
});

test.describe('병원 네비게이션', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.hospital.email, TEST_ACCOUNTS.hospital.password);
  });

  test('시술 관리 페이지로 이동할 수 있다', async ({ page }) => {
    await page.getByRole('link', { name: /시술 관리|시술 등록|시술/i }).first().click();
    await expect(page).toHaveURL(/\/hospital\/treatment/);
  });

  test('재고 조회 페이지로 이동할 수 있다', async ({ page }) => {
    await page.getByRole('link', { name: /재고 조회|재고/i }).click();
    await expect(page).toHaveURL(/\/hospital\/inventory/);
  });
});

test.describe('시술 관리 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.hospital.email, TEST_ACCOUNTS.hospital.password);
    await page.goto('/hospital/treatment');
  });

  test('시술 관리 페이지가 렌더링된다', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /시술 관리|시술 등록|시술/i }).first()).toBeVisible();
  });

  test('시술 등록 폼 또는 시술 이력이 표시된다', async ({ page }) => {
    // 시술 등록 폼, 환자 정보 입력, 또는 시술 이력 테이블 확인
    const treatmentForm = page.locator('form');
    const treatmentButton = page.getByRole('button', { name: /시술 등록/i });
    const treatmentTable = page.locator('table');
    const emptyState = page.locator('text=시술 이력이 없습니다');
    const patientInput = page.locator('input[placeholder*="환자"]');

    await expect(
      treatmentForm.or(treatmentButton).or(treatmentTable).or(emptyState).or(patientInput)
    ).toBeVisible();
  });
});

test.describe('재고 조회 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.hospital.email, TEST_ACCOUNTS.hospital.password);
    await page.goto('/hospital/inventory');
  });

  test('재고 조회 페이지가 렌더링된다', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /재고 조회|재고/i }).first()).toBeVisible();
  });

  test('재고 페이지 콘텐츠가 표시된다', async ({ page }) => {
    // 페이지가 로드되었는지 확인
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();

    // 테이블 또는 페이지 콘텐츠 확인
    const table = page.locator('table').first();
    const anyContent = page.locator('main [class*="card"], main form, main table').first();

    await expect(table.or(anyContent)).toBeVisible({ timeout: 15000 });
  });
});

test.describe('시술 이력 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.hospital.email, TEST_ACCOUNTS.hospital.password);
    await page.goto('/hospital/history');
  });

  test('시술 이력 페이지가 렌더링된다', async ({ page }) => {
    // 이력 페이지 - 헤딩, 테이블, 또는 빈 상태 확인
    const historyHeading = page.getByRole('heading', { name: /시술 이력|이력/i }).first();
    const table = page.locator('table');
    const emptyState = page.locator('text=이력이 없습니다');

    await expect(historyHeading.or(table).or(emptyState)).toBeVisible();
  });
});
