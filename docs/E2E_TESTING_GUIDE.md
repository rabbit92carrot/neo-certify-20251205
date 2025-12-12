# Playwright E2E 테스트 가이드

> **목적**: UI 흐름 검증을 위한 E2E 테스트 가이드
> **범위**: UI 렌더링 및 사용자 인터랙션 검증 (비즈니스 로직은 통합 테스트에서 검증)
> **작성일**: 2025-12-13

---

## 목차

1. [테스트 범위 원칙](#테스트-범위-원칙)
2. [환경 설정](#환경-설정)
3. [테스트 계정 정보](#테스트-계정-정보)
4. [테스트 시나리오](#테스트-시나리오)
5. [테스트 작성 가이드](#테스트-작성-가이드)
6. [실행 방법](#실행-방법)

---

## 테스트 범위 원칙

### 포함 (DO)

| 영역 | 예시 |
|------|------|
| 로그인/로그아웃 흐름 | 폼 제출, 리다이렉트, 세션 유지 |
| 페이지 렌더링 | 대시보드, 테이블, 폼이 정상 표시되는지 |
| 네비게이션 | 메뉴 클릭 시 올바른 페이지 이동 |
| 폼 UI 동작 | 입력, 유효성 메시지, 제출 버튼 상태 |
| 에러 메시지 표시 | 토스트, 알림, 인라인 에러 |
| 반응형 레이아웃 | 모바일/데스크톱 뷰 전환 |
| 모달/다이얼로그 | 열기/닫기, 내용 표시 |

### 제외 (DON'T)

| 영역 | 이유 | 대안 |
|------|------|------|
| FIFO 재고 선택 로직 | 비즈니스 로직 | 통합 테스트 |
| 24시간 회수 규칙 | 비즈니스 로직 | 통합 테스트 |
| 데이터 정합성 검증 | DB 레벨 검증 | 통합 테스트 |
| 복잡한 조건 분기 | 비즈니스 로직 | 단위/통합 테스트 |
| API 응답 검증 | 서버 로직 | 통합 테스트 |
| 성능 테스트 | 별도 도구 필요 | k6, Artillery 등 |

---

## 환경 설정

### 1. Playwright 설치

```bash
# Playwright 설치
npm install -D @playwright/test

# 브라우저 설치
npx playwright install
```

### 2. 설정 파일 생성

`playwright.config.ts` 파일을 프로젝트 루트에 생성:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // 순차 실행 (DB 상태 보존)
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // 모바일 테스트 (선택사항)
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
    },
  ],

  // 개발 서버 자동 시작 (로컬 테스트용)
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
```

### 3. 디렉토리 구조

```
e2e/
├── fixtures/
│   └── auth.ts           # 인증 헬퍼 (로그인 상태 저장)
├── auth.spec.ts          # 인증 흐름 테스트
├── manufacturer.spec.ts  # 제조사 UI 테스트
├── distributor.spec.ts   # 유통사 UI 테스트
├── hospital.spec.ts      # 병원 UI 테스트
└── admin.spec.ts         # 관리자 UI 테스트
```

### 4. package.json 스크립트 추가

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

---

## 테스트 계정 정보

### 시드 데이터 계정

| 역할 | 이메일 | 비밀번호 | 용도 |
|------|--------|---------|------|
| **Admin** | admin@neocert.com | admin123 | 관리자 UI 테스트 |
| **Manufacturer** | manufacturer@neocert.com | test123 | 제조사 UI 테스트 |
| **Distributor** | distributor@neocert.com | test123 | 유통사 UI 테스트 |
| **Hospital** | hospital@neocert.com | test123 | 병원 UI 테스트 |

### Cloud 환경 테스트 시 주의사항

```typescript
// 환경별 계정 설정 예시
const TEST_ACCOUNTS = {
  local: {
    admin: { email: 'admin@neocert.com', password: 'admin123' },
    manufacturer: { email: 'manufacturer@neocert.com', password: 'test123' },
  },
  staging: {
    admin: { email: process.env.STAGING_ADMIN_EMAIL, password: process.env.STAGING_ADMIN_PW },
    // ...
  },
  production: {
    // 프로덕션에서는 E2E 테스트 비권장
  }
};
```

---

## 테스트 시나리오

### 1. 인증 흐름 (auth.spec.ts)

```typescript
import { test, expect } from '@playwright/test';

test.describe('인증 흐름', () => {
  test('로그인 페이지가 올바르게 렌더링된다', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: /로그인/ })).toBeVisible();
    await expect(page.getByLabel('이메일')).toBeVisible();
    await expect(page.getByLabel('비밀번호')).toBeVisible();
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
  });

  test('유효한 자격증명으로 로그인하면 대시보드로 이동한다', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('이메일').fill('manufacturer@neocert.com');
    await page.getByLabel('비밀번호').fill('test123');
    await page.getByRole('button', { name: '로그인' }).click();

    // 대시보드로 리다이렉트 확인
    await expect(page).toHaveURL(/\/manufacturer\/dashboard/);
  });

  test('잘못된 자격증명은 에러 메시지를 표시한다', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('이메일').fill('wrong@email.com');
    await page.getByLabel('비밀번호').fill('wrongpassword');
    await page.getByRole('button', { name: '로그인' }).click();

    // 에러 메시지 확인
    await expect(page.getByText(/이메일 또는 비밀번호/)).toBeVisible();
  });

  test('로그아웃하면 로그인 페이지로 이동한다', async ({ page }) => {
    // 먼저 로그인
    await page.goto('/login');
    await page.getByLabel('이메일').fill('manufacturer@neocert.com');
    await page.getByLabel('비밀번호').fill('test123');
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page).toHaveURL(/\/manufacturer\/dashboard/);

    // 로그아웃
    await page.getByRole('button', { name: /로그아웃/ }).click();

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/login/);
  });
});
```

### 2. 제조사 대시보드 (manufacturer.spec.ts)

```typescript
import { test, expect } from '@playwright/test';

