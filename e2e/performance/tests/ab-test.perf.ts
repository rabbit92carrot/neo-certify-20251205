/**
 * A/B 성능 비교 테스트
 *
 * Back-to-back 측정 방식으로 환경 변수 영향을 최소화하고
 * 통계적으로 유의미한 성능 차이를 검출합니다.
 *
 * 사용법:
 *   npx playwright test e2e/performance/tests/ab-test.perf.ts
 *
 * 환경 변수:
 *   AB_PAGE_ID: 테스트할 페이지 ID (기본: hospital-inventory)
 *   AB_PAIRS: 측정 쌍 수 (기본: 10)
 *   AB_COOLDOWN: 측정 간 대기 시간 ms (기본: 2000)
 */

import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { PAGES, type PageConfig } from '../config/pages.config';
import { measurePageLoad } from '../utils/metrics';
import { getAuthFile } from '../global-setup';
import {
  pairedTTest,
  calculateDescriptiveStats,
  formatTTestResult,
  type TTestResult,
  type DescriptiveStats,
} from '../utils/statistics-advanced';

// ==================== 설정 ====================

/** 측정 쌍 수 (각 variant당 측정 횟수) */
const PAIRS = parseInt(process.env.AB_PAIRS || '10', 10);

/** 측정 간 대기 시간 (ms) */
const COOLDOWN = parseInt(process.env.AB_COOLDOWN || '2000', 10);

/** 워밍업 횟수 */
const WARMUP_COUNT = 2;

/** 테스트할 페이지 ID */
const TARGET_PAGE_ID = process.env.AB_PAGE_ID || 'hospital-inventory';

/** 기본 URL */
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// ==================== 타입 정의 ====================

interface ABMeasurement {
  variantA: number[];
  variantB: number[];
}

interface ABTestResult {
  pageId: string;
  pageName: string;
  measurements: ABMeasurement;
  statsA: DescriptiveStats;
  statsB: DescriptiveStats;
  tTestResult: TTestResult;
  metadata: {
    pairs: number;
    cooldown: number;
    warmupCount: number;
    timestamp: string;
    baseUrl: string;
  };
}

// ==================== 유틸리티 ====================

/**
 * 페이지 설정 가져오기
 */
function getPageConfig(pageId: string): PageConfig | undefined {
  return PAGES.find((p) => p.id === pageId);
}

/**
 * A/B 테스트 결과 저장
 */
