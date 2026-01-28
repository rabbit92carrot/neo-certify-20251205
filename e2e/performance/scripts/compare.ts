#!/usr/bin/env tsx
/**
 * 성능 비교 CLI 스크립트
 *
 * 사용법:
 *   npx tsx e2e/performance/scripts/compare.ts --before page-load-report-before.json --after page-load-report-after.json
 *
 * 또는 package.json에 스크립트 추가:
 *   "perf:compare": "tsx e2e/performance/scripts/compare.ts"
 */

import * as path from 'path';
import * as fs from 'fs';
import {
  compareReportFiles,
  saveComparisonReport,
  printComparisonSummary,
} from '../utils/comparison';

// CLI 인자 파싱
function parseArgs(): { beforePath: string; afterPath: string } {
  const args = process.argv.slice(2);
  let beforePath = '';
  let afterPath = '';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    if (arg === '--before' && nextArg) {
      beforePath = nextArg;
      i++;
    } else if (arg === '--after' && nextArg) {
      afterPath = nextArg;
      i++;
    } else if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }
  }

  // 기본값 설정
  const reportsDir = path.resolve(__dirname, '../reports');

  if (!beforePath) {
    beforePath = path.join(reportsDir, 'page-load-report-before.json');
  } else if (!path.isAbsolute(beforePath)) {
    beforePath = path.join(reportsDir, beforePath);
  }

  if (!afterPath) {
    afterPath = path.join(reportsDir, 'page-load-report-after.json');
  } else if (!path.isAbsolute(afterPath)) {
    afterPath = path.join(reportsDir, afterPath);
  }

  return { beforePath, afterPath };
}

function printUsage(): void {
  console.log(`
성능 비교 CLI

사용법:
  npx tsx e2e/performance/scripts/compare.ts [옵션]

옵션:
  --before <파일>  Before 리포트 JSON 파일 (기본: page-load-report-before.json)
  --after <파일>   After 리포트 JSON 파일 (기본: page-load-report-after.json)
  --help, -h       도움말 표시

예시:
  # 기본 파일로 비교
  npx tsx e2e/performance/scripts/compare.ts

  # 특정 파일 비교
  npx tsx e2e/performance/scripts/compare.ts --before before.json --after after.json

출력:
  - 콘솔에 비교 요약 출력
  - e2e/performance/reports/comparison-report.json 생성
  - e2e/performance/reports/comparison-report.html 생성
`);
}

function main(): void {
  const { beforePath, afterPath } = parseArgs();

  // 파일 존재 확인
  if (!fs.existsSync(beforePath)) {
    console.error(`❌ Before 리포트를 찾을 수 없습니다: ${beforePath}`);
    console.error(`\n힌트: 먼저 기존 리포트를 백업하세요:`);
    console.error(`  cp e2e/performance/reports/page-load-report.json e2e/performance/reports/page-load-report-before.json`);
    process.exit(1);
  }

  if (!fs.existsSync(afterPath)) {
    console.error(`❌ After 리포트를 찾을 수 없습니다: ${afterPath}`);
    console.error(`\n힌트: PERF_VARIANT=after 환경 변수로 성능 테스트를 실행하세요:`);
    console.error(`  PERF_VARIANT=after npx playwright test --config e2e/playwright.perf.config.ts`);
    process.exit(1);
  }

  console.log(`\n📂 Before: ${path.basename(beforePath)}`);
  console.log(`📂 After: ${path.basename(afterPath)}`);

  try {
    // 비교 실행
    const report = compareReportFiles(beforePath, afterPath);

    // 콘솔에 요약 출력
    printComparisonSummary(report);

    // 리포트 파일 저장
    const outputDir = path.dirname(beforePath);
    const { jsonPath, htmlPath } = saveComparisonReport(report, outputDir);

    console.log(`\n📄 리포트 저장 완료:`);
    console.log(`   - ${path.basename(jsonPath)}`);
    console.log(`   - ${path.basename(htmlPath)}`);
  } catch (error) {
    console.error('❌ 비교 중 오류 발생:', error);
    process.exit(1);
  }
}

main();
