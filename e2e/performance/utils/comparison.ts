/**
 * 성능 리포트 비교 유틸리티
 * Before/After 리포트를 비교하여 개선/악화 분석
 */

import * as fs from 'fs';
import * as path from 'path';
import type { PerformanceReport, ReportMetadata } from './report-generator';

// ==================== 타입 정의 ====================

export interface MetricDelta {
  /** 밀리초 단위 차이 (음수 = 개선) */
  ms: number;
  /** 백분율 변화 (음수 = 개선) */
  percent: number;
}

export interface PageComparisonResult {
  pageId: string;
  pageName: string;
  category: string;
  before: {
    initialRender: number;
    dataLoad?: number;
  };
  after: {
    initialRender: number;
    dataLoad?: number;
  };
  delta: {
    initialRender: MetricDelta;
    dataLoad?: MetricDelta;
  };
  /** 개선되었는지 여부 (initialRender 기준) */
  improved: boolean;
  /** 악화되었는지 여부 (10% 이상 증가) */
  regressed: boolean;
}

export interface ComparisonSummary {
  totalPages: number;
  improvedCount: number;
  regressedCount: number;
  unchangedCount: number;
  totalInitialRenderDelta: MetricDelta;
  mostImproved?: { pageName: string; delta: MetricDelta };
  mostRegressed?: { pageName: string; delta: MetricDelta };
}

export interface ComparisonReport {
  beforeMeta: ReportMetadata;
  afterMeta: ReportMetadata;
  pageResults: PageComparisonResult[];
  summary: ComparisonSummary;
}

// ==================== 비교 함수 ====================

/**
 * 두 리포트 파일을 비교
 */
export function compareReportFiles(
  beforePath: string,
  afterPath: string
): ComparisonReport {
  const beforeReport = JSON.parse(fs.readFileSync(beforePath, 'utf-8')) as PerformanceReport;
  const afterReport = JSON.parse(fs.readFileSync(afterPath, 'utf-8')) as PerformanceReport;

  return compareReports(beforeReport, afterReport);
}

/**
 * 두 리포트 객체를 비교
 */
export function compareReports(
  before: PerformanceReport,
  after: PerformanceReport
): ComparisonReport {
  // 페이지별 비교 결과 생성
  const pageResults: PageComparisonResult[] = [];

  // After 리포트의 페이지를 기준으로 비교
  // 이상치 감지 시 trimmedAvg 사용, 아니면 avg 사용
  for (const afterPage of after.pageMetrics) {
    const beforePage = before.pageMetrics.find((p) => p.pageId === afterPage.pageId);

    if (!beforePage) {
      // Before에 없는 새 페이지는 건너뜀
      continue;
    }

    // 이상치 감지 시 trimmedAvg 사용 (있는 경우에만)
    const beforeInitialRender = beforePage.initialRender.hasOutlier
      ? beforePage.initialRender.trimmedAvg
      : beforePage.initialRender.avg;
    const afterInitialRender = afterPage.initialRender.hasOutlier
      ? afterPage.initialRender.trimmedAvg
      : afterPage.initialRender.avg;

    const initialRenderDelta = calculateDelta(beforeInitialRender, afterInitialRender);

    // 데이터 로딩도 동일하게 처리
    let dataLoadDelta: MetricDelta | undefined;
    let beforeDataLoad: number | undefined;
    let afterDataLoad: number | undefined;

    if (beforePage.dataLoad && afterPage.dataLoad) {
      beforeDataLoad = beforePage.dataLoad.hasOutlier
        ? beforePage.dataLoad.trimmedAvg
        : beforePage.dataLoad.avg;
      afterDataLoad = afterPage.dataLoad.hasOutlier
        ? afterPage.dataLoad.trimmedAvg
        : afterPage.dataLoad.avg;
      dataLoadDelta = calculateDelta(beforeDataLoad, afterDataLoad);
    }

    pageResults.push({
      pageId: afterPage.pageId,
      pageName: afterPage.pageName,
      category: afterPage.category,
      before: {
        initialRender: beforeInitialRender,
        dataLoad: beforeDataLoad,
      },
      after: {
        initialRender: afterInitialRender,
        dataLoad: afterDataLoad,
      },
      delta: {
        initialRender: initialRenderDelta,
        dataLoad: dataLoadDelta,
      },
      improved: initialRenderDelta.percent < -5, // 5% 이상 감소 = 개선
      regressed: initialRenderDelta.percent > 10, // 10% 이상 증가 = 악화
    });
  }

  // 요약 계산
  const summary = calculateSummary(pageResults);

  return {
    beforeMeta: before.metadata,
    afterMeta: after.metadata,
    pageResults,
    summary,
  };
}

