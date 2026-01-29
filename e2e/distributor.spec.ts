import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, login } from './fixtures/auth';

test.describe('유통사 대시보드', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.distributor.email, TEST_ACCOUNTS.distributor.password);
  });

  test('대시보드가 올바르게 렌더링된다', async ({ page }) => {
    await expect(page).toHaveURL(/\/distributor\/dashboard/);

    // 환영 메시지 확인
    await expect(page.locator('text=환영합니다').first()).toBeVisible();

    // 통계 카드 확인
    await expect(page.locator('text=총 재고량')).toBeVisible();
    await expect(page.locator('text=오늘 입고량')).toBeVisible();
    await expect(page.locator('text=오늘 출고량')).toBeVisible();
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

test.describe('유통사 네비게이션', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.distributor.email, TEST_ACCOUNTS.distributor.password);
  });

  test('출고 관리 페이지로 이동할 수 있다', async ({ page }) => {
    await page.getByRole('link', { name: /출고 관리|출고/i }).click();
    await expect(page).toHaveURL(/\/distributor\/shipment/);
  });

  test('재고 조회 페이지로 이동할 수 있다', async ({ page }) => {
    await page.getByRole('link', { name: /재고 조회|재고/i }).click();
    await expect(page).toHaveURL(/\/distributor\/inventory/);
  });
});

test.describe('출고 관리 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.distributor.email, TEST_ACCOUNTS.distributor.password);
    await page.goto('/distributor/shipment');
  });

  test('출고 관리 페이지가 렌더링된다', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /출고 관리|출고/i }).first()).toBeVisible();
  });

  test('출고 폼 또는 출고 이력이 표시된다', async ({ page }) => {
    // 출고 폼, 출고 버튼, 또는 출고 이력 테이블 확인
    const shipmentForm = page.locator('form');
    const shipmentButton = page.getByRole('button', { name: /출고/i });
    const shipmentTable = page.locator('table');
    const emptyState = page.locator('text=출고 이력이 없습니다');

    await expect(
      shipmentForm.or(shipmentButton).or(shipmentTable).or(emptyState)
    ).toBeVisible();
  });
});

test.describe('재고 조회 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.distributor.email, TEST_ACCOUNTS.distributor.password);
    await page.goto('/distributor/inventory');
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
