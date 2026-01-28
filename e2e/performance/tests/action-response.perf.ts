/**
 * 동작 응답 시간 측정 테스트
 * 사용자 상호작용에 대한 응답 시간을 3회 측정하여 통계 분석
 */

import { test } from '@playwright/test';
import { TEST_ACCOUNTS, login } from '../../fixtures/auth';
import { PAGES, type UserRole } from '../config/pages.config';
import { ACTIONS, ACTION_THRESHOLDS, type ActionConfig } from '../config/actions.config';
import { measureAction, measureMultipleTimes, type ActionMetrics } from '../utils/metrics';
import { calculateStatistics, type AggregatedActionMetrics } from '../utils/statistics';
import { generateReport, saveReports } from '../utils/report-generator';
import * as path from 'path';

/** 측정 횟수 */
const MEASUREMENT_COUNT = 3;

/** 측정 간 대기 시간 (ms) */
const COOLDOWN = 1000;

/** 수집된 모든 결과 */
const allResults: AggregatedActionMetrics[] = [];

/** 페이지 ID → 역할 매핑 */
const pageRoleMap = new Map(PAGES.map((p) => [p.id, p.role]));

/** 페이지 ID → 경로 매핑 */
const pagePathMap = new Map(PAGES.map((p) => [p.id, p.path]));

/** 페이지 ID → 로딩 완료 셀렉터 매핑 */
const pageLoadSelectorMap = new Map(PAGES.map((p) => [p.id, p.loadCompleteSelector]));

test.describe.serial('동작 응답 시간 측정', () => {
  // 역할별로 동작 그룹화
  const actionsByRole = groupActionsByRole();

  for (const [role, actions] of Object.entries(actionsByRole)) {
    const account = TEST_ACCOUNTS[role as keyof typeof TEST_ACCOUNTS];

    test.describe(`${getRoleName(role as UserRole)} 동작`, () => {
      test.beforeEach(async ({ page }) => {
        // 각 테스트 전 로그인
        await login(page, account.email, account.password);
      });

      for (const actionConfig of actions) {
        const pagePath = pagePathMap.get(actionConfig.pageId);
        const pageLoadSelector = pageLoadSelectorMap.get(actionConfig.pageId);

        if (!pagePath || !pageLoadSelector) {
          continue;
        }

        test(`[${actionConfig.name}] 응답 시간 측정 (${MEASUREMENT_COUNT}회)`, async ({ page }) => {
          console.log(`\n📊 측정 시작: ${actionConfig.name}`);

          // 3회 측정
          const measurements = await measureMultipleTimes(
            async () => {
              // 페이지 이동 및 로딩 대기
              await page.goto(pagePath);
              await page.waitForSelector(pageLoadSelector, { timeout: 30000 });

              // 동작이 없는 경우 (stats-load 등)는 이미 로딩된 상태
              if (actionConfig.steps.length === 0) {
                // 데이터 로딩 완료까지 측정
                const startTime = Date.now();
                await page.waitForSelector(actionConfig.completeSelector, { timeout: 30000 });
                const endTime = Date.now();

                return {
                  responseTime: {
                    startTime,
                    endTime,
                    duration: endTime - startTime,
                  },
                };
              }

              // 동작 수행 및 측정
              return measureAction(
                page,
                actionConfig.steps,
                actionConfig.completeSelector,
                actionConfig.prerequisiteSelector
              );
            },
            MEASUREMENT_COUNT,
            COOLDOWN
          );

          // 통계 계산
          const aggregated = aggregateActionMetrics(actionConfig, measurements);
          allResults.push(aggregated);

          // 콘솔 출력
          logActionMetrics(actionConfig, aggregated);
        });
      }
    });
  }

  // 모든 테스트 완료 후 리포트 생성
  test.afterAll(async () => {
    console.log('\n📝 리포트 생성 중...');

    const outputDir = path.resolve(__dirname, '../reports');

    const report = generateReport([], allResults, {
      baseUrl: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
      environment: process.env.CI ? 'CI' : 'local',
      measurementCount: MEASUREMENT_COUNT,
    });

    await saveReports(report, outputDir, 'action-response');

    console.log(`\n✅ 리포트 저장 완료: ${outputDir}`);
    console.log(`   - action-response-report.json`);
    console.log(`   - action-response-report.html`);
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
 * 동작을 역할별로 그룹화
 */
function groupActionsByRole(): Record<string, ActionConfig[]> {
  const result: Record<string, ActionConfig[]> = {};

  for (const action of ACTIONS) {
    const role = pageRoleMap.get(action.pageId);
    if (!role) {
      continue;
    }

    if (!result[role]) {
      result[role] = [];
    }
    result[role].push(action);
  }

  return result;
}

/**
 * 동작 측정 결과 집계
 */
function aggregateActionMetrics(
  actionConfig: ActionConfig,
  measurements: Omit<ActionMetrics, 'actionId' | 'actionName' | 'actionType' | 'pageId'>[]
): AggregatedActionMetrics {
  const responseTimes = measurements.map((m) => m.responseTime.duration);

  return {
    actionId: actionConfig.id,
    actionName: actionConfig.name,
    actionType: actionConfig.type,
    pageId: actionConfig.pageId,
    responseTime: calculateStatistics(responseTimes),
  };
}

/**
 * 동작 측정 결과 로깅
 */
function logActionMetrics(actionConfig: ActionConfig, aggregated: AggregatedActionMetrics): void {
  const threshold = ACTION_THRESHOLDS[actionConfig.type];

  console.log(`\n📈 [${actionConfig.name}] 측정 결과:`);
  console.log(
    `   응답 시간: ${aggregated.responseTime.avg.toFixed(0)}ms (min: ${aggregated.responseTime.min.toFixed(0)}ms, max: ${aggregated.responseTime.max.toFixed(0)}ms)`
  );
  console.log(`   임계값: ${threshold}ms`);

  // 성능 경고
  if (aggregated.responseTime.avg > threshold) {
    console.log(`   ⚠️ 경고: 응답 시간이 임계값(${threshold}ms)을 초과합니다!`);
  }
}
