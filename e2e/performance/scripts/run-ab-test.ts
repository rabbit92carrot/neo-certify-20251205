#!/usr/bin/env npx tsx
/**
 * A/B 성능 테스트 CLI 실행 스크립트
 *
 * 사용법:
 *   npx tsx e2e/performance/scripts/run-ab-test.ts --page hospital-inventory --pairs 10
 *
 * 옵션:
 *   --page, -p     테스트할 페이지 ID (필수)
 *   --pairs, -n    측정 쌍 수 (기본: 10)
 *   --cooldown, -c 측정 간 대기 시간 ms (기본: 2000)
 *   --list, -l     사용 가능한 페이지 목록 출력
 *   --help, -h     도움말 출력
 */

import { execSync } from 'child_process';
import * as path from 'path';

// 페이지 목록 (pages.config.ts에서 가져옴)
const AVAILABLE_PAGES = [
  // Manufacturer
  { id: 'manufacturer-dashboard', name: '제조사 대시보드', role: 'manufacturer' },
  { id: 'manufacturer-products', name: '제조사 제품 관리', role: 'manufacturer' },
  { id: 'manufacturer-production', name: '제조사 생산 관리', role: 'manufacturer' },
  { id: 'manufacturer-shipment', name: '제조사 출고 관리', role: 'manufacturer' },
  { id: 'manufacturer-inventory', name: '제조사 재고 조회', role: 'manufacturer' },
  { id: 'manufacturer-history', name: '제조사 이력 조회', role: 'manufacturer' },
  // Distributor
  { id: 'distributor-dashboard', name: '유통사 대시보드', role: 'distributor' },
  { id: 'distributor-inventory', name: '유통사 재고 조회', role: 'distributor' },
  { id: 'distributor-shipment', name: '유통사 출고 관리', role: 'distributor' },
  { id: 'distributor-history', name: '유통사 이력 조회', role: 'distributor' },
  // Hospital
  { id: 'hospital-dashboard', name: '병원 대시보드', role: 'hospital' },
  { id: 'hospital-inventory', name: '병원 재고 조회', role: 'hospital' },
  { id: 'hospital-treatment', name: '병원 시술 관리', role: 'hospital' },
  { id: 'hospital-treatment-history', name: '병원 시술 이력', role: 'hospital' },
  { id: 'hospital-disposal', name: '병원 폐기 관리', role: 'hospital' },
  { id: 'hospital-history', name: '병원 이력 조회', role: 'hospital' },
  // Admin
  { id: 'admin-dashboard', name: '관리자 대시보드', role: 'admin' },
  { id: 'admin-organizations', name: '관리자 조직 관리', role: 'admin' },
  { id: 'admin-approvals', name: '관리자 가입 승인', role: 'admin' },
  { id: 'admin-recalls', name: '관리자 회수 관리', role: 'admin' },
  { id: 'admin-history', name: '관리자 전체 이력', role: 'admin' },
  { id: 'admin-alerts', name: '관리자 알림 관리', role: 'admin' },
];

// ==================== 인자 파싱 ====================

interface Args {
  page?: string;
  pairs: number;
  cooldown: number;
  list: boolean;
  help: boolean;
}

function parseArgs(): Args {
  const args: Args = {
    page: undefined,
    pairs: 10,
    cooldown: 2000,
    list: false,
    help: false,
  };

  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    switch (arg) {
      case '--page':
      case '-p':
        args.page = argv[++i];
        break;
      case '--pairs':
      case '-n':
        args.pairs = parseInt(argv[++i], 10);
        break;
      case '--cooldown':
      case '-c':
        args.cooldown = parseInt(argv[++i], 10);
        break;
      case '--list':
      case '-l':
        args.list = true;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
    }
  }

  return args;
}

// ==================== 출력 함수 ====================

