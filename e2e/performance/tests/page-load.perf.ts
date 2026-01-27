/**
 * 페이지 로딩 시간 측정 테스트
 * 각 페이지별로 3회 측정하여 통계 분석
 */

import { test } from '@playwright/test';
import { ROLES, getPagesByRole, type UserRole, type PageConfig } from '../config/pages.config';
import { measurePageLoad, measureMultipleTimes, type PageLoadMetrics } from '../utils/metrics';
import {
  calculateStatistics,
  type AggregatedPageMetrics,
  type NavigationTimingStatistics,
} from '../utils/statistics';
import { generateReport, saveReports } from '../utils/report-generator';
import { getAuthFile } from '../global-setup';
import * as path from 'path';
import * as fs from 'fs';

/** 측정 횟수 (워밍업 포함) */
const MEASUREMENT_COUNT = 5;

/** 워밍업 측정 횟수 (통계에서 제외) */
const WARMUP_COUNT = 1;

/** 실제 통계에 사용되는 측정 횟수 */
const EFFECTIVE_MEASUREMENT_COUNT = MEASUREMENT_COUNT - WARMUP_COUNT;

/** 측정 간 대기 시간 (ms) */
const COOLDOWN = 1000;

/** 임시 결과 파일 경로 (파일 기반으로 결과 누적) */
const TEMP_RESULTS_FILE = path.resolve(__dirname, '../reports/.temp-results.json');

/** 실행 ID 파일 (실행 시작 시 한 번 생성되어 전 테스트에 공유) */
const RUN_ID_FILE = path.resolve(__dirname, '../reports/.run-id');

/**
 * 현재 실행 ID 가져오기 (없으면 생성)
 * 환경변수 PERF_RUN_ID 우선, 없으면 파일 기반
 */
function getRunId(): string {
  // 환경변수로 지정된 경우 (테스트 시작 시 한 번만 설정)
  if (process.env.PERF_RUN_ID) {
    return process.env.PERF_RUN_ID;
  }

  // 파일 기반 실행 ID
  if (fs.existsSync(RUN_ID_FILE)) {
    const content = fs.readFileSync(RUN_ID_FILE, 'utf-8').trim();
    // 10분 이내 생성된 ID면 재사용
    const idTime = parseInt(content, 10);
    if (!isNaN(idTime) && Date.now() - idTime < 10 * 60 * 1000) {
      return content;
    }
  }

  // 새 ID 생성
  const newId = Date.now().toString();
  fs.writeFileSync(RUN_ID_FILE, newId, 'utf-8');
  return newId;
}

interface TempResults {
  runId: string;
  results: AggregatedPageMetrics[];
}

/**
 * 임시 결과 파일에 결과 추가
 */
