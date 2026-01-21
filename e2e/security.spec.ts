/**
 * Security E2E Tests
 *
 * 보안 변경 후 End-to-End 검증:
 * - 전체 역할(4개) 로그인 성공 및 대시보드 리다이렉트
 * - 비인증 상태 보호 경로 접근 시 로그인 리다이렉트
 * - 로그아웃 후 세션 클리어 및 리다이렉트
 * - 로그인 페이지에 민감 정보 노출 없음
 */
import { test, expect, Page } from '@playwright/test';
import { TEST_ACCOUNTS, login, hideNextJsDevOverlay } from './fixtures/auth';

test.describe('Security E2E Tests', () => {
  // ============================================================================
  // 인증 플로우 테스트
  // ============================================================================
  test.describe('Authentication Flow', () => {
    test('제조사 로그인 성공 및 대시보드 리다이렉트', async ({ page }) => {
      await page.goto('/login');

      await page.locator('input[type="email"]').fill(TEST_ACCOUNTS.manufacturer.email);
      await page.locator('input[type="password"]').fill(TEST_ACCOUNTS.manufacturer.password);
      await page.locator('button[type="submit"]').click();

      // 제조사 대시보드로 리다이렉트
      await expect(page).toHaveURL(/\/manufacturer\/dashboard/, { timeout: 15000 });

      // 환영 메시지 또는 대시보드 요소 확인
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    test('유통사 로그인 성공 및 대시보드 리다이렉트', async ({ page }) => {
      await page.goto('/login');

      await page.locator('input[type="email"]').fill(TEST_ACCOUNTS.distributor.email);
      await page.locator('input[type="password"]').fill(TEST_ACCOUNTS.distributor.password);
      await page.locator('button[type="submit"]').click();

      await expect(page).toHaveURL(/\/distributor\/dashboard/, { timeout: 15000 });
    });

    test('병원 로그인 성공 및 대시보드 리다이렉트', async ({ page }) => {
      await page.goto('/login');

      await page.locator('input[type="email"]').fill(TEST_ACCOUNTS.hospital.email);
      await page.locator('input[type="password"]').fill(TEST_ACCOUNTS.hospital.password);
      await page.locator('button[type="submit"]').click();

      await expect(page).toHaveURL(/\/hospital\/dashboard/, { timeout: 15000 });
    });

    test('관리자 로그인 성공 및 대시보드 리다이렉트', async ({ page }) => {
      await page.goto('/login');

      await page.locator('input[type="email"]').fill(TEST_ACCOUNTS.admin.email);
      await page.locator('input[type="password"]').fill(TEST_ACCOUNTS.admin.password);
      await page.locator('button[type="submit"]').click();

      await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 15000 });
    });

    test('잘못된 자격 증명으로 로그인 시 에러 표시', async ({ page }) => {
      await page.goto('/login');

      await page.locator('input[type="email"]').fill('wrong@email.com');
      await page.locator('input[type="password"]').fill('wrongpassword');
      await page.locator('button[type="submit"]').click();

      // 에러 메시지 표시 대기
      const errorMessage = page.locator('[class*="text-red"], [class*="bg-red"], [role="alert"]');
      await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
    });
  });

  // ============================================================================
  // 비인증 접근 보호 테스트
  // ============================================================================
  test.describe('Unauthenticated Access Protection', () => {
    test('보호된 라우트 접근 시 로그인 페이지로 리다이렉트', async ({ page }) => {
      const protectedRoutes = [
        '/manufacturer/dashboard',
        '/distributor/dashboard',
        '/hospital/dashboard',
        '/admin/dashboard',
      ];

      for (const route of protectedRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
      }
    });

    test('제조사 세부 페이지 접근 시 로그인 리다이렉트', async ({ page }) => {
      await page.goto('/manufacturer/products');
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    });

    test('관리자 세부 페이지 접근 시 로그인 리다이렉트', async ({ page }) => {
      await page.goto('/admin/organizations');
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    });

    test('병원 세부 페이지 접근 시 로그인 리다이렉트', async ({ page }) => {
      await page.goto('/hospital/treatment');
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    });
  });

  // ============================================================================
  // 로그아웃 테스트
  // ============================================================================
  test.describe('Logout', () => {
    test('로그아웃 후 로그인 페이지로 리다이렉트', async ({ page }) => {
      // 로그인
      await login(page, TEST_ACCOUNTS.manufacturer.email, TEST_ACCOUNTS.manufacturer.password);

      await hideNextJsDevOverlay(page);

      // 로그아웃 버튼 찾기 및 클릭
      const logoutForm = page.locator('form[action="/api/auth/logout"]');

      if (await logoutForm.isVisible({ timeout: 5000 })) {
        const logoutButton = logoutForm.locator('button[type="submit"]');
        await logoutButton.click();
      } else {
        // 드롭다운 메뉴에서 로그아웃 찾기
        const userMenu = page.locator('[data-testid="user-menu"]');
        if (await userMenu.isVisible()) {
          await userMenu.click();
          await page.locator('text=로그아웃').click();
        }
      }

      // 로그인 페이지로 리다이렉트 확인
      await expect(page).toHaveURL(/\/login/, { timeout: 30000 });
    });

    test('로그아웃 후 보호된 페이지 접근 시 로그인 리다이렉트', async ({ page }) => {
      // 로그인
      await login(page, TEST_ACCOUNTS.distributor.email, TEST_ACCOUNTS.distributor.password);

      await hideNextJsDevOverlay(page);

      // 로그아웃
      const logoutForm = page.locator('form[action="/api/auth/logout"]');
      if (await logoutForm.isVisible({ timeout: 5000 })) {
        await logoutForm.locator('button[type="submit"]').click();
      }

      await expect(page).toHaveURL(/\/login/, { timeout: 30000 });

      // 다시 보호된 페이지 접근 시도
      await page.goto('/distributor/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  // ============================================================================
  // 민감 정보 노출 방지 테스트
  // ============================================================================
  test.describe('Sensitive Information Protection', () => {
    test('로그인 페이지에 조직 ID 노출 없음', async ({ page }) => {
      await page.goto('/login');

      const pageContent = await page.content();

      // 시드 데이터 조직 ID가 노출되지 않아야 함
      expect(pageContent).not.toContain('a0000000-0000-0000-0000-000000000001');
      expect(pageContent).not.toContain('a0000000-0000-0000-0000-000000000002');
      expect(pageContent).not.toContain('a0000000-0000-0000-0000-000000000003');
      expect(pageContent).not.toContain('a0000000-0000-0000-0000-000000000004');
    });

    test('로그인 페이지에 사용자 이메일 노출 없음', async ({ page }) => {
      await page.goto('/login');

      const pageContent = await page.content();

      // 시드 데이터 이메일이 노출되지 않아야 함
      expect(pageContent).not.toContain('manufacturer@neocert.com');
      expect(pageContent).not.toContain('distributor@neocert.com');
      expect(pageContent).not.toContain('hospital@neocert.com');
    });

    test('에러 메시지에 상세 정보 노출 없음', async ({ page }) => {
      await page.goto('/login');

      await page.locator('input[type="email"]').fill('test@test.com');
      await page.locator('input[type="password"]').fill('wrongpassword');
      await page.locator('button[type="submit"]').click();

      // 에러 메시지 대기
      const errorMessage = page.locator('[class*="text-red"], [class*="bg-red"], [role="alert"]');
      await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });

      // 에러 메시지 영역의 텍스트만 검사 (JS 번들 파일명 제외)
      const visibleText = await page.locator('body').innerText();

      // 상세 에러 정보 (스택 트레이스, DB 에러 등) 노출 안 됨
      expect(visibleText).not.toMatch(/at\s+\w+\s+\(/); // 스택 트레이스 패턴
      expect(visibleText).not.toContain('PostgrestError');
      expect(visibleText).not.toContain('PGRST');
      expect(visibleText).not.toContain('Error:');
    });
  });

  // ============================================================================
  // 공개 페이지 접근 테스트
  // ============================================================================
  test.describe('Public Pages Access', () => {
    test('문의 페이지 접근 가능', async ({ page }) => {
      await page.goto('/inquiry');

      // 로그인 리다이렉트 없이 페이지 로드
      await expect(page).toHaveURL(/\/inquiry/);

      // 페이지 내용 확인
      await expect(page.locator('body')).toBeVisible();
    });

    test('홈페이지 접근 가능', async ({ page }) => {
      await page.goto('/');

      // 페이지 로드 확인
      await expect(page.locator('body')).toBeVisible();
    });

    test('회원가입 페이지 접근 가능', async ({ page }) => {
      await page.goto('/register');

      // 회원가입 폼 확인
      await expect(page.locator('form')).toBeVisible();
    });
  });

  // ============================================================================
  // 역할별 권한 테스트
  // ============================================================================
  test.describe('Role-Based Access Control', () => {
    test('제조사: 관리자 페이지 접근 시 리다이렉트', async ({ page }) => {
      // 제조사로 로그인
      await login(page, TEST_ACCOUNTS.manufacturer.email, TEST_ACCOUNTS.manufacturer.password);

      // 관리자 페이지 접근 시도 (미들웨어가 리다이렉트 수행)
      await page.goto('/admin/dashboard');

      // 제조사 대시보드로 리다이렉트 대기
      await expect(page).toHaveURL(/\/manufacturer\//, { timeout: 10000 });
    });

    test('유통사: 제조사 전용 페이지 접근 시 리다이렉트', async ({ page }) => {
      // 유통사로 로그인
      await login(page, TEST_ACCOUNTS.distributor.email, TEST_ACCOUNTS.distributor.password);

      // 제조사 제품 페이지 접근 시도
      await page.goto('/manufacturer/products');

      // 유통사 대시보드로 리다이렉트 대기
      await expect(page).toHaveURL(/\/distributor\//, { timeout: 10000 });
    });

    test('병원: 유통사 전용 페이지 접근 시 리다이렉트', async ({ page }) => {
      // 병원으로 로그인
      await login(page, TEST_ACCOUNTS.hospital.email, TEST_ACCOUNTS.hospital.password);

      // 유통사 출하 페이지 접근 시도
      await page.goto('/distributor/shipment');

      // 병원 대시보드로 리다이렉트 대기
      await expect(page).toHaveURL(/\/hospital\//, { timeout: 10000 });
    });
  });

  // ============================================================================
  // Rate Limiting 동작 테스트 (관찰 가능한 행동)
  // ============================================================================
  test.describe('Rate Limiting Behavior', () => {
    test('여러 번 실패한 로그인 시도 후에도 UI 정상 동작', async ({ page }) => {
      await page.goto('/login');

      // 5번 실패 시도 (rate limit 20회 미만)
      for (let i = 0; i < 5; i++) {
        await page.locator('input[type="email"]').fill(`wrong${i}@email.com`);
        await page.locator('input[type="password"]').fill('wrongpassword');
        await page.locator('button[type="submit"]').click();

        // 에러 메시지 또는 페이지 갱신 대기
        await page.waitForTimeout(1000);

        // 입력 필드 초기화
        await page.locator('input[type="email"]').clear();
        await page.locator('input[type="password"]').clear();
      }

      // 폼이 여전히 작동해야 함
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeEnabled();
    });
  });
});
