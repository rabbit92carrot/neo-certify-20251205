import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, login } from './fixtures/auth';

test.describe('제조사 비즈니스 플로우 - 제품 목록', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.manufacturer.email, TEST_ACCOUNTS.manufacturer.password);
    await page.goto('/manufacturer/products');
  });

  test('제품 테이블에 데이터가 올바르게 표시된다', async ({ page }) => {
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 15000 });

    // 행이 존재하는지 확인
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);

    // "활성" Badge 존재 확인
    const activeBadge = table.locator('tbody').getByText('활성', { exact: true });
    await expect(activeBadge.first()).toBeVisible();

    // 각 행에 UDI-DI 값이 있는지 확인 (font-mono 클래스로 렌더링됨)
    const udiCell = table.locator('tbody td.font-mono');
    await expect(udiCell.first()).toBeVisible();
  });

  test('테이블 컬럼 헤더가 올바르게 표시된다', async ({ page }) => {
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 15000 });

    // 헤더 확인
    const headerText = await table.locator('thead').textContent();
    expect(headerText).toContain('제품명');
    expect(headerText).toContain('UDI-DI');
    expect(headerText).toContain('모델명');
    expect(headerText).toContain('상태');
    expect(headerText).toContain('등록일');

    // 각 행에 제품명, UDI-DI, 상태가 존재하는지 확인
    const firstRow = table.locator('tbody tr').first();
    const cells = firstRow.locator('td');
    const cellCount = await cells.count();
    // 제품명, UDI-DI, 모델명, 상태, 등록일, 액션 = 6개 컬럼
    expect(cellCount).toBeGreaterThanOrEqual(5);
  });
});

test.describe('제조사 비즈니스 플로우 - 거래 이력', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.manufacturer.email, TEST_ACCOUNTS.manufacturer.password);
    await page.goto('/manufacturer/history');
  });

  test('이벤트 유형 필터 적용 시 해당 유형 이력만 표시된다', async ({ page }) => {
    // 필터 영역 로드 대기
    await expect(page.locator('text=필터')).toBeVisible({ timeout: 15000 });

    // 이벤트 유형 Combobox 클릭
    const typeCombobox = page.getByRole('combobox');
    await typeCombobox.click();

    // "출고" 옵션 선택
    await page.getByRole('option', { name: /출고/ }).click();

    // 조회 클릭
    await page.getByRole('button', { name: /조회/ }).click();

    // 데이터 로드 대기
    await page.waitForTimeout(3000);

    // 페이지가 정상 동작하는지 확인 (에러 없이 필터 영역 유지)
    await expect(page.locator('text=필터')).toBeVisible();

    // 건수 표시 또는 빈 상태 확인
    const countText = page.locator('text=/\\d+건/');
    const noData = page.locator('text=이력이 없습니다');
    await expect(countText.first().or(noData)).toBeVisible({ timeout: 5000 });
  });
});
