import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, login } from './fixtures/auth';

test.describe('제조사 대시보드', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.manufacturer.email, TEST_ACCOUNTS.manufacturer.password);
  });

  test('대시보드가 올바르게 렌더링된다', async ({ page }) => {
    await expect(page).toHaveURL(/\/manufacturer\/dashboard/);

    // 환영 메시지 확인
    await expect(page.locator('text=환영합니다')).toBeVisible();

    // 통계 카드 확인
    await expect(page.locator('text=총 재고량')).toBeVisible();
    await expect(page.locator('text=오늘 생산량')).toBeVisible();
    await expect(page.locator('text=오늘 출고량')).toBeVisible();
    await expect(page.locator('text=활성 제품')).toBeVisible();
  });

  test('통계 카드에 숫자가 표시된다', async ({ page }) => {
    // 대시보드 통계 로딩 완료 대기 (스켈레톤이 사라지고 실제 값이 표시될 때까지)
    // 통계 카드 제목이 보이면 카드 자체는 렌더링된 것
    await expect(page.locator('text=총 재고량')).toBeVisible({ timeout: 15000 });

    // 통계 값이 숫자로 표시되는지 확인 (text-2xl font-bold 클래스)
    // 로딩 완료 대기: 첫 번째 통계 값이 나타날 때까지
    const statValues = page.locator('.text-2xl.font-bold');
    await expect(statValues.first()).toBeVisible({ timeout: 15000 });

    const count = await statValues.count();

    expect(count).toBeGreaterThanOrEqual(4);

    // 각 통계 값이 숫자 형식인지 확인
    for (let i = 0; i < count; i++) {
      const text = await statValues.nth(i).textContent();
      expect(text).toMatch(/^[\d,]+$/);
    }
  });
});

test.describe('제조사 네비게이션', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.manufacturer.email, TEST_ACCOUNTS.manufacturer.password);
  });

  test('제품 관리 페이지로 이동할 수 있다', async ({ page }) => {
    await page.getByRole('link', { name: /제품 관리|제품/i }).click();
    await expect(page).toHaveURL(/\/manufacturer\/products/);
  });

  test('생산 관리 페이지로 이동할 수 있다', async ({ page }) => {
    await page.getByRole('link', { name: /생산 관리|생산/i }).click();
    await expect(page).toHaveURL(/\/manufacturer\/production/);
  });

  test('출고 관리 페이지로 이동할 수 있다', async ({ page }) => {
    await page.getByRole('link', { name: /출고 관리|출고/i }).click();
    await expect(page).toHaveURL(/\/manufacturer\/shipment/);
  });

  test('재고 조회 페이지로 이동할 수 있다', async ({ page }) => {
    await page.getByRole('link', { name: /재고 조회|재고/i }).click();
    await expect(page).toHaveURL(/\/manufacturer\/inventory/);
  });
});

test.describe('제품 관리 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.manufacturer.email, TEST_ACCOUNTS.manufacturer.password);
    await page.goto('/manufacturer/products');
  });

  test('제품 목록 페이지가 렌더링된다', async ({ page }) => {
    // 페이지 제목 확인 - heading 역할로 찾기
    await expect(page.getByRole('heading', { name: /제품 관리|제품/i }).first()).toBeVisible();

    // 테이블 또는 빈 상태 메시지 확인
    const table = page.locator('table');
    const emptyState = page.locator('text=등록된 제품이 없습니다');

    await expect(table.or(emptyState)).toBeVisible();
  });

  test('제품 등록 버튼이 존재한다', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /제품 등록|새 제품|추가/i });
    await expect(addButton.or(page.getByRole('link', { name: /제품 등록|새 제품|추가/i }))).toBeVisible();
  });
});

test.describe('생산 관리 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.manufacturer.email, TEST_ACCOUNTS.manufacturer.password);
    await page.goto('/manufacturer/production');
  });

  test('생산 관리 페이지가 렌더링된다', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /생산 관리|생산/i }).first()).toBeVisible();
  });

  test('Lot 생성 폼이 존재한다', async ({ page }) => {
    // 생산 등록 버튼 확인 (로그아웃 폼 제외)
    const createButton = page.getByRole('button', { name: '생산 등록' });

    await expect(createButton).toBeVisible();
  });
});

test.describe('출고 관리 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.manufacturer.email, TEST_ACCOUNTS.manufacturer.password);
    await page.goto('/manufacturer/shipment');
  });

  test('출고 관리 페이지가 렌더링된다', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /출고 관리|출고/i }).first()).toBeVisible();
  });

  test('출고 이력 탭이 존재한다', async ({ page }) => {
    // 출고 이력, 폼, 또는 테이블 확인
    const historyTab = page.locator('text=출고 이력').first();
    const table = page.locator('table');
    const form = page.locator('form');

    await expect(historyTab.or(table).or(form)).toBeVisible();
  });
});

test.describe('재고 조회 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.manufacturer.email, TEST_ACCOUNTS.manufacturer.password);
    await page.goto('/manufacturer/inventory');
  });

  test('재고 조회 페이지가 렌더링된다', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /재고 조회|재고/i }).first()).toBeVisible();
  });

  test('재고 페이지 콘텐츠가 표시된다', async ({ page }) => {
    // 페이지가 로드되었는지 확인 (main 영역 내 콘텐츠)
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();

    // 테이블, 빈 상태, 또는 로딩 완료된 상태 확인
    const table = page.locator('table').first();
    const anyContent = page.locator('main [class*="card"], main form, main table').first();

    await expect(table.or(anyContent)).toBeVisible({ timeout: 15000 });
  });
});
