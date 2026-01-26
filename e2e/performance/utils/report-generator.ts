/**
 * 성능 측정 리포트 생성기
 * JSON 및 HTML 형식의 리포트 생성
 */

import * as fs from 'fs';
import * as path from 'path';
import type { AggregatedPageMetrics, AggregatedActionMetrics } from './statistics';

// ==================== 타입 정의 ====================

export interface ReportMetadata {
  generatedAt: string;
  measurementCount: number;
  baseUrl: string;
  environment: string;
}

export interface ThresholdViolation {
  type: 'page' | 'action';
  name: string;
  metric: string;
  value: number;
  threshold: number;
}

export interface ReportSummary {
  totalPages: number;
  totalActions: number;
  slowestPages: Array<{ name: string; avgTime: number }>;
  slowestActions: Array<{ name: string; avgTime: number }>;
  thresholdViolations: ThresholdViolation[];
}

export interface PerformanceReport {
  metadata: ReportMetadata;
  pageMetrics: AggregatedPageMetrics[];
  actionMetrics: AggregatedActionMetrics[];
  summary: ReportSummary;
}

export interface ReportConfig {
  baseUrl: string;
  environment: string;
  measurementCount: number;
}

// ==================== 임계값 정의 ====================

const PAGE_THRESHOLDS = {
  initialRender: 3000, // 3초
  dataLoad: 5000, // 5초
  domContentLoaded: 2000, // 2초
  loadComplete: 5000, // 5초
  firstContentfulPaint: 1800, // 1.8초
  largestContentfulPaint: 2500, // 2.5초
};

const ACTION_THRESHOLDS: Record<string, number> = {
  'stats-load': 2000,
  'table-load': 3000,
  'form-submit': 5000,
  'search-filter': 2000,
  pagination: 1500,
  'modal-open': 500,
  'expand-collapse': 300,
};

// ==================== 리포트 생성 함수 ====================

/**
 * 성능 리포트 생성
 */
export function generateReport(
  pageMetrics: AggregatedPageMetrics[],
  actionMetrics: AggregatedActionMetrics[],
  config: ReportConfig
): PerformanceReport {
  // 느린 페이지 식별 (상위 5개)
  const slowestPages = [...pageMetrics]
    .map((p) => ({ name: p.pageName, avgTime: p.initialRender.avg }))
    .sort((a, b) => b.avgTime - a.avgTime)
    .slice(0, 5);

  // 느린 동작 식별 (상위 5개)
  const slowestActions = [...actionMetrics]
    .map((a) => ({ name: a.actionName, avgTime: a.responseTime.avg }))
    .sort((a, b) => b.avgTime - a.avgTime)
    .slice(0, 5);

  // 임계값 위반 검사
  const thresholdViolations: ThresholdViolation[] = [];

  // 페이지 임계값 검사
  for (const page of pageMetrics) {
    if (page.initialRender.avg > PAGE_THRESHOLDS.initialRender) {
      thresholdViolations.push({
        type: 'page',
        name: page.pageName,
        metric: 'initialRender',
        value: page.initialRender.avg,
        threshold: PAGE_THRESHOLDS.initialRender,
      });
    }
    if (page.dataLoad && page.dataLoad.avg > PAGE_THRESHOLDS.dataLoad) {
      thresholdViolations.push({
        type: 'page',
        name: page.pageName,
        metric: 'dataLoad',
        value: page.dataLoad.avg,
        threshold: PAGE_THRESHOLDS.dataLoad,
      });
    }
  }

  // 동작 임계값 검사
  for (const action of actionMetrics) {
    const threshold = ACTION_THRESHOLDS[action.actionType];
    if (threshold && action.responseTime.avg > threshold) {
      thresholdViolations.push({
        type: 'action',
        name: action.actionName,
        metric: 'responseTime',
        value: action.responseTime.avg,
        threshold,
      });
    }
  }

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      measurementCount: config.measurementCount,
      baseUrl: config.baseUrl,
      environment: config.environment,
    },
    pageMetrics,
    actionMetrics,
    summary: {
      totalPages: pageMetrics.length,
      totalActions: actionMetrics.length,
      slowestPages,
      slowestActions,
      thresholdViolations,
    },
  };
}

/**
 * 리포트 저장 (JSON + HTML)
 */
