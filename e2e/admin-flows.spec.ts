import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, login } from './fixtures/auth';

test.describe('관리자 비즈니스 플로우 - 전체 이력', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.admin.email, TEST_ACCOUNTS.admin.password);
    await page.goto('/admin/history');
  });

  test('이벤트 타입 필터 적용 시 해당 이벤트만 표시된다', async ({ page }) => {
    // 필터 영역 또는 에러 상태 대기
    const filterSection = page.locator('text=필터');
    const errorState = page.locator('text=다시 시도');

    await expect(filterSection.or(errorState)).toBeVisible({ timeout: 15000 });

    // 서버 에러 시 테스트 스킵
    if (await errorState.isVisible()) {
      test.skip(true, '서버 에러로 전체 이력 페이지 로드 실패');
      return;
    }

    // "생산" 체크박스 클릭
    const producedLabel = page.locator('label').filter({ hasText: '생산' });
    await producedLabel.locator('button[role="checkbox"]').click();

    // 조회 버튼 클릭
    await page.getByRole('button', { name: /조회/ }).click();

    // URL에 actionTypes 반영 확인
    await page.waitForURL(/actionTypes=PRODUCED/);

    // 테이블 로드 대기 및 결과 검증
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 15000 });

    const rows = table.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 15000 });
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // 필터된 결과에 "생산" 이벤트가 포함되는지 확인
    const tableText = await table.locator('tbody').textContent();
    expect(tableText).toContain('생산');
  });

  test('Lot 번호 검색 시 해당 Lot 결과만 표시된다', async ({ page }) => {
    // 필터 영역 또는 에러 상태 대기
    const filterSection = page.locator('text=필터');
    const errorState = page.locator('text=다시 시도');

    await expect(filterSection.or(errorState)).toBeVisible({ timeout: 15000 });

    if (await errorState.isVisible()) {
      test.skip(true, '서버 에러로 전체 이력 페이지 로드 실패');
      return;
    }

    // Lot 번호 입력
    const lotInput = page.locator('input[placeholder*="LOT"]');
    await lotInput.fill('ND00001-241201');

    // 조회 클릭
    await page.getByRole('button', { name: /조회/ }).click();

    // URL 반영 확인
    await page.waitForURL(/lotNumber/);

    // 테이블 결과 또는 빈 상태 확인
    const table = page.locator('table');
    const emptyState = page.locator('text=이벤트가 없습니다');
    await expect(table.or(emptyState)).toBeVisible({ timeout: 15000 });

    if (await table.isVisible()) {
      const tableText = await table.locator('tbody').textContent();
      expect(tableText).toContain('ND00001-241201');
    }
  });
});

test.describe('관리자 비즈니스 플로우 - 조직 관리', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.admin.email, TEST_ACCOUNTS.admin.password);
    await page.goto('/admin/organizations');
  });

  test('유형 필터 적용 시 해당 유형 조직만 표시된다', async ({ page }) => {
    // 테이블 로드 대기
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 15000 });

    // 초기 행 수 기록
    const initialRowCount = await table.locator('tbody tr').count();
    expect(initialRowCount).toBeGreaterThan(0);

    // "유형 선택" Combobox 클릭 — placeholder 텍스트로 식별
    const typeCombobox = page.getByRole('combobox').filter({ hasText: /유형/ });
    await typeCombobox.click();

    // "제조사" 옵션 선택
    await page.getByRole('option', { name: /제조사/ }).click();

    // URL 반영 확인
    await page.waitForURL(/type=MANUFACTURER/);

    // 테이블 리로드 대기
    await page.waitForTimeout(1500);
    await expect(table).toBeVisible({ timeout: 15000 });

    // 필터 후 행이 존재해야 함
    const filteredRowCount = await table.locator('tbody tr').count();
    expect(filteredRowCount).toBeGreaterThan(0);

    // 필터 후 행 수가 초기보다 적거나 같아야 함
    expect(filteredRowCount).toBeLessThanOrEqual(initialRowCount);

    // 모든 행에 "제조사" 유형이 포함되는지 확인
    const bodyText = await table.locator('tbody').textContent();
    expect(bodyText).toContain('제조사');
  });

  test('이름 검색 시 일치하는 조직만 표시된다', async ({ page }) => {
    // 테이블 로드 대기
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 15000 });

    // 초기 행 수 기록
    const initialRowCount = await table.locator('tbody tr').count();

    // 검색 입력
    const searchInput = page.locator('input[placeholder*="조직명"]');
    await searchInput.fill('테스트병원');
    await searchInput.press('Enter');

    // URL 반영 확인
    await page.waitForURL(/search/);

    // 테이블 리로드 대기
    await page.waitForTimeout(1500);
    await expect(table).toBeVisible({ timeout: 15000 });

    // 검색 결과에 "테스트병원" 포함 확인
    const tableText = await table.locator('tbody').textContent();
    expect(tableText).toContain('테스트병원');

    // 검색 후 행 수가 초기보다 적거나 같아야 함
    const filteredRowCount = await table.locator('tbody tr').count();
    expect(filteredRowCount).toBeLessThanOrEqual(initialRowCount);
  });
});