/**
 * 메트릭 델타 계산
 */
function calculateDelta(before: number, after: number): MetricDelta {
  const ms = after - before;
  const percent = before > 0 ? ((after - before) / before) * 100 : 0;

  return {
    ms: Math.round(ms),
    percent: Math.round(percent * 10) / 10, // 소수점 1자리
  };
}

/**
 * 요약 통계 계산
 */
function calculateSummary(results: PageComparisonResult[]): ComparisonSummary {
  const improvedPages = results.filter((r) => r.improved);
  const regressedPages = results.filter((r) => r.regressed);
  const unchangedPages = results.filter((r) => !r.improved && !r.regressed);

  // 총 initialRender 델타
  const totalBeforeMs = results.reduce((sum, r) => sum + r.before.initialRender, 0);
  const totalAfterMs = results.reduce((sum, r) => sum + r.after.initialRender, 0);
  const totalDelta = calculateDelta(totalBeforeMs, totalAfterMs);

  // 가장 많이 개선된 페이지
  const sortedByImprovement = [...results].sort(
    (a, b) => a.delta.initialRender.percent - b.delta.initialRender.percent
  );
  const mostImproved = sortedByImprovement[0];
  const mostRegressed = sortedByImprovement[sortedByImprovement.length - 1];

  return {
    totalPages: results.length,
    improvedCount: improvedPages.length,
    regressedCount: regressedPages.length,
    unchangedCount: unchangedPages.length,
    totalInitialRenderDelta: totalDelta,
    mostImproved:
      mostImproved && mostImproved.delta.initialRender.percent < 0
        ? { pageName: mostImproved.pageName, delta: mostImproved.delta.initialRender }
        : undefined,
    mostRegressed:
      mostRegressed && mostRegressed.delta.initialRender.percent > 0
        ? { pageName: mostRegressed.pageName, delta: mostRegressed.delta.initialRender }
        : undefined,
  };
}

// ==================== HTML 리포트 생성 ====================

/**
 * 비교 리포트 HTML 생성
 */