function appendResult(result: AggregatedPageMetrics): void {
  const runId = getRunId();
  let data: TempResults = { runId, results: [] };

  if (fs.existsSync(TEMP_RESULTS_FILE)) {
    try {
      const existing: TempResults = JSON.parse(fs.readFileSync(TEMP_RESULTS_FILE, 'utf-8'));
      // 같은 실행 ID면 결과 누적
      if (existing.runId === runId) {
        data = existing;
      }
      // 다른 실행 ID면 새로 시작 (이미 빈 data로 초기화됨)
    } catch {
      // 파싱 실패 시 새로 시작
    }
  }

  data.results.push(result);
  fs.writeFileSync(TEMP_RESULTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * 임시 결과 파일에서 모든 결과 읽기
 */
function readAllResults(): AggregatedPageMetrics[] {
  if (!fs.existsSync(TEMP_RESULTS_FILE)) {
    return [];
  }

  try {
    const data: TempResults = JSON.parse(fs.readFileSync(TEMP_RESULTS_FILE, 'utf-8'));
    return data.results;
  } catch {
    return [];
  }
}

/**
 * 임시 결과 파일 정리
 */
function clearTempResults(): void {
  if (fs.existsSync(TEMP_RESULTS_FILE)) {
    fs.unlinkSync(TEMP_RESULTS_FILE);
  }
  if (fs.existsSync(RUN_ID_FILE)) {
    fs.unlinkSync(RUN_ID_FILE);
  }
}

// 역할별로 독립 실행 가능하도록 serial 제거
// 하나의 역할 테스트가 실패해도 다른 역할 테스트는 계속 진행됨
test.describe('페이지 로딩 성능 측정', () => {
  // 역할별로 테스트 그룹 생성
  for (const role of ROLES) {
    const pages = getPagesByRole(role);
    const authFile = getAuthFile(role);

    test.describe(`${getRoleName(role)} 페이지`, () => {
      // globalSetup에서 생성된 인증 파일 사용
      // 로그인 횟수: 22회 → 4회 (역할당 1회)
      test.use({ storageState: authFile });

      for (const pageConfig of pages) {
        test(`[${pageConfig.name}] 로딩 시간 측정 (${EFFECTIVE_MEASUREMENT_COUNT}회 + warmup ${WARMUP_COUNT}회)`, async ({ page }) => {
          console.log(`\n📊 측정 시작: ${pageConfig.name}`);
          console.log(`   (워밍업 ${WARMUP_COUNT}회 + 실측정 ${EFFECTIVE_MEASUREMENT_COUNT}회)`);

          // 전체 측정 (워밍업 포함)
          const allMeasurements = await measureMultipleTimes(
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

          // 워밍업 측정 제외 (첫 N회 제거)
          const warmupMeasurements = allMeasurements.slice(0, WARMUP_COUNT);
          const effectiveMeasurements = allMeasurements.slice(WARMUP_COUNT);

          // 워밍업 결과 로깅
          for (let i = 0; i < warmupMeasurements.length; i++) {
            const m = warmupMeasurements[i]!;
            console.log(`   🔥 워밍업 #${i + 1}: ${m.initialRender.duration}ms (통계 제외)`);
          }

          // 통계 계산 (워밍업 제외된 측정값만 사용)
          const aggregated = aggregatePageMetrics(pageConfig, effectiveMeasurements);

          // 파일에 결과 추가 (모듈 변수 대신 파일 기반 누적)
          appendResult(aggregated);

          // 콘솔 출력
          logPageMetrics(pageConfig, aggregated);
        });
      }
    });
  }

  // 마지막에 리포트 생성 테스트 (모든 측정 완료 후 실행)
  test.describe('리포트 생성', () => {
    test('최종 리포트 생성', async () => {
      console.log('\n📝 리포트 생성 중...');

      const outputDir = path.resolve(__dirname, '../reports');

      // 환경 변수로 리포트 variant 지정 (예: PERF_VARIANT=after)
      // 미지정 시 타임스탬프 사용
      const suffix = process.env.PERF_VARIANT ||
        new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

      // 파일에서 모든 결과 읽기
      const allResults = readAllResults();
      console.log(`📊 수집된 페이지 수: ${allResults.length}`);

      if (allResults.length === 0) {
        console.log('⚠️ 수집된 결과가 없습니다. 측정 테스트가 모두 실패했거나 아직 실행 전입니다.');
      }

      const report = generateReport(allResults, [], {
        baseUrl: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
        environment: process.env.CI ? 'CI' : 'local',
        measurementCount: EFFECTIVE_MEASUREMENT_COUNT,
        warmupCount: WARMUP_COUNT,
      });

      const { jsonPath, htmlPath } = await saveReports(report, outputDir, 'page-load', { suffix });

      console.log(`\n✅ 리포트 저장 완료:`);
      console.log(`   - ${path.basename(jsonPath)}`);
      console.log(`   - ${path.basename(htmlPath)}`);

      // 임시 파일 정리
      clearTempResults();
    });
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

  // 초기 렌더링 - 이상치 여부에 따라 trimmedAvg 강조
  const renderStats = aggregated.initialRender;
  if (renderStats.hasOutlier) {
    console.log(
      `   초기 렌더링: ${renderStats.trimmedAvg.toFixed(0)}ms (절사평균) ⚠️ 이상치 감지`
    );
    console.log(
      `                avg: ${renderStats.avg.toFixed(0)}ms, min: ${renderStats.min.toFixed(0)}ms, max: ${renderStats.max.toFixed(0)}ms`
    );
  } else {
    console.log(
      `   초기 렌더링: ${renderStats.avg.toFixed(0)}ms (min: ${renderStats.min.toFixed(0)}ms, max: ${renderStats.max.toFixed(0)}ms)`
    );
  }

  // 데이터 로딩 - 이상치 여부에 따라 trimmedAvg 강조
  if (aggregated.dataLoad) {
    const dataStats = aggregated.dataLoad;
    if (dataStats.hasOutlier) {
      console.log(
        `   데이터 로딩: ${dataStats.trimmedAvg.toFixed(0)}ms (절사평균) ⚠️ 이상치 감지`
      );
      console.log(
        `                avg: ${dataStats.avg.toFixed(0)}ms, min: ${dataStats.min.toFixed(0)}ms, max: ${dataStats.max.toFixed(0)}ms`
      );
    } else {
      console.log(
        `   데이터 로딩: ${dataStats.avg.toFixed(0)}ms (min: ${dataStats.min.toFixed(0)}ms, max: ${dataStats.max.toFixed(0)}ms)`
      );
    }
  }

  if (aggregated.navigationTiming.firstContentfulPaint) {
    console.log(`   FCP: ${aggregated.navigationTiming.firstContentfulPaint.avg.toFixed(0)}ms`);
  }

  // 성능 경고 - trimmedAvg 사용
  const effectiveAvg = renderStats.hasOutlier ? renderStats.trimmedAvg : renderStats.avg;
  if (effectiveAvg > 3000) {
    console.log(`   ⚠️ 경고: 초기 렌더링 시간이 3초를 초과합니다!`);
  }
}