export async function saveReports(
  report: PerformanceReport,
  outputDir: string,
  prefix: string
): Promise<void> {
  // 디렉토리 생성
  fs.mkdirSync(outputDir, { recursive: true });

  // JSON 저장
  const jsonPath = path.join(outputDir, `${prefix}-report.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8');

  // HTML 저장
  const htmlPath = path.join(outputDir, `${prefix}-report.html`);
  const html = generateHtmlReport(report);
  fs.writeFileSync(htmlPath, html, 'utf-8');
}

// ==================== HTML 리포트 생성 ====================

/**
 * HTML 리포트 생성
 */
function generateHtmlReport(report: PerformanceReport): string {
  const hasPages = report.pageMetrics.length > 0;
  const hasActions = report.actionMetrics.length > 0;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neo-Certify UI 성능 측정 리포트</title>
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
    .stat-value.warning { color: #f59e0b; }
    .stat-value.error { color: #ef4444; }
    .stat-value.success { color: #10b981; }
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
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 500;
    }
    .badge-good { background: #dcfce7; color: #166534; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-error { background: #fee2e2; color: #991b1b; }
    .category-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      background: #e2e8f0;
      color: #475569;
    }
    .violations-list { list-style: none; }
    .violations-list li {
      padding: 12px;
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      margin-bottom: 8px;
      border-radius: 0 8px 8px 0;
    }
    .meta {
      font-size: 12px;
      color: #94a3b8;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }
    .no-data { color: #94a3b8; font-style: italic; padding: 24px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Neo-Certify UI 성능 측정 리포트</h1>
    <p class="subtitle">생성: ${formatDate(report.metadata.generatedAt)} | 환경: ${report.metadata.environment} | 측정 횟수: ${report.metadata.measurementCount}회</p>

    <!-- 요약 통계 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${report.summary.totalPages}</div>
        <div class="stat-label">측정 페이지</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${report.summary.totalActions}</div>
        <div class="stat-label">측정 동작</div>
      </div>
      <div class="stat-card">
        <div class="stat-value ${report.summary.thresholdViolations.length > 0 ? 'error' : 'success'}">
          ${report.summary.thresholdViolations.length}
        </div>
        <div class="stat-label">임계값 초과</div>
      </div>
    </div>

    ${hasPages ? generatePageMetricsSection(report.pageMetrics) : ''}
    ${hasActions ? generateActionMetricsSection(report.actionMetrics) : ''}
    ${report.summary.thresholdViolations.length > 0 ? generateViolationsSection(report.summary.thresholdViolations) : ''}

    <div class="card meta">
      <p>Base URL: ${report.metadata.baseUrl}</p>
      <p>측정 횟수: ${report.metadata.measurementCount}회 (평균값 기준)</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 페이지 메트릭 섹션 생성
 */
function generatePageMetricsSection(pageMetrics: AggregatedPageMetrics[]): string {
  const rows = pageMetrics
    .map((p) => {
      const status = getStatusBadge(p.initialRender.avg, PAGE_THRESHOLDS.initialRender);
      return `
        <tr>
          <td><strong>${p.pageName}</strong></td>
          <td><span class="category-badge">${p.category}</span></td>
          <td><strong>${p.initialRender.avg.toFixed(0)}ms</strong></td>
          <td>${p.initialRender.min.toFixed(0)}ms</td>
          <td>${p.initialRender.max.toFixed(0)}ms</td>
          <td>${p.dataLoad ? p.dataLoad.avg.toFixed(0) + 'ms' : '-'}</td>
          <td>${status}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <div class="card">
      <h2>페이지 로딩 시간</h2>
      <table>
        <thead>
          <tr>
            <th>페이지</th>
            <th>카테고리</th>
            <th>초기 렌더링 (평균)</th>
            <th>최소</th>
            <th>최대</th>
            <th>데이터 로딩</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

/**
 * 동작 메트릭 섹션 생성
 */
function generateActionMetricsSection(actionMetrics: AggregatedActionMetrics[]): string {
  const rows = actionMetrics
    .map((a) => {
      const threshold = ACTION_THRESHOLDS[a.actionType] || 2000;
      const status = getStatusBadge(a.responseTime.avg, threshold);
      return `
        <tr>
          <td><strong>${a.actionName}</strong></td>
          <td><span class="category-badge">${a.actionType}</span></td>
          <td><strong>${a.responseTime.avg.toFixed(0)}ms</strong></td>
          <td>${a.responseTime.min.toFixed(0)}ms</td>
          <td>${a.responseTime.max.toFixed(0)}ms</td>
          <td>${threshold}ms</td>
          <td>${status}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <div class="card">
      <h2>동작 응답 시간</h2>
      <table>
        <thead>
          <tr>
            <th>동작</th>
            <th>유형</th>
            <th>응답 시간 (평균)</th>
            <th>최소</th>
            <th>최대</th>
            <th>임계값</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

/**
 * 임계값 위반 섹션 생성
 */
function generateViolationsSection(violations: ThresholdViolation[]): string {
  const items = violations
    .map(
      (v) => `
        <li>
          <strong>[${v.type === 'page' ? '페이지' : '동작'}] ${v.name}</strong><br>
          ${v.metric}: ${v.value.toFixed(0)}ms (임계값: ${v.threshold}ms, 초과: +${(v.value - v.threshold).toFixed(0)}ms)
        </li>
      `
    )
    .join('');

  return `
    <div class="card">
      <h2>임계값 초과 항목</h2>
      <ul class="violations-list">${items}</ul>
    </div>
  `;
}

/**
 * 상태 배지 생성
 */
function getStatusBadge(value: number, threshold: number): string {
  if (value <= threshold * 0.7) {
    return '<span class="badge badge-good">좋음</span>';
  } else if (value <= threshold) {
    return '<span class="badge badge-warning">보통</span>';
  }
  return '<span class="badge badge-error">느림</span>';
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