function saveABTestResult(result: ABTestResult): void {
  const outputDir = path.join(__dirname, '../reports');
  fs.mkdirSync(outputDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `ab-test-${result.pageId}-${timestamp}`;

  // JSON 저장
  const jsonPath = path.join(outputDir, `${filename}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');

  // HTML 리포트 저장
  const htmlPath = path.join(outputDir, `${filename}.html`);
  const html = generateABTestHtml(result);
  fs.writeFileSync(htmlPath, html, 'utf-8');

  console.log(`\n📄 리포트 저장:`);
  console.log(`   - ${jsonPath}`);
  console.log(`   - ${htmlPath}`);
}

/**
 * A/B 테스트 HTML 리포트 생성
 */
function generateABTestHtml(result: ABTestResult): string {
  const { statsA, statsB, tTestResult } = result;
  const improved = tTestResult.meanDifference < 0;
  const changePercent = ((tTestResult.meanDifference / statsA.mean) * 100).toFixed(1);

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>A/B 테스트 결과 - ${result.pageName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
      line-height: 1.6;
    }
    .container { max-width: 900px; margin: 0 auto; }
    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 24px;
      margin-bottom: 20px;
    }
    h1 { font-size: 24px; margin-bottom: 8px; }
    h2 { font-size: 18px; margin-bottom: 16px; color: #333; }
    .subtitle { color: #666; font-size: 14px; margin-bottom: 20px; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .stat-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
    }
    .stat-card h3 { font-size: 14px; color: #666; margin-bottom: 8px; }
    .stat-value { font-size: 28px; font-weight: bold; }
    .stat-detail { font-size: 12px; color: #888; margin-top: 4px; }
    .result-box {
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .result-improved { background: #d4edda; border: 1px solid #28a745; }
    .result-regressed { background: #f8d7da; border: 1px solid #dc3545; }
    .result-neutral { background: #fff3cd; border: 1px solid #ffc107; }
    .metric-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .metric-row:last-child { border-bottom: none; }
    .metric-label { color: #666; }
    .metric-value { font-weight: 500; }
    .significant { color: #28a745; font-weight: bold; }
    .not-significant { color: #dc3545; }
    .chart-container { margin: 20px 0; }
    .bar-chart {
      display: flex;
      align-items: flex-end;
      height: 200px;
      gap: 40px;
      justify-content: center;
      padding: 20px;
    }
    .bar-group { text-align: center; }
    .bar {
      width: 80px;
      background: #4a90d9;
      border-radius: 4px 4px 0 0;
      margin: 0 auto;
      position: relative;
    }
    .bar-b { background: #50c878; }
    .bar-label {
      position: absolute;
      top: -25px;
      left: 50%;
      transform: translateX(-50%);
      font-weight: bold;
      font-size: 14px;
    }
    .bar-name { margin-top: 8px; font-size: 14px; color: #666; }
    footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>A/B 테스트 결과</h1>
      <p class="subtitle">페이지: ${result.pageName} (${result.pageId})</p>

      <div class="result-box ${
        !tTestResult.significant
          ? 'result-neutral'
          : improved
            ? 'result-improved'
            : 'result-regressed'
      }">
        <h2>
          ${
            !tTestResult.significant
              ? '⚖️ 통계적으로 유의미한 차이 없음'
              : improved
                ? `✅ Variant B가 ${Math.abs(parseFloat(changePercent))}% 개선`
                : `❌ Variant B가 ${Math.abs(parseFloat(changePercent))}% 악화`
          }
        </h2>
        <p>
          평균 차이: ${tTestResult.meanDifference.toFixed(1)}ms
          (95% CI: [${tTestResult.confidenceInterval[0].toFixed(1)}, ${tTestResult.confidenceInterval[1].toFixed(1)}])
        </p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <h3>Variant A (기준)</h3>
          <div class="stat-value">${statsA.mean.toFixed(0)}ms</div>
          <div class="stat-detail">± ${statsA.standardDeviation.toFixed(1)}ms (SD)</div>
          <div class="stat-detail">범위: ${statsA.min.toFixed(0)} - ${statsA.max.toFixed(0)}ms</div>
        </div>
        <div class="stat-card">
          <h3>Variant B (비교)</h3>
          <div class="stat-value">${statsB.mean.toFixed(0)}ms</div>
          <div class="stat-detail">± ${statsB.standardDeviation.toFixed(1)}ms (SD)</div>
          <div class="stat-detail">범위: ${statsB.min.toFixed(0)} - ${statsB.max.toFixed(0)}ms</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>📊 통계 분석</h2>
      <div class="metric-row">
        <span class="metric-label">표본 크기</span>
        <span class="metric-value">${tTestResult.sampleSize}쌍</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">t-통계량</span>
        <span class="metric-value">${tTestResult.tStatistic.toFixed(3)}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">p-value</span>
        <span class="metric-value ${tTestResult.significant ? 'significant' : 'not-significant'}">
          ${tTestResult.pValue.toFixed(4)}${tTestResult.pValue < 0.01 ? ' **' : tTestResult.pValue < 0.05 ? ' *' : ''}
        </span>
      </div>
      <div class="metric-row">
        <span class="metric-label">95% 신뢰구간</span>
        <span class="metric-value">[${tTestResult.confidenceInterval[0].toFixed(1)}, ${tTestResult.confidenceInterval[1].toFixed(1)}]ms</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Cohen's d (효과크기)</span>
        <span class="metric-value">${tTestResult.effectSize.toFixed(2)} (${tTestResult.effectInterpretation})</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">유의성 (α=0.05)</span>
        <span class="metric-value ${tTestResult.significant ? 'significant' : 'not-significant'}">
          ${tTestResult.significant ? '유의함 ✓' : '유의하지 않음 ✗'}
        </span>
      </div>
    </div>

    <div class="card">
      <h2>📈 시각화</h2>
      <div class="chart-container">
        <div class="bar-chart">
          <div class="bar-group">
            <div class="bar" style="height: ${(statsA.mean / Math.max(statsA.mean, statsB.mean)) * 150}px;">
              <span class="bar-label">${statsA.mean.toFixed(0)}ms</span>
            </div>
            <div class="bar-name">Variant A</div>
          </div>
          <div class="bar-group">
            <div class="bar bar-b" style="height: ${(statsB.mean / Math.max(statsA.mean, statsB.mean)) * 150}px;">
              <span class="bar-label">${statsB.mean.toFixed(0)}ms</span>
            </div>
            <div class="bar-name">Variant B</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>⚙️ 측정 설정</h2>
      <div class="metric-row">
        <span class="metric-label">측정 쌍 수</span>
        <span class="metric-value">${result.metadata.pairs}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">워밍업 횟수</span>
        <span class="metric-value">${result.metadata.warmupCount}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">측정 간 대기</span>
        <span class="metric-value">${result.metadata.cooldown}ms</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">측정 시각</span>
        <span class="metric-value">${result.metadata.timestamp}</span>
      </div>
    </div>

    <footer>
      Generated by Neo-Certify A/B Performance Test
    </footer>
  </div>
</body>
</html>`;
}

// ==================== 테스트 ====================

test.describe('A/B 성능 비교 테스트', () => {
  test.describe.configure({ mode: 'serial' });

  const pageConfig = getPageConfig(TARGET_PAGE_ID);

  test.beforeAll(() => {
    if (!pageConfig) {
      throw new Error(`페이지 설정을 찾을 수 없습니다: ${TARGET_PAGE_ID}`);
    }

    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                 A/B 성능 비교 테스트 시작');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📊 대상 페이지: ${pageConfig.name} (${pageConfig.id})`);
    console.log(`📏 측정 쌍 수: ${PAIRS}회`);
    console.log(`⏱️  측정 간 대기: ${COOLDOWN}ms`);
    console.log(`🔥 워밍업: ${WARMUP_COUNT}회`);
    console.log('═══════════════════════════════════════════════════════════\n');
  });

  test(`[${TARGET_PAGE_ID}] A/B 성능 비교 (${PAIRS}쌍)`, async ({ browser }) => {
    if (!pageConfig) {
      test.skip();
      return;
    }

    // 인증 상태 로드
    const authFile = getAuthFile(pageConfig.role);
    const context = await browser.newContext({
      storageState: authFile,
    });
    const page = await context.newPage();

    const url = `${BASE_URL}${pageConfig.path}`;

    // 측정 결과 저장
    const measurements: ABMeasurement = {
      variantA: [],
      variantB: [],
    };

    // ========== 워밍업 ==========
    console.log(`🔥 워밍업 시작 (${WARMUP_COUNT}회)...`);
    for (let i = 0; i < WARMUP_COUNT; i++) {
      const warmupResult = await measurePageLoad(
        page,
        url,
        pageConfig.loadCompleteSelector,
        pageConfig.dataLoadedSelector
      );
      console.log(`   워밍업 #${i + 1}: ${warmupResult.initialRender.duration}ms`);
      await page.waitForTimeout(COOLDOWN);
    }
    console.log('');

    // ========== Back-to-back 측정 ==========
    console.log(`📊 측정 시작 (${PAIRS}쌍, 교대 측정)...\n`);

    for (let pair = 0; pair < PAIRS; pair++) {
      // Variant A 측정
      const resultA = await measurePageLoad(
        page,
        url,
        pageConfig.loadCompleteSelector,
        pageConfig.dataLoadedSelector
      );
      measurements.variantA.push(resultA.initialRender.duration);

      await page.waitForTimeout(COOLDOWN);

      // Variant B 측정 (현재는 동일 페이지, 실제 A/B 테스트 시 feature flag로 분기)
      const resultB = await measurePageLoad(
        page,
        url,
        pageConfig.loadCompleteSelector,
        pageConfig.dataLoadedSelector
      );
      measurements.variantB.push(resultB.initialRender.duration);

      console.log(
        `   쌍 #${(pair + 1).toString().padStart(2, '0')}: A=${resultA.initialRender.duration}ms, B=${resultB.initialRender.duration}ms`
      );

      if (pair < PAIRS - 1) {
        await page.waitForTimeout(COOLDOWN);
      }
    }

    await context.close();

    // ========== 통계 분석 ==========
    console.log('\n📈 통계 분석 중...\n');

    const statsA = calculateDescriptiveStats(measurements.variantA);
    const statsB = calculateDescriptiveStats(measurements.variantB);
    const tTestResult = pairedTTest(measurements.variantA, measurements.variantB);

    // 결과 출력
    console.log(formatTTestResult(tTestResult, ['Variant A', 'Variant B']));

    // 결과 저장
    const result: ABTestResult = {
      pageId: pageConfig.id,
      pageName: pageConfig.name,
      measurements,
      statsA,
      statsB,
      tTestResult,
      metadata: {
        pairs: PAIRS,
        cooldown: COOLDOWN,
        warmupCount: WARMUP_COUNT,
        timestamp: new Date().toISOString(),
        baseUrl: BASE_URL,
      },
    };

    saveABTestResult(result);

    // 기본 검증 (p-value가 유효한 범위인지)
    expect(tTestResult.pValue).toBeGreaterThanOrEqual(0);
    expect(tTestResult.pValue).toBeLessThanOrEqual(1);
  });
});
