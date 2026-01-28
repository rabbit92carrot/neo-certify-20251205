/**
 * 통계 계산 유틸리티 함수
 */

// ==================== 타입 정의 ====================

export interface Statistics {
  /** 최소값 */
  min: number;
  /** 최대값 */
  max: number;
  /** 평균값 */
  avg: number;
  /** 절사 평균 (상/하위 제외) - 이상치 영향 최소화 */
  trimmedAvg: number;
  /** 중앙값 */
  median: number;
  /** 원본 측정값들 */
  measurements: number[];
  /** 이상치 여부 (max/min 비율이 2배 이상) */
  hasOutlier: boolean;
}

export interface NavigationTimingStatistics {
  domContentLoaded: Statistics;
  loadComplete: Statistics;
  firstContentfulPaint?: Statistics;
  largestContentfulPaint?: Statistics;
}

export interface AggregatedPageMetrics {
  pageId: string;
  pageName: string;
  category: string;
  /** 초기 렌더링 통계 */
  initialRender: Statistics;
  /** 데이터 로딩 통계 (있는 경우) */
  dataLoad?: Statistics;
  /** Navigation Timing 통계 */
  navigationTiming: NavigationTimingStatistics;
}

export interface AggregatedActionMetrics {
  actionId: string;
  actionName: string;
  actionType: string;
  pageId: string;
  /** 응답 시간 통계 */
  responseTime: Statistics;
}

// ==================== 통계 계산 함수 ====================

/**
 * 숫자 배열에서 통계 계산
 * @param values 측정값 배열
 */
export function calculateStatistics(values: number[]): Statistics {
  if (values.length === 0) {
    return {
      min: 0,
      max: 0,
      avg: 0,
      trimmedAvg: 0,
      median: 0,
      measurements: [],
      hasOutlier: false,
    };
  }

  // 정렬된 복사본
  const sorted = [...values].sort((a, b) => a - b);

  const min = sorted[0]!;
  const max = sorted[sorted.length - 1]!;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  // 중앙값 계산
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
      : (sorted[mid] ?? 0);

  // 절사 평균 계산 (Trimmed Mean)
  // 상/하위 각 1개씩 제외 (최소 3개 이상일 때만 적용)
  let trimmedAvg: number;
  if (sorted.length >= 3) {
    const trimmed = sorted.slice(1, -1); // 첫 번째(최소)와 마지막(최대) 제외
    trimmedAvg = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  } else {
    // 측정값이 2개 이하면 일반 평균 사용
    trimmedAvg = avg;
  }

  // 이상치 여부 판단 (최대/최소 비율이 2배 이상이면 이상치 존재로 판단)
  const hasOutlier = min > 0 && max / min >= 2;

  return {
    min,
    max,
    avg: Math.round(avg * 100) / 100, // 소수점 2자리
    trimmedAvg: Math.round(trimmedAvg * 100) / 100,
    median: Math.round(median * 100) / 100,
    measurements: values,
    hasOutlier,
  };
}

/**
 * 통계를 포맷팅된 문자열로 변환
 * @param stats 통계 객체
 * @param unit 단위 (기본 'ms')
 */
export function formatStatistics(stats: Statistics, unit: string = 'ms'): string {
  return `avg: ${stats.avg.toFixed(0)}${unit} (min: ${stats.min.toFixed(0)}${unit}, max: ${stats.max.toFixed(0)}${unit})`;
}

/**
 * 통계에서 성능 등급 판정
 * @param stats 통계 객체
 * @param thresholds 임계값 { good, acceptable }
 */
export function getPerformanceGrade(
  stats: Statistics,
  thresholds: { good: number; acceptable: number }
): 'good' | 'acceptable' | 'poor' {
  if (stats.avg <= thresholds.good) {
    return 'good';
  } else if (stats.avg <= thresholds.acceptable) {
    return 'acceptable';
  }
  return 'poor';
}