test.describe('제조사 대시보드', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('/login');
    await page.getByLabel('이메일').fill('manufacturer@neocert.com');
    await page.getByLabel('비밀번호').fill('test123');
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page).toHaveURL(/\/manufacturer\/dashboard/);
  });

  test('대시보드 통계 카드가 표시된다', async ({ page }) => {
    // 통계 카드 확인
    await expect(page.getByText('총 재고')).toBeVisible();
    await expect(page.getByText('이번 달 생산')).toBeVisible();
    await expect(page.getByText('이번 달 출고')).toBeVisible();
  });

  test('네비게이션 메뉴가 올바르게 동작한다', async ({ page }) => {
    // 제품 관리 메뉴 클릭
    await page.getByRole('link', { name: /제품 관리/ }).click();
    await expect(page).toHaveURL(/\/manufacturer\/products/);

    // 생산 관리 메뉴 클릭
    await page.getByRole('link', { name: /생산 관리/ }).click();
    await expect(page).toHaveURL(/\/manufacturer\/production/);
  });

  test('제품 목록 테이블이 렌더링된다', async ({ page }) => {
    await page.goto('/manufacturer/products');

    // 테이블 헤더 확인
    await expect(page.getByRole('columnheader', { name: '제품명' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'UDI-DI' })).toBeVisible();
  });
});
```

### 3. 병원 시술 UI (hospital.spec.ts)

```typescript
import { test, expect } from '@playwright/test';

