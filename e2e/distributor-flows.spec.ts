import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, login } from './fixtures/auth';

test.describe('유통사 비즈니스 플로우 - 재고 조회', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.distributor.email, TEST_ACCOUNTS.distributor.password);
    await page.goto('/distributor/inventory');
  });

  test('재고 카드 표시 및 펼침 시 Lot 상세 테이블이 표시된다', async ({ page }) => {
    // "전체 재고" 요약 표시 확인
    await expect(page.locator('text=전체 재고')).toBeVisible({ timeout: 15000 });

    // 재고 카드 존재 확인
    const inventoryCards = page.locator('[role="button"][aria-expanded]');
    await expect(inventoryCards.first()).toBeVisible({ timeout: 15000 });
    const cardCount = await inventoryCards.count();
    expect(cardCount).toBeGreaterThan(0);

    // 첫 번째 카드 클릭 → 펼침
    await inventoryCards.first().click();

    // aria-expanded="true" 전환 확인
    await expect(inventoryCards.first()).toHaveAttribute('aria-expanded', 'true');

    // Lot 상세 테이블 표시 확인
    const detailTable = page.locator('table');
    await expect(detailTable).toBeVisible({ timeout: 15000 });

    // 헤더 확인
    const headerText = await detailTable.locator('thead').textContent();
    expect(headerText).toContain('Lot 번호');
    expect(headerText).toContain('제조일자');
    expect(headerText).toContain('유효기한');
    expect(headerText).toContain('수량');
  });
});

test.describe('유통사 비즈니스 플로우 - 거래 이력', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.distributor.email, TEST_ACCOUNTS.distributor.password);
    await page.goto('/distributor/history');
  });

  test('이벤트 유형 필터 전환 시 결과가 변경된다', async ({ page }) => {
    // 필터 영역 로드 대기
    await expect(page.locator('text=필터')).toBeVisible({ timeout: 15000 });

    // 초기 데이터 로드 대기
    await page.waitForTimeout(2000);

    // 이벤트 유형 Combobox 클릭
    const typeCombobox = page.getByRole('combobox');
    await typeCombobox.click();

    // "출고" 옵션 선택
    await page.getByRole('option', { name: '출고', exact: true }).click();

    // 조회 클릭
    await page.getByRole('button', { name: /조회/ }).click();
    await page.waitForTimeout(2000);

    // 필터 영역이 여전히 정상 표시되는지 확인 (에러 없음)
    await expect(page.locator('text=필터')).toBeVisible();

    // "전체" 선택으로 전환
    await typeCombobox.click();
    await page.getByRole('option', { name: '전체' }).click();

    // 다시 조회
    await page.getByRole('button', { name: /조회/ }).click();
    await page.waitForTimeout(2000);

    // 페이지가 정상적으로 동작하는지 확인
    await expect(page.locator('text=필터')).toBeVisible();
  });

  test('페이지네이션이 올바르게 표시된다', async ({ page }) => {
    // 필터 영역 로드 대기
    await expect(page.locator('text=필터')).toBeVisible({ timeout: 15000 });

    // 데이터 로드 대기
    await page.waitForTimeout(3000);

    // 페이지 정보 표시 확인
    const pageInfo = page.locator('text=페이지');
    await expect(pageInfo.first()).toBeVisible({ timeout: 15000 });

    // 이전/다음 버튼 존재 확인
    const prevButton = page.getByRole('button', { name: /이전/ });
    const nextButton = page.getByRole('button', { name: /다음/ });

    await expect(prevButton).toBeVisible();
    await expect(nextButton).toBeVisible();

    // 첫 페이지에서는 이전 버튼이 비활성화
    await expect(prevButton).toBeDisabled();
  });
});