function printHelp(): void {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║              A/B 성능 테스트 CLI                              ║
╚══════════════════════════════════════════════════════════════╝

사용법:
  npx tsx e2e/performance/scripts/run-ab-test.ts [옵션]

옵션:
  --page, -p <id>      테스트할 페이지 ID (필수)
  --pairs, -n <수>     측정 쌍 수 (기본: 10)
  --cooldown, -c <ms>  측정 간 대기 시간 (기본: 2000)
  --list, -l           사용 가능한 페이지 목록 출력
  --help, -h           이 도움말 출력

예시:
  # 병원 재고 페이지 A/B 테스트 (10쌍)
  npx tsx e2e/performance/scripts/run-ab-test.ts --page hospital-inventory

  # 제조사 대시보드 A/B 테스트 (15쌍, 3초 대기)
  npx tsx e2e/performance/scripts/run-ab-test.ts -p manufacturer-dashboard -n 15 -c 3000

  # 사용 가능한 페이지 목록 확인
  npx tsx e2e/performance/scripts/run-ab-test.ts --list

출력:
  - reports/ab-test-{페이지ID}-{타임스탬프}.json
  - reports/ab-test-{페이지ID}-{타임스탬프}.html
`);
}

function printPageList(): void {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║              사용 가능한 페이지 목록 (22개)                    ║
╚══════════════════════════════════════════════════════════════╝
`);

  const roles = ['manufacturer', 'distributor', 'hospital', 'admin'];
  const roleNames: Record<string, string> = {
    manufacturer: '제조사',
    distributor: '유통사',
    hospital: '병원',
    admin: '관리자',
  };

  for (const role of roles) {
    const pages = AVAILABLE_PAGES.filter((p) => p.role === role);
    console.log(`\n[${roleNames[role]}] (${pages.length}개)`);
    console.log('─'.repeat(50));
    for (const page of pages) {
      console.log(`  ${page.id.padEnd(30)} ${page.name}`);
    }
  }

  console.log(`
사용 예시:
  npx tsx e2e/performance/scripts/run-ab-test.ts --page hospital-inventory
`);
}

// ==================== 메인 ====================

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (args.list) {
    printPageList();
    process.exit(0);
  }

  if (!args.page) {
    console.error('❌ 오류: 페이지 ID를 지정해야 합니다.');
    console.error('   사용법: npx tsx e2e/performance/scripts/run-ab-test.ts --page <페이지ID>');
    console.error('   페이지 목록 확인: npx tsx e2e/performance/scripts/run-ab-test.ts --list');
    process.exit(1);
  }

  // 페이지 유효성 검사
  const pageInfo = AVAILABLE_PAGES.find((p) => p.id === args.page);
  if (!pageInfo) {
    console.error(`❌ 오류: 알 수 없는 페이지 ID: ${args.page}`);
    console.error('   사용 가능한 페이지: npx tsx e2e/performance/scripts/run-ab-test.ts --list');
    process.exit(1);
  }

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║              A/B 성능 테스트 시작                             ║
╚══════════════════════════════════════════════════════════════╝

📊 대상: ${pageInfo.name} (${pageInfo.id})
📏 측정: ${args.pairs}쌍 (총 ${args.pairs * 2}회)
⏱️  대기: ${args.cooldown}ms

⚠️  주의: dev 서버가 실행 중이어야 합니다 (npm run dev)
`);

  // 환경 변수 설정
  const env = {
    ...process.env,
    AB_PAGE_ID: args.page,
    AB_PAIRS: args.pairs.toString(),
    AB_COOLDOWN: args.cooldown.toString(),
  };

  // Playwright 테스트 실행
  const testFile = path.join(__dirname, '../tests/ab-test.perf.ts');
  const configFile = path.join(__dirname, '../../playwright.perf.config.ts');

  try {
    execSync(`npx playwright test "${testFile}" --config "${configFile}"`, {
      stdio: 'inherit',
      env,
      cwd: path.join(__dirname, '../../..'),
    });

    console.log(`
╔══════════════════════════════════════════════════════════════╗
║              A/B 테스트 완료                                  ║
╚══════════════════════════════════════════════════════════════╝

📄 결과 파일: e2e/performance/reports/ab-test-${args.page}-*.json
📊 HTML 리포트: e2e/performance/reports/ab-test-${args.page}-*.html
`);
  } catch (error) {
    console.error('\n❌ A/B 테스트 실행 중 오류가 발생했습니다.');
    process.exit(1);
  }
}

main();