test.describe('병원 시술 관리', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('이메일').fill('hospital@neocert.com');
    await page.getByLabel('비밀번호').fill('test123');
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page).toHaveURL(/\/hospital\/dashboard/);
  });

  test('시술 등록 폼이 올바르게 표시된다', async ({ page }) => {
    await page.goto('/hospital/treatment');

    // 폼 요소 확인
    await expect(page.getByLabel('환자 전화번호')).toBeVisible();
    await expect(page.getByText('재고 선택')).toBeVisible();
    await expect(page.getByRole('button', { name: '시술 등록' })).toBeVisible();
  });

  test('재고가 없으면 빈 상태 메시지가 표시된다', async ({ page }) => {
    // 재고가 없는 경우를 위한 테스트
    // 실제로는 테스트 환경에 따라 조건이 다를 수 있음
    await page.goto('/hospital/inventory');

    // 테이블 또는 빈 상태 확인
    const table = page.getByRole('table');
    const emptyState = page.getByText(/재고가 없습니다/);

    await expect(table.or(emptyState)).toBeVisible();
  });
});
```

### 4. 관리자 이벤트 이력 (admin.spec.ts)

```typescript
import { test, expect } from '@playwright/test';

test.describe('관리자 이벤트 이력', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('이메일').fill('admin@neocert.com');
    await page.getByLabel('비밀번호').fill('admin123');
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('이벤트 이력 테이블이 렌더링된다', async ({ page }) => {
    await page.goto('/admin/history');

    // 테이블 헤더 확인
    await expect(page.getByRole('columnheader', { name: '일시' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '이벤트' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '수량' })).toBeVisible();
  });

  test('필터가 올바르게 동작한다', async ({ page }) => {
    await page.goto('/admin/history');

    // 필터 열기
    await page.getByRole('button', { name: /필터/ }).click();

    // 필터 옵션 확인
    await expect(page.getByLabel('시작 날짜')).toBeVisible();
    await expect(page.getByLabel('종료 날짜')).toBeVisible();
  });

  test('이벤트 상세 모달이 열린다', async ({ page }) => {
    await page.goto('/admin/history');

    // 첫 번째 상세 버튼 클릭
    const detailButton = page.getByRole('button', { name: '상세' }).first();
    await detailButton.click();

    // 모달 확인
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('상세')).toBeVisible();
  });

  test('CSV 다운로드 버튼이 존재한다', async ({ page }) => {
    await page.goto('/admin/history');

    await expect(page.getByRole('button', { name: /CSV 다운로드/ })).toBeVisible();
  });
});
```

---

## 테스트 작성 가이드

### 좋은 E2E 테스트 예시

```typescript
// ✅ 좋음: UI 요소 존재와 기본 동작만 검증
test('출고 폼에서 수량 입력이 가능하다', async ({ page }) => {
  await page.goto('/manufacturer/shipment');

  const quantityInput = page.getByLabel('수량');
  await quantityInput.fill('10');

  await expect(quantityInput).toHaveValue('10');
});

// ✅ 좋음: 사용자 흐름 검증
test('출고 후 성공 메시지가 표시된다', async ({ page }) => {
  // ... 출고 폼 작성
  await page.getByRole('button', { name: '출고' }).click();

  // 성공 메시지 또는 리다이렉트 확인
  await expect(page.getByText(/출고가 완료/)).toBeVisible();
});
```

### 나쁜 E2E 테스트 예시

```typescript
// ❌ 나쁨: 비즈니스 로직 검증 (통합 테스트로 이동해야 함)
test('FIFO로 가장 오래된 재고가 선택된다', async ({ page }) => {
  // 이런 로직 검증은 통합 테스트에서!
});

// ❌ 나쁨: DB 상태 직접 검증
test('출고 후 재고가 감소한다', async ({ page }) => {
  // DB 쿼리로 검증하는 것은 E2E가 아님
});

// ❌ 나쁨: API 응답 검증
test('API가 올바른 데이터를 반환한다', async ({ page }) => {
  // API 테스트는 통합 테스트에서!
});
```

### 셀렉터 우선순위

```typescript
// 1순위: Role 기반 (접근성 좋음)
page.getByRole('button', { name: '로그인' })
page.getByRole('link', { name: '대시보드' })

