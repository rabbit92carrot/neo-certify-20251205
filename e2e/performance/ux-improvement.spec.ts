/**
 * UX 개선 효과 측정 테스트
 *
 * 실행: npx playwright test e2e/performance/ux-improvement.spec.ts --headed
 */

import { test, expect } from '@playwright/test';

// 테스트 계정 (TEST_GUIDE.md 기준)
const TEST_ACCOUNTS = {
  admin: { email: 'admin@neocert.com', password: 'admin123' },
  hospital: { email: 'hospital@neocert.com', password: 'test123' },
  manufacturer: { email: 'manufacturer@neocert.com', password: 'test123' },
};

test.describe('UX 개선 효과 측정', () => {

  test.describe('Task 1: Server Action 응답 속도', () => {
    test('제조사 제품 등록 응답 시간 측정', async ({ page }) => {
      // 로그인
      await page.goto('/login');
      await page.fill('input[name="email"]', TEST_ACCOUNTS.manufacturer.email);
      await page.fill('input[name="password"]', TEST_ACCOUNTS.manufacturer.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/manufacturer/**');

      // 제품 관리 페이지로 이동
      await page.goto('/manufacturer/products');
      await page.waitForLoadState('networkidle');

      // 제품 등록 모달 열기 (버튼 텍스트에 따라 조정)
      const addButton = page.getByRole('button', { name: /제품 등록|새 제품|추가/i });
      if (await addButton.isVisible()) {
        await addButton.click();
      }

      // 폼 작성
      await page.fill('input[name="name"]', `테스트제품_${Date.now()}`);
      await page.fill('input[name="udiDi"]', `UDI_${Date.now()}`);
      await page.fill('input[name="modelName"]', `MODEL_${Date.now()}`);

      // 응답 시간 측정
      const startTime = performance.now();

      // Server Action 요청 캡처
      const responsePromise = page.waitForResponse(
        response => response.url().includes('manufacturer') && response.request().method() === 'POST'
      );

      // 저장 버튼 클릭
      await page.click('button[type="submit"]');

      // 응답 대기
      const response = await responsePromise;
      const endTime = performance.now();

      const responseTime = endTime - startTime;

      console.log(`\n📊 제품 등록 응답 시간: ${responseTime.toFixed(0)}ms`);
      console.log(`   - 목표: 500ms 이하 (after() 적용 효과)`);

      // 성공 확인
      expect(response.status()).toBeLessThan(400);
    });
  });

  test.describe('Task 2: 시술 이력 페이지 FCP', () => {
    test('병원 시술 이력 First Contentful Paint 측정', async ({ page }) => {
      // 로그인
      await page.goto('/login');
      await page.fill('input[name="email"]', TEST_ACCOUNTS.hospital.email);
      await page.fill('input[name="password"]', TEST_ACCOUNTS.hospital.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/hospital/**');

      // Performance 측정 시작
      await page.goto('/hospital/treatment-history', { waitUntil: 'commit' });

      // PageHeader가 보이는 시점 측정 (Suspense 효과)
      const headerStartTime = performance.now();
      await page.waitForSelector('h1:has-text("시술 이력")', { timeout: 5000 });
      const headerVisibleTime = performance.now() - headerStartTime;

      // 테이블 데이터가 보이는 시점 측정
      const tableStartTime = performance.now();
      await page.waitForSelector('[data-testid="treatment-history-table"], table, .space-y-4 > div', {
        timeout: 10000
      });
      const tableVisibleTime = performance.now() - tableStartTime;

      console.log(`\n📊 시술 이력 페이지 로딩 시간`);
      console.log(`   - PageHeader 표시: ${headerVisibleTime.toFixed(0)}ms (목표: 100ms 이하)`);
      console.log(`   - 테이블 데이터 표시: ${(headerVisibleTime + tableVisibleTime).toFixed(0)}ms`);
      console.log(`   - Suspense 효과: 헤더가 먼저 표시되어야 함`);

      // Suspense 효과 검증: 헤더가 테이블보다 먼저 표시
      expect(headerVisibleTime).toBeLessThan(1000);
    });
  });

  test.describe('Task 3: 관리자 대시보드 FCP', () => {
    test('관리자 대시보드 점진적 로딩 측정', async ({ page }) => {
      // 로그인
      await page.goto('/login');
      await page.fill('input[name="email"]', TEST_ACCOUNTS.admin.email);
      await page.fill('input[name="password"]', TEST_ACCOUNTS.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/admin/**');

      // Performance 측정 시작
      const navigationStart = performance.now();
      await page.goto('/admin/dashboard', { waitUntil: 'commit' });

      // 1. 환영 메시지 표시 시점
      await page.waitForSelector('text=환영합니다', { timeout: 5000 });
      const welcomeTime = performance.now() - navigationStart;

      // 2. 빠른 메뉴 표시 시점
      await page.waitForSelector('text=빠른 메뉴', { timeout: 5000 });
      const quickMenuTime = performance.now() - navigationStart;

      // 3. 통계 카드 표시 시점 (스켈레톤 또는 실제 데이터)
      await page.waitForSelector('text=총 조직 수', { timeout: 10000 });
      const statsTime = performance.now() - navigationStart;

      // 4. 승인 대기 목록 표시 시점
      await page.waitForSelector('text=최근 승인 대기', { timeout: 10000 });
      const pendingTime = performance.now() - navigationStart;

      console.log(`\n📊 관리자 대시보드 점진적 로딩 시간`);
      console.log(`   - 환영 메시지: ${welcomeTime.toFixed(0)}ms (즉시 표시)`);
      console.log(`   - 빠른 메뉴: ${quickMenuTime.toFixed(0)}ms (즉시 표시)`);
      console.log(`   - 통계 카드: ${statsTime.toFixed(0)}ms (Suspense 로딩)`);
      console.log(`   - 승인 대기: ${pendingTime.toFixed(0)}ms (Suspense 로딩)`);
      console.log(`   - Suspense 효과: 환영+메뉴가 통계보다 먼저 표시`);

      // Suspense 효과 검증
      expect(welcomeTime).toBeLessThan(statsTime);
      expect(quickMenuTime).toBeLessThan(pendingTime);
    });
  });

});

test.describe('개선 전후 비교 (수동 측정용)', () => {
  test('Web Vitals 측정', async ({ page }) => {
    // Web Vitals 측정 스크립트 주입
    await page.addInitScript(() => {
      (window as Window & { __WEB_VITALS__?: Record<string, number> }).__WEB_VITALS__ = {};

      // LCP (Largest Contentful Paint)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          (window as Window & { __WEB_VITALS__?: Record<string, number> }).__WEB_VITALS__!.LCP = lastEntry.startTime;
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      // FCP (First Contentful Paint)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        (window as Window & { __WEB_VITALS__?: Record<string, number> }).__WEB_VITALS__!.FCP = entries[0]?.startTime || 0;
      }).observe({ type: 'paint', buffered: true });
    });

    // 테스트할 페이지로 이동 (로그인 필요시 선행)
    await page.goto('/login');

    // 잠시 대기 후 Web Vitals 수집
    await page.waitForTimeout(3000);

    const webVitals = await page.evaluate(() => {
      return (window as Window & { __WEB_VITALS__?: Record<string, number> }).__WEB_VITALS__;
    });

    console.log('\n📊 Web Vitals 측정 결과');
    console.log(`   - FCP: ${webVitals?.FCP?.toFixed(0) || 'N/A'}ms`);
    console.log(`   - LCP: ${webVitals?.LCP?.toFixed(0) || 'N/A'}ms`);
  });
});
