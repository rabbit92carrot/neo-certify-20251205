import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, login } from './fixtures/auth';

test.describe('병원 비즈니스 플로우 - 재고 조회', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.hospital.email, TEST_ACCOUNTS.hospital.password);
    await page.goto('/hospital/inventory');
  });

  test('재고 카드 펼침 시 Lot별 상세 정보가 표시된다', async ({ page }) => {
    // "전체 재고" 요약 표시 확인
    await expect(page.locator('text=전체 재고')).toBeVisible({ timeout: 15000 });

    // 수량 Badge 확인 (N개 형식)
    const quantityBadge = page.locator('text=/\\d+개/');
    await expect(quantityBadge.first()).toBeVisible({ timeout: 15000 });

    // 재고 카드 존재 확인
    const inventoryCards = page.locator('[role="button"][aria-expanded]');
    await expect(inventoryCards.first()).toBeVisible();

    // 첫 번째 카드 클릭 → 펼침
    await inventoryCards.first().click();

    // Lot 상세 테이블 표시 확인
    const detailTable = page.locator('table');
    await expect(detailTable).toBeVisible({ timeout: 15000 });

    // 상세 테이블 헤더 검증
    const headerText = await detailTable.locator('thead').textContent();
    expect(headerText).toContain('Lot 번호');
    expect(headerText).toContain('제조일자');
    expect(headerText).toContain('유효기한');
    expect(headerText).toContain('수량');
  });
});

test.describe('병원 비즈니스 플로우 - 시술 이력', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.hospital.email, TEST_ACCOUNTS.hospital.password);
    await page.goto('/hospital/treatment-history');
  });

  test('시술 기록 카드 펼침 시 제품 정보가 표시된다', async ({ page }) => {
    // 시술 이력 헤딩 확인
    await expect(page.getByRole('heading', { name: /시술 이력/ })).toBeVisible({ timeout: 15000 });

    // 시술 기록 카드 또는 빈 상태 확인
    const maskedPhone = page.locator('text=/010-\\*{4}-\\d{3,4}/');
    const emptyState = page.locator('text=시술 이력이 없습니다');

    await expect(maskedPhone.first().or(emptyState)).toBeVisible({ timeout: 15000 });

    if (await maskedPhone.first().isVisible()) {
      // 카드가 있는 경우 — 펼침 테스트
      // TreatmentRecordCard의 CardHeader는 cursor-pointer로 클릭 가능
      const cardHeader = page.locator('.cursor-pointer').first();
      await cardHeader.click();

      // 펼친 내부에 제품 정보 확인 (수량 Badge: N개)
      const productQuantity = page.locator('.border-t >> text=/\\d+개/');
      await expect(productQuantity.first()).toBeVisible({ timeout: 5000 });
    }
  });
});