// 2순위: Label 기반
page.getByLabel('이메일')
page.getByLabel('비밀번호')

// 3순위: Text 기반
page.getByText('총 재고')

// 4순위: Test ID (불가피한 경우)
page.getByTestId('submit-button')

// 피해야 함: CSS 셀렉터
page.locator('.btn-primary') // ❌
page.locator('#login-form') // ❌
```

---

## 실행 방법

### 로컬 환경

```bash
# 개발 서버 실행 (별도 터미널)
npm run dev

# E2E 테스트 실행
npm run test:e2e

# UI 모드로 실행 (디버깅에 유용)
npm run test:e2e:ui

# 브라우저 표시하며 실행
npm run test:e2e:headed

# 특정 파일만 실행
npx playwright test auth.spec.ts
```

### Cloud 환경 (Staging)

```bash
# 환경 변수로 URL 지정
PLAYWRIGHT_BASE_URL=https://staging.neocert.example.com npm run test:e2e

# 또는 .env.test 파일 사용
# PLAYWRIGHT_BASE_URL=https://staging.neocert.example.com
# STAGING_ADMIN_EMAIL=admin@staging.neocert.com
# STAGING_ADMIN_PW=staging_password
```

### CI/CD 환경

```yaml
# GitHub Actions 예시
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          PLAYWRIGHT_BASE_URL: ${{ secrets.STAGING_URL }}

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 인증 상태 재사용 (고급)

로그인 시간을 절약하기 위해 인증 상태를 저장하고 재사용할 수 있습니다.

### fixtures/auth.ts

```typescript
import { test as base, expect } from '@playwright/test';
import path from 'path';

// 인증 상태 파일 경로
const authFile = (role: string) =>
  path.join(__dirname, `../.auth/${role}.json`);

// 로그인 후 상태 저장
export async function login(
  page: any,
  email: string,
  password: string,
  role: string
) {
  await page.goto('/login');
  await page.getByLabel('이메일').fill(email);
  await page.getByLabel('비밀번호').fill(password);
  await page.getByRole('button', { name: '로그인' }).click();

  // 대시보드 로딩 대기
  await page.waitForURL(/\/dashboard/);

  // 인증 상태 저장
  await page.context().storageState({ path: authFile(role) });
}

// 역할별 테스트 fixture
export const test = base.extend<{
  manufacturerPage: any;
  hospitalPage: any;
  adminPage: any;
}>({
  manufacturerPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: authFile('manufacturer'),
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
  // 다른 역할도 동일하게...
});
```

### 사용 예시

```typescript
import { test } from './fixtures/auth';

test('제조사 대시보드 테스트', async ({ manufacturerPage }) => {
  // 이미 로그인된 상태로 시작
  await manufacturerPage.goto('/manufacturer/dashboard');
  // ...
});
```

---

## 체크리스트

### 테스트 작성 전 확인

- [ ] 이 테스트가 UI 흐름을 검증하는가?
- [ ] 비즈니스 로직 검증이 아닌가?
- [ ] 통합 테스트에서 더 적합하지 않은가?

### 테스트 작성 후 확인

- [ ] Role/Label 기반 셀렉터를 사용했는가?
- [ ] 테스트가 독립적으로 실행 가능한가?
- [ ] 적절한 대기(wait)를 사용했는가?
- [ ] 에러 시 스크린샷이 캡처되는가?

### Cloud 배포 전 확인

- [ ] 환경 변수가 올바르게 설정되었는가?
- [ ] 테스트 계정이 해당 환경에 존재하는가?
- [ ] 네트워크 타임아웃이 적절한가?

---

## 관련 문서

- [Playwright 공식 문서](https://playwright.dev/)
- [프로젝트 통합 테스트](../tests/integration/)
- [테스트 계획 문서](../.claude/plans/)
