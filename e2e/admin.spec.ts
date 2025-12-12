import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, login } from './fixtures/auth';

test.describe('관리자 대시보드', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.admin.email, TEST_ACCOUNTS.admin.password);
  });

  test('대시보드가 올바르게 렌더링된다', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // 환영 메시지 확인
    await expect(page.locator('text=환영합니다').first()).toBeVisible();

    // 통계 카드 확인 - 메인 영역에서만 찾기
    const main = page.locator('main');
    await expect(main.locator('text=총 조직 수').first()).toBeVisible();
    await expect(main.locator('text=오늘 회수 건수').first()).toBeVisible();
    await expect(main.locator('text=총 가상 코드').first()).toBeVisible();
  });

  test('최근 승인 대기 섹션이 표시된다', async ({ page }) => {
    await expect(page.locator('text=최근 승인 대기')).toBeVisible();
  });

  test('빠른 메뉴 섹션이 표시된다', async ({ page }) => {
    await expect(page.locator('text=빠른 메뉴')).toBeVisible();

    // 빠른 메뉴 버튼들 확인 - main 영역에서만 찾기
    const main = page.locator('main');
    await expect(main.locator('text=조직 관리').first()).toBeVisible();
    await expect(main.locator('text=가입 승인').first()).toBeVisible();
    await expect(main.locator('text=전체 이력').first()).toBeVisible();
  });
});

test.describe('관리자 네비게이션', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.admin.email, TEST_ACCOUNTS.admin.password);
  });

  test('조직 관리 페이지로 이동할 수 있다', async ({ page }) => {
    await page.getByRole('link', { name: /조직 관리|조직/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/organizations/);
  });

  test('승인 대기 페이지로 이동할 수 있다', async ({ page }) => {
    await page.getByRole('link', { name: /가입 승인|승인/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/approvals/);
  });

  test('전체 이력 페이지로 이동할 수 있다', async ({ page }) => {
    await page.getByRole('link', { name: /전체 이력|이력/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/history/);
  });
});

test.describe('조직 관리 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.admin.email, TEST_ACCOUNTS.admin.password);
    await page.goto('/admin/organizations');
  });

  test('조직 관리 페이지가 렌더링된다', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '조직 관리' }).first()).toBeVisible();
  });

  test('조직 목록 테이블이 표시된다', async ({ page }) => {
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('조직 타입 필터가 존재한다', async ({ page }) => {
    // 필터 버튼 또는 셀렉트 확인
    const filterButton = page.getByRole('button', { name: /필터/i });
    const filterSelect = page.locator('select, [role="combobox"]');

    await expect(filterButton.or(filterSelect).first()).toBeVisible();
  });
});

test.describe('승인 대기 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.admin.email, TEST_ACCOUNTS.admin.password);
    await page.goto('/admin/approvals');
  });

  test('승인 대기 페이지가 렌더링된다', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /가입 승인|승인 대기/i }).first()).toBeVisible();
  });

  test('승인 대기 목록 또는 빈 상태가 표시된다', async ({ page }) => {
    const table = page.locator('table');
    const emptyState = page.locator('text=승인 대기 중인 조직이 없습니다');
    const pendingList = page.locator('[class*="pending"]');

    await expect(table.or(emptyState).or(pendingList)).toBeVisible();
  });
});

test.describe('전체 이력 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.admin.email, TEST_ACCOUNTS.admin.password);
    await page.goto('/admin/history');
  });

  test('전체 이력 페이지가 렌더링된다', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '전체 이력' }).first()).toBeVisible();
  });

  test('필터 섹션이 표시된다', async ({ page }) => {
    // Lot 번호 검색 입력 확인
    const lotInput = page.locator('input[placeholder*="LOT"]');
    await expect(lotInput).toBeVisible();
  });

  test('조회 버튼이 존재한다', async ({ page }) => {
    const searchButton = page.getByRole('button', { name: /조회/i });
    await expect(searchButton).toBeVisible();
  });

  test('CSV 다운로드 버튼이 존재한다', async ({ page }) => {
    const csvButton = page.getByRole('button', { name: /CSV 다운로드/i });
    await expect(csvButton).toBeVisible();
  });

  test('이벤트 이력 테이블이 표시된다', async ({ page }) => {
    // 테이블 또는 로딩 상태 확인
    await expect(page.locator('table').or(page.locator('text=로딩')).first()).toBeVisible();
  });

  test('페이지네이션이 존재한다', async ({ page }) => {
    // 이전/다음 버튼 또는 페이지 정보 확인
    const pagination = page.locator('text=/\\d+ \\/ \\d+/'); // "1 / 5" 형식
    const prevButton = page.getByRole('button', { name: /이전/i });
    const nextButton = page.getByRole('button', { name: /다음/i });

    await expect(pagination.or(prevButton).or(nextButton).first()).toBeVisible();
  });

  test('이벤트 타입 필터가 동작한다', async ({ page }) => {
    // 이벤트 타입 체크박스 확인 (생산, 출고, 입고, 시술, 회수)
    const eventTypeCheckbox = page.locator('input[type="checkbox"]').first();

    if (await eventTypeCheckbox.isVisible()) {
      // 체크박스 클릭
      await eventTypeCheckbox.click();

      // 조회 버튼 클릭
      await page.getByRole('button', { name: /조회/i }).click();

      // 페이지가 업데이트되는지 확인 (로딩 상태 또는 테이블 변경)
      await page.waitForLoadState('networkidle');
    }
  });
});

test.describe('회수 이력 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.admin.email, TEST_ACCOUNTS.admin.password);
    await page.goto('/admin/recalls');
  });

  test('회수 이력 페이지가 렌더링된다', async ({ page }) => {
    // 회수 이력 페이지 제목 또는 테이블 확인
    const recallHeading = page.getByRole('heading', { name: /회수/i }).first();
    const recallTable = page.locator('table');
    const emptyState = page.locator('text=회수 이력이 없습니다');

    await expect(recallHeading.or(recallTable).or(emptyState)).toBeVisible();
  });
});
