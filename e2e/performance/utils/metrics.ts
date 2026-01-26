/**
 * 성능 측정 유틸리티 함수
 */

import type { Page } from '@playwright/test';

// ==================== 타입 정의 ====================

export interface TimingResult {
  startTime: number;
  endTime: number;
  duration: number;
}

export interface NavigationTimingData {
  domContentLoaded: number;
  loadComplete: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
}

export interface PageLoadMetrics {
  pageId: string;
  pageName: string;
  category: string;
  /** 페이지 초기 렌더링 완료 시간 */
  initialRender: TimingResult;
  /** 데이터 로딩 완료 시간 (있는 경우) */
  dataLoad?: TimingResult;
  /** Navigation Timing API 메트릭 */
  navigationTiming: NavigationTimingData;
}

export interface ActionStep {
  action: 'click' | 'fill' | 'select' | 'scroll' | 'wait';
  selector?: string;
  value?: string;
  timeout?: number;
}

export interface ActionMetrics {
  actionId: string;
  actionName: string;
  actionType: string;
  pageId: string;
  /** 동작 시작부터 완료까지 시간 */
  responseTime: TimingResult;
}

// ==================== 페이지 로딩 측정 ====================

/**
 * 페이지 로딩 시간 측정
 * @param page Playwright Page 객체
 * @param url 측정할 페이지 URL
 * @param loadCompleteSelector 로딩 완료 판단 셀렉터
 * @param dataLoadedSelector 데이터 로딩 완료 판단 셀렉터 (선택)
 */
export async function measurePageLoad(
  page: Page,
  url: string,
  loadCompleteSelector: string,
  dataLoadedSelector?: string
): Promise<Omit<PageLoadMetrics, 'pageId' | 'pageName' | 'category'>> {
  const startTime = Date.now();

  // 페이지 이동
  await page.goto(url, { waitUntil: 'commit' });

  // 초기 렌더링 완료 대기
  await page.waitForSelector(loadCompleteSelector, { timeout: 30000 });
  const initialRenderEnd = Date.now();

  // Navigation Timing 수집
  const navigationTiming = await collectNavigationTiming(page);

  // 데이터 로딩 완료 대기 (선택적)
  let dataLoad: TimingResult | undefined;
  if (dataLoadedSelector) {
    const dataLoadStart = Date.now();
    try {
      await page.waitForSelector(dataLoadedSelector, { timeout: 30000 });
      const dataLoadEnd = Date.now();
      dataLoad = {
        startTime: dataLoadStart,
        endTime: dataLoadEnd,
        duration: dataLoadEnd - dataLoadStart,
      };
    } catch {
      // 데이터 로딩 셀렉터를 찾지 못한 경우 무시
      dataLoad = undefined;
    }
  }

  return {
    initialRender: {
      startTime,
      endTime: initialRenderEnd,
      duration: initialRenderEnd - startTime,
    },
    dataLoad,
    navigationTiming,
  };
}

/**
 * Navigation Timing API 데이터 수집
 */
async function collectNavigationTiming(page: Page): Promise<NavigationTimingData> {
  return await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const paintEntries = performance.getEntriesByType('paint') as PerformancePaintTiming[];

    // LCP는 별도 observer가 필요하므로 현재 시점까지의 LCP 엔트리 확인
    let lcpValue: number | undefined;
    try {
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      if (lcpEntries.length > 0) {
        lcpValue = lcpEntries[lcpEntries.length - 1]?.startTime;
      }
    } catch {
      // LCP 지원하지 않는 경우 무시
    }

    const fcpEntry = paintEntries.find((e) => e.name === 'first-contentful-paint');

    return {
      domContentLoaded: navigation?.domContentLoadedEventEnd ?? 0,
      loadComplete: navigation?.loadEventEnd ?? 0,
      firstContentfulPaint: fcpEntry?.startTime,
      largestContentfulPaint: lcpValue,
    };
  });
}

// ==================== 동작 응답 측정 ====================

/**
 * 동작 응답 시간 측정
 * @param page Playwright Page 객체
 * @param steps 수행할 동작 단계들
 * @param completeSelector 완료 판단 셀렉터
 * @param prerequisiteSelector 사전 조건 셀렉터 (선택)
 */
export async function measureAction(
  page: Page,
  steps: ActionStep[],
  completeSelector: string,
  prerequisiteSelector?: string
): Promise<Omit<ActionMetrics, 'actionId' | 'actionName' | 'actionType' | 'pageId'>> {
  // 사전 조건 대기
  if (prerequisiteSelector) {
    await page.waitForSelector(prerequisiteSelector, { timeout: 15000 });
  }

  const startTime = Date.now();

  // 동작 수행
  for (const step of steps) {
    await executeStep(page, step);
  }

  // 완료 대기
  await page.waitForSelector(completeSelector, { timeout: 30000 });
  const endTime = Date.now();

  return {
    responseTime: {
      startTime,
      endTime,
      duration: endTime - startTime,
    },
  };
}

/**
 * 단일 동작 단계 실행
 */
async function executeStep(page: Page, step: ActionStep): Promise<void> {
  const timeout = step.timeout ?? 10000;

  switch (step.action) {
    case 'click':
      if (step.selector) {
        await page.click(step.selector, { timeout });
      }
      break;
    case 'fill':
      if (step.selector && step.value !== undefined) {
        await page.fill(step.selector, step.value, { timeout });
      }
      break;
    case 'select':
      if (step.selector && step.value !== undefined) {
        await page.selectOption(step.selector, step.value, { timeout });
      }
      break;
    case 'scroll':
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      break;
    case 'wait':
      if (step.value) {
        await page.waitForTimeout(parseInt(step.value, 10));
      }
      break;
  }
}

// ==================== 반복 측정 ====================

/**
 * N회 측정 실행 및 결과 수집
 * @param measureFn 측정 함수
 * @param times 측정 횟수 (기본 3회)
 * @param cooldown 측정 간 대기 시간 (기본 1000ms)
 */
export async function measureMultipleTimes<T>(
  measureFn: () => Promise<T>,
  times: number = 3,
  cooldown: number = 1000
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < times; i++) {
    const result = await measureFn();
    results.push(result);

    // 마지막 측정이 아니면 쿨다운 대기
    if (i < times - 1) {
      await new Promise((resolve) => setTimeout(resolve, cooldown));
    }
  }

  return results;
}
