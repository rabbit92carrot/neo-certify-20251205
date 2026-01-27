/**
 * 성능 테스트용 Global Setup
 * 테스트 실행 전 모든 역할의 인증 파일을 생성합니다.
 *
 * 이점:
 * - 로그인 횟수 22회 → 4회로 감소 (역할당 1회)
 * - 테스트 속도 및 안정성 향상
 * - Rate limit 문제 완화
 */

import { chromium, type FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/** 인증 파일 저장 디렉토리 */
const AUTH_DIR = path.resolve(__dirname, '../.auth');

/** 인증 파일 유효 시간 (3시간) */
const AUTH_FILE_MAX_AGE_MS = 3 * 60 * 60 * 1000;

/** 테스트 계정 정보 */
const TEST_ACCOUNTS = {
  admin: {
    email: 'admin@neocert.com',
    password: 'admin123',
  },
  manufacturer: {
    email: 'manufacturer@neocert.com',
    password: 'test123',
  },
  distributor: {
    email: 'distributor@neocert.com',
    password: 'test123',
  },
  hospital: {
    email: 'hospital@neocert.com',
    password: 'test123',
  },
} as const;

type UserRole = keyof typeof TEST_ACCOUNTS;

const ROLES: UserRole[] = ['manufacturer', 'distributor', 'hospital', 'admin'];

/**
 * 역할별 인증 파일 경로
 */
export function getAuthFile(role: UserRole): string {
  return path.join(AUTH_DIR, `${role}-perf.json`);
}

/**
 * 인증 파일이 유효한지 확인
 * - 파일 존재 여부
 * - 파일 생성 시간 (3시간 이내)
 */
function isAuthFileValid(authFile: string): boolean {
  if (!fs.existsSync(authFile)) {
    return false;
  }

  try {
    const stats = fs.statSync(authFile);
    const ageMs = Date.now() - stats.mtimeMs;
    return ageMs < AUTH_FILE_MAX_AGE_MS;
  } catch {
    return false;
  }
}

/**
 * Global Setup 함수
 * Playwright config의 globalSetup에서 호출됩니다.
 */
async function globalSetup(config: FullConfig): Promise<void> {
  console.log('\n🔐 성능 테스트용 인증 파일 준비 중...\n');

  // 디렉토리 생성
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000';

  // 브라우저 시작 (모든 역할 공유)
  const browser = await chromium.launch();

  try {
    for (const role of ROLES) {
      const authFile = getAuthFile(role);

      // 유효한 인증 파일이 있으면 스킵
      if (isAuthFileValid(authFile)) {
        const stats = fs.statSync(authFile);
        const ageMinutes = Math.floor((Date.now() - stats.mtimeMs) / 60000);
        console.log(`  ✅ ${role}: 기존 세션 재사용 (${ageMinutes}분 전 생성)`);
        continue;
      }

      // 새 컨텍스트 생성
      const context = await browser.newContext({ baseURL });
      const page = await context.newPage();

      try {
        const account = TEST_ACCOUNTS[role];

        // 로그인 수행
        await page.goto('/login');
        await page.locator('input[type="email"]').fill(account.email);
        await page.locator('input[type="password"]').fill(account.password);
        await page.locator('button[type="submit"]').click();
        await page.waitForURL(/\/dashboard/, { timeout: 30000 });

        // 인증 상태 저장
        await context.storageState({ path: authFile });

        console.log(`  ✅ ${role}: 새 세션 저장 완료`);
      } catch (error) {
        console.error(`  ❌ ${role}: 로그인 실패`, error);
        throw error;
      } finally {
        await context.close();
      }

      // 연속 로그인 시 서버 부하 방지
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  } finally {
    await browser.close();
  }

  console.log('\n🔐 인증 파일 준비 완료\n');
}

export default globalSetup;
