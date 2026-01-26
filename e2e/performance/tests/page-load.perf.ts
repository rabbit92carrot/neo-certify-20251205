/**
 * 페이지 로딩 시간 측정 테스트
 * 각 페이지별로 3회 측정하여 통계 분석
 */

import { test } from '@playwright/test';
import { TEST_ACCOUNTS, login } from '../../fixtures/auth';
import { ROLES, getPagesByRole, type UserRole, type PageConfig } from '../config/pages.config';
import { measurePageLoad, measureMultipleTimes, type PageLoadMetrics } from '../utils/metrics';
import {
  calculateStatistics,
  type AggregatedPageMetrics,
  type NavigationTimingStatistics,
} from '../utils/statistics';
import { generateReport, saveReports } from '../utils/report-generator';
import * as path from 'path';

/** 측정 횟수 */
const MEASUREMENT_COUNT = 3;

/** 측정 간 대기 시간 (ms) */
const COOLDOWN = 1000;

/** 수집된 모든 결과 */
const allResults: AggregatedPageMetrics[] = [];

test.describe.serial('페이지 로딩 성능 측정', () => {
  // 역할별로 테스트 그룹 생성
  for (const role of ROLES) {
    const pages = getPagesByRole(role);
    const account = TEST_ACCOUNTS[role as keyof typeof TEST_ACCOUNTS];

    test.describe(`${getRoleName(role)} 페이지`, () => {
      test.beforeEach(async ({ page }) => {
        // 각 테스트 전 로그인
        await login(page, account.email, account.password);
      });

      for (const pageConfig of pages) {
        test(`[${pageConfig.name}] 로딩 시간 측정 (${MEASUREMENT_COUNT}회)`, async ({ page }) => {
          console.log(`\n📊 측정 시작: ${pageConfig.name}`);

          // 3회 측정
          const measurements = await measureMultipleTimes(
            async () => {
              // 새 탭처럼 캐시 없이 측정하기 위해 페이지 새로고침
              return measurePageLoad(
                page,
                pageConfig.path,
                pageConfig.loadCompleteSelector,
                pageConfig.dataLoadedSelector
              );
            },
            MEASUREMENT_COUNT,
            COOLDOWN
          );

          // 통계 계산
          const aggregated = aggregatePageMetrics(pageConfig, measurements);
          allResults.push(aggregated);

          // 콘솔 출력
          logPageMetrics(pageConfig, aggregated);
        });
      }
    });
  }

  // 모든 테스트 완료 후 리포트 생성
  test.afterAll(async () => {
    console.log('\n📝 리포트 생성 중...');

    const outputDir = path.resolve(__dirname, '../reports');

    const report = generateReport(allResults, [], {
      baseUrl: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
      environment: process.env.CI ? 'CI' : 'local',
      measurementCount: MEASUREMENT_COUNT,
    });

    await saveReports(report, outputDir, 'page-load');

    console.log(`\n✅ 리포트 저장 완료: ${outputDir}`);
    console.log(`   - page-load-report.json`);
    console.log(`   - page-load-report.html`);
  });
});

// ==================== 헬퍼 함수 ====================

/**
 * 역할 이름 변환
 */
function getRoleName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    manufacturer: '제조사',
    distributor: '유통사',
    hospital: '병원',
    admin: '관리자',
  };
  return names[role];
}

/**
 * 페이지 측정 결과 집계
 */
function aggregatePageMetrics(
  pageConfig: PageConfig,
  measurements: Omit<PageLoadMetrics, 'pageId' | 'pageName' | 'category'>[]
): AggregatedPageMetrics {
  // 초기 렌더링 시간
  const initialRenderTimes = measurements.map((m) => m.initialRender.duration);

  // 데이터 로딩 시간 (있는 경우만)
  const dataLoadTimes = measurements.filter((m) => m.dataLoad).map((m) => m.dataLoad!.duration);

  // Navigation Timing 통계
  const navigationTiming: NavigationTimingStatistics = {
    domContentLoaded: calculateStatistics(measurements.map((m) => m.navigationTiming.domContentLoaded)),
    loadComplete: calculateStatistics(measurements.map((m) => m.navigationTiming.loadComplete)),
  };

  // FCP (있는 경우)
  const fcpTimes = measurements
    .filter((m) => m.navigationTiming.firstContentfulPaint !== undefined)
    .map((m) => m.navigationTiming.firstContentfulPaint!);
  if (fcpTimes.length > 0) {
    navigationTiming.firstContentfulPaint = calculateStatistics(fcpTimes);
  }

  // LCP (있는 경우)
  const lcpTimes = measurements
    .filter((m) => m.navigationTiming.largestContentfulPaint !== undefined)
    .map((m) => m.navigationTiming.largestContentfulPaint!);
  if (lcpTimes.length > 0) {
    navigationTiming.largestContentfulPaint = calculateStatistics(lcpTimes);
  }

  return {
    pageId: pageConfig.id,
    pageName: pageConfig.name,
    category: pageConfig.category,
    initialRender: calculateStatistics(initialRenderTimes),
    dataLoad: dataLoadTimes.length > 0 ? calculateStatistics(dataLoadTimes) : undefined,
    navigationTiming,
  };
}

/**
 * 페이지 측정 결과 로깅
 */
function logPageMetrics(pageConfig: PageConfig, aggregated: AggregatedPageMetrics): void {
  console.log(`\n📈 [${pageConfig.name}] 측정 결과:`);
  console.log(
    `   초기 렌더링: ${aggregated.initialRender.avg.toFixed(0)}ms (min: ${aggregated.initialRender.min.toFixed(0)}ms, max: ${aggregated.initialRender.max.toFixed(0)}ms)`
  );

  if (aggregated.dataLoad) {
    console.log(
      `   데이터 로딩: ${aggregated.dataLoad.avg.toFixed(0)}ms (min: ${aggregated.dataLoad.min.toFixed(0)}ms, max: ${aggregated.dataLoad.max.toFixed(0)}ms)`
    );
  }

  if (aggregated.navigationTiming.firstContentfulPaint) {
    console.log(`   FCP: ${aggregated.navigationTiming.firstContentfulPaint.avg.toFixed(0)}ms`);
  }

  // 성능 경고
  if (aggregated.initialRender.avg > 3000) {
    console.log(`   ⚠️ 경고: 초기 렌더링 시간이 3초를 초과합니다!`);
  }
}