export function generateComparisonHtml(report: ComparisonReport): string {
  const { beforeMeta, afterMeta, pageResults, summary } = report;

  const rows = pageResults
    .sort((a, b) => a.delta.initialRender.percent - b.delta.initialRender.percent)
    .map((r) => {
      const statusClass = r.improved ? 'improved' : r.regressed ? 'regressed' : '';
      const deltaClass = r.delta.initialRender.ms < 0 ? 'positive' : r.delta.initialRender.ms > 0 ? 'negative' : '';
      const statusIcon = r.improved ? '✅' : r.regressed ? '❌' : '➖';

      return `
        <tr class="${statusClass}">
          <td><strong>${r.pageName}</strong></td>
          <td><span class="category-badge">${r.category}</span></td>
          <td>${r.before.initialRender.toFixed(0)}ms</td>
          <td>${r.after.initialRender.toFixed(0)}ms</td>
          <td class="${deltaClass}">
            ${r.delta.initialRender.ms > 0 ? '+' : ''}${r.delta.initialRender.ms}ms
            (${r.delta.initialRender.percent > 0 ? '+' : ''}${r.delta.initialRender.percent}%)
          </td>
          <td>${statusIcon}</td>
        </tr>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>성능 비교 리포트</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f8fafc;
      color: #1e293b;
      line-height: 1.6;
      padding: 24px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    h2 { font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #334155; }
    .subtitle { color: #64748b; margin-bottom: 24px; }
    .card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: #f1f5f9;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #0f172a;
    }
    .stat-value.positive { color: #10b981; }
    .stat-value.negative { color: #ef4444; }
    .stat-label { font-size: 14px; color: #64748b; margin-top: 4px; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th, td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      background: #f8fafc;
      font-weight: 600;
      color: #475569;
    }
    tr:hover { background: #f8fafc; }
    tr.improved { background: #f0fdf4; }
    tr.regressed { background: #fef2f2; }
    .category-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      background: #e2e8f0;
      color: #475569;
    }
    .positive { color: #10b981; font-weight: 600; }
    .negative { color: #ef4444; font-weight: 600; }
    .meta {
      font-size: 12px;
      color: #94a3b8;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .meta-section h3 { font-size: 14px; color: #64748b; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>성능 비교 리포트</h1>
    <p class="subtitle">Before vs After 성능 측정 비교</p>

    <!-- 요약 통계 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${summary.totalPages}</div>
        <div class="stat-label">비교 페이지</div>
      </div>
      <div class="stat-card">
        <div class="stat-value positive">${summary.improvedCount}</div>
        <div class="stat-label">개선됨</div>
      </div>
      <div class="stat-card">
        <div class="stat-value negative">${summary.regressedCount}</div>
        <div class="stat-label">악화됨</div>
      </div>
      <div class="stat-card">
        <div class="stat-value ${summary.totalInitialRenderDelta.ms < 0 ? 'positive' : 'negative'}">
          ${summary.totalInitialRenderDelta.ms > 0 ? '+' : ''}${summary.totalInitialRenderDelta.ms}ms
        </div>
        <div class="stat-label">총 변화 (${summary.totalInitialRenderDelta.percent > 0 ? '+' : ''}${summary.totalInitialRenderDelta.percent}%)</div>
      </div>
    </div>

    <!-- 페이지별 비교 -->
    <div class="card">
      <h2>페이지별 비교</h2>
      <table>
        <thead>
          <tr>
            <th>페이지</th>
            <th>카테고리</th>
            <th>Before</th>
            <th>After</th>
            <th>변화</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <!-- 메타 정보 -->
    <div class="card meta">
      <div class="meta-grid">
        <div class="meta-section">
          <h3>Before 리포트</h3>
          <p>생성: ${formatDate(beforeMeta.generatedAt)}</p>
          <p>환경: ${beforeMeta.environment}</p>
        </div>
        <div class="meta-section">
          <h3>After 리포트</h3>
          <p>생성: ${formatDate(afterMeta.generatedAt)}</p>
          <p>환경: ${afterMeta.environment}</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 날짜 포맷팅
 */
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 비교 리포트 저장
 */
export function saveComparisonReport(
  report: ComparisonReport,
  outputDir: string
): { jsonPath: string; htmlPath: string } {
  fs.mkdirSync(outputDir, { recursive: true });

  const jsonPath = path.join(outputDir, 'comparison-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8');

  const htmlPath = path.join(outputDir, 'comparison-report.html');
  const html = generateComparisonHtml(report);
  fs.writeFileSync(htmlPath, html, 'utf-8');

  return { jsonPath, htmlPath };
}

/**
 * 콘솔에 요약 출력
 */
export function printComparisonSummary(report: ComparisonReport): void {
  const { summary, pageResults } = report;

  console.log('\n' + '='.repeat(70));
  console.log('                      성능 비교 결과');
  console.log('='.repeat(70));

  console.log(`\n📊 요약:`);
  console.log(`   비교 페이지: ${summary.totalPages}개`);
  console.log(`   ✅ 개선: ${summary.improvedCount}개`);
  console.log(`   ❌ 악화: ${summary.regressedCount}개`);
  console.log(`   ➖ 변화 없음: ${summary.unchangedCount}개`);
  console.log(
    `   총 변화: ${summary.totalInitialRenderDelta.ms > 0 ? '+' : ''}${summary.totalInitialRenderDelta.ms}ms (${summary.totalInitialRenderDelta.percent > 0 ? '+' : ''}${summary.totalInitialRenderDelta.percent}%)`
  );

  if (summary.mostImproved) {
    console.log(`\n🏆 가장 많이 개선: ${summary.mostImproved.pageName}`);
    console.log(`   ${summary.mostImproved.delta.ms}ms (${summary.mostImproved.delta.percent}%)`);
  }

  if (summary.mostRegressed) {
    console.log(`\n⚠️ 가장 많이 악화: ${summary.mostRegressed.pageName}`);
    console.log(`   +${summary.mostRegressed.delta.ms}ms (+${summary.mostRegressed.delta.percent}%)`);
  }

  console.log('\n' + '-'.repeat(70));
  console.log('페이지별 상세:');
  console.log('-'.repeat(70));

  // 정렬: 개선된 것 먼저
  const sorted = [...pageResults].sort(
    (a, b) => a.delta.initialRender.percent - b.delta.initialRender.percent
  );

  for (const r of sorted) {
    const icon = r.improved ? '✅' : r.regressed ? '❌' : '➖';
    const delta = r.delta.initialRender;
    console.log(
      `${icon} ${r.pageName.padEnd(25)} ${r.before.initialRender.toFixed(0).padStart(6)}ms → ${r.after.initialRender.toFixed(0).padStart(6)}ms  (${delta.ms > 0 ? '+' : ''}${delta.ms}ms, ${delta.percent > 0 ? '+' : ''}${delta.percent}%)`
    );
  }

  console.log('\n' + '='.repeat(70));
}
