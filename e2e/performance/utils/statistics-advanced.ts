/**
 * 고급 통계 유틸리티 - A/B 테스트용
 *
 * 기능:
 * - Paired t-test (대응표본 t-검정)
 * - 95% 신뢰구간 계산
 * - Cohen's d 효과크기 계산
 * - 통계적 유의성 판정
 */

export interface TTestResult {
  /** t-통계량 */
  tStatistic: number;
  /** p-value (양측검정) */
  pValue: number;
  /** 자유도 */
  degreesOfFreedom: number;
  /** 통계적으로 유의한지 (p < 0.05) */
  significant: boolean;
  /** 평균 차이의 95% 신뢰구간 */
  confidenceInterval: [number, number];
  /** Cohen's d 효과크기 */
  effectSize: number;
  /** 효과크기 해석 */
  effectInterpretation: 'negligible' | 'small' | 'medium' | 'large';
  /** 표본 크기 */
  sampleSize: number;
  /** 평균 차이 (B - A) */
  meanDifference: number;
  /** 표준 오차 */
  standardError: number;
}

export interface DescriptiveStats {
  mean: number;
  standardDeviation: number;
  variance: number;
  min: number;
  max: number;
  median: number;
  count: number;
}

/**
 * 기술통계량 계산
 */
export function calculateDescriptiveStats(values: number[]): DescriptiveStats {
  const n = values.length;
  if (n === 0) {
    return {
      mean: 0,
      standardDeviation: 0,
      variance: 0,
      min: 0,
      max: 0,
      median: 0,
      count: 0,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((sum, v) => sum + v, 0) / n;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1);
  const standardDeviation = Math.sqrt(variance);

  const median =
    n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];

  return {
    mean,
    standardDeviation,
    variance,
    min: sorted[0],
    max: sorted[n - 1],
    median,
    count: n,
  };
}

/**
 * Paired t-test (대응표본 t-검정)
 *
 * 동일 조건에서 A와 B를 번갈아 측정한 쌍 데이터에 적합
 * 환경 변수 영향을 최소화하여 더 정확한 비교 가능
 *
 * @param sampleA - Variant A 측정값 배열
 * @param sampleB - Variant B 측정값 배열 (동일 크기)
 * @param alpha - 유의수준 (기본값 0.05)
 */
export function pairedTTest(
  sampleA: number[],
  sampleB: number[],
  alpha: number = 0.05
): TTestResult {
  if (sampleA.length !== sampleB.length) {
    throw new Error('Paired t-test requires equal sample sizes');
  }

  const n = sampleA.length;
  if (n < 2) {
    throw new Error('Sample size must be at least 2');
  }

  // 차이 계산 (B - A, 양수면 B가 더 큼 = A가 더 빠름)
  const differences = sampleA.map((a, i) => sampleB[i] - a);

  // 차이의 평균과 표준편차
  const meanDiff = differences.reduce((sum, d) => sum + d, 0) / n;
  const varianceDiff = differences.reduce((sum, d) => sum + Math.pow(d - meanDiff, 2), 0) / (n - 1);
  const sdDiff = Math.sqrt(varianceDiff);

  // 표준 오차
  const standardError = sdDiff / Math.sqrt(n);

  // t-통계량
  const tStatistic = meanDiff / standardError;

  // 자유도
  const df = n - 1;

  // p-value 계산 (양측검정)
  const pValue = 2 * (1 - tCDF(Math.abs(tStatistic), df));

  // 95% 신뢰구간
  const tCritical = tQuantile(1 - alpha / 2, df);
  const marginOfError = tCritical * standardError;
  const confidenceInterval: [number, number] = [meanDiff - marginOfError, meanDiff + marginOfError];

  // Cohen's d 효과크기 (차이의 평균 / 차이의 표준편차)
  const effectSize = sdDiff > 0 ? meanDiff / sdDiff : 0;

  // 효과크기 해석 (Cohen's convention)
  const effectInterpretation = interpretEffectSize(Math.abs(effectSize));

  return {
    tStatistic,
    pValue,
    degreesOfFreedom: df,
    significant: pValue < alpha,
    confidenceInterval,
    effectSize,
    effectInterpretation,
    sampleSize: n,
    meanDifference: meanDiff,
    standardError,
  };
}

/**
 * 독립표본 t-검정 (Two-sample t-test)
 *
 * 서로 다른 조건에서 측정한 두 독립 표본 비교
 * Welch's t-test 사용 (등분산 가정 완화)
 */
export function independentTTest(
  sampleA: number[],
  sampleB: number[],
  alpha: number = 0.05
): TTestResult {
  const nA = sampleA.length;
  const nB = sampleB.length;

  if (nA < 2 || nB < 2) {
    throw new Error('Each sample must have at least 2 observations');
  }

  const statsA = calculateDescriptiveStats(sampleA);
  const statsB = calculateDescriptiveStats(sampleB);

  const meanDiff = statsB.mean - statsA.mean;

  // Welch's t-test (등분산 가정하지 않음)
  const varA = statsA.variance;
  const varB = statsB.variance;

  const standardError = Math.sqrt(varA / nA + varB / nB);
  const tStatistic = meanDiff / standardError;

  // Welch-Satterthwaite 자유도 근사
  const numerator = Math.pow(varA / nA + varB / nB, 2);
  const denominator =
    Math.pow(varA / nA, 2) / (nA - 1) + Math.pow(varB / nB, 2) / (nB - 1);
  const df = numerator / denominator;

  // p-value 계산
  const pValue = 2 * (1 - tCDF(Math.abs(tStatistic), df));

  // 95% 신뢰구간
  const tCritical = tQuantile(1 - alpha / 2, df);
  const marginOfError = tCritical * standardError;
  const confidenceInterval: [number, number] = [meanDiff - marginOfError, meanDiff + marginOfError];

  // Cohen's d (pooled standard deviation 사용)
  const pooledSD = Math.sqrt(
    ((nA - 1) * varA + (nB - 1) * varB) / (nA + nB - 2)
  );
  const effectSize = pooledSD > 0 ? meanDiff / pooledSD : 0;

  const effectInterpretation = interpretEffectSize(Math.abs(effectSize));

  return {
    tStatistic,
    pValue,
    degreesOfFreedom: df,
    significant: pValue < alpha,
    confidenceInterval,
    effectSize,
    effectInterpretation,
    sampleSize: nA + nB,
    meanDifference: meanDiff,
    standardError,
  };
}

/**
 * Cohen's d 효과크기 해석
 * - |d| < 0.2: negligible (무시할 수준)
 * - 0.2 <= |d| < 0.5: small (작은 효과)
 * - 0.5 <= |d| < 0.8: medium (중간 효과)
 * - |d| >= 0.8: large (큰 효과)
 */
function interpretEffectSize(d: number): 'negligible' | 'small' | 'medium' | 'large' {
  if (d < 0.2) return 'negligible';
  if (d < 0.5) return 'small';
  if (d < 0.8) return 'medium';
  return 'large';
}

/**
 * 효과크기 해석 (한국어)
 */
export function getEffectSizeLabel(interpretation: TTestResult['effectInterpretation']): string {
  const labels = {
    negligible: '무시할 수준',
    small: '작은 효과',
    medium: '중간 효과',
    large: '큰 효과',
  };
  return labels[interpretation];
}

/**
 * t-분포 누적분포함수 (CDF) 근사
 * Abramowitz and Stegun 근사 사용
 */
function tCDF(t: number, df: number): number {
  // 정규분포로 근사 (df > 30일 때 정확)
  if (df > 30) {
    return normalCDF(t);
  }

  // Beta 함수 기반 근사
  const x = df / (df + t * t);
  return 1 - 0.5 * incompleteBeta(x, df / 2, 0.5);
}

/**
 * t-분포 분위수 (Quantile) 근사
 * Newton-Raphson 반복법 사용
 */
function tQuantile(p: number, df: number): number {
  if (p <= 0 || p >= 1) {
    throw new Error('Probability must be between 0 and 1');
  }

  // 초기값: 정규분포 분위수
  let t = normalQuantile(p);

  // Newton-Raphson 반복 (최대 50회)
  for (let i = 0; i < 50; i++) {
    const cdf = tCDF(t, df);
    const pdf = tPDF(t, df);

    if (pdf === 0) break;

    const delta = (cdf - p) / pdf;
    t -= delta;

    if (Math.abs(delta) < 1e-10) break;
  }

  return t;
}

/**
 * t-분포 확률밀도함수 (PDF)
 */
function tPDF(t: number, df: number): number {
  const numerator = gamma((df + 1) / 2);
  const denominator = Math.sqrt(df * Math.PI) * gamma(df / 2);
  const base = 1 + (t * t) / df;
  return (numerator / denominator) * Math.pow(base, -(df + 1) / 2);
}

/**
 * 표준정규분포 CDF (Φ(z))
 */
function normalCDF(z: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.SQRT2;

  const t = 1.0 / (1.0 + p * z);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

  return 0.5 * (1.0 + sign * y);
}

/**
 * 표준정규분포 분위수 (Φ^-1(p))
 * Acklam's approximation
 */
function normalQuantile(p: number): number {
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.383577518672690e2,
    -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1,
    -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734,
    4.374664141464968, 2.938163982698783,
  ];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q: number;
  let r: number;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    );
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return (
      -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
}

/**
 * 감마 함수 근사 (Stirling's approximation)
 */
function gamma(z: number): number {
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  }

  z -= 1;
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];

  let x = c[0];
  for (let i = 1; i < g + 2; i++) {
    x += c[i] / (z + i);
  }

  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

/**
 * 불완전 베타 함수 근사
 */
function incompleteBeta(x: number, a: number, b: number): number {
  if (x === 0) return 0;
  if (x === 1) return 1;

  // 연분수 전개 (Lentz's algorithm)
  const maxIterations = 200;
  const epsilon = 1e-10;

  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;

  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < epsilon) d = epsilon;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= maxIterations; m++) {
    const m2 = 2 * m;

    // Even step
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < epsilon) d = epsilon;
    c = 1 + aa / c;
    if (Math.abs(c) < epsilon) c = epsilon;
    d = 1 / d;
    h *= d * c;

    // Odd step
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < epsilon) d = epsilon;
    c = 1 + aa / c;
    if (Math.abs(c) < epsilon) c = epsilon;
    d = 1 / d;
    const delta = d * c;
    h *= delta;

    if (Math.abs(delta - 1) < epsilon) break;
  }

  const betaValue = (gamma(a) * gamma(b)) / gamma(a + b);
  return (Math.pow(x, a) * Math.pow(1 - x, b) * h) / (a * betaValue);
}

/**
 * A/B 테스트 결과 요약 문자열 생성
 */
export function formatTTestResult(result: TTestResult, variantNames: [string, string] = ['A', 'B']): string {
  const [nameA, nameB] = variantNames;
  const improved = result.meanDifference < 0;
  const direction = improved ? '개선' : '악화';
  const absChange = Math.abs(result.meanDifference);

  const lines = [
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `                    A/B 테스트 결과`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `📊 기본 정보`,
    `   표본 크기: ${result.sampleSize}쌍`,
    `   자유도: ${result.degreesOfFreedom}`,
    ``,
    `📈 측정 결과`,
    `   평균 차이 (${nameB} - ${nameA}): ${result.meanDifference.toFixed(1)}ms`,
    `   표준 오차: ${result.standardError.toFixed(2)}ms`,
    ``,
    `📐 95% 신뢰구간`,
    `   [${result.confidenceInterval[0].toFixed(1)}ms, ${result.confidenceInterval[1].toFixed(1)}ms]`,
    ``,
    `🔬 통계적 검정`,
    `   t-통계량: ${result.tStatistic.toFixed(3)}`,
    `   p-value: ${result.pValue.toFixed(4)}${result.pValue < 0.01 ? ' **' : result.pValue < 0.05 ? ' *' : ''}`,
    `   유의성: ${result.significant ? '✅ 통계적으로 유의함 (p < 0.05)' : '❌ 통계적으로 유의하지 않음'}`,
    ``,
    `📏 효과크기`,
    `   Cohen's d: ${result.effectSize.toFixed(2)} (${getEffectSizeLabel(result.effectInterpretation)})`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `💡 결론: ${result.significant ? `${nameB}는 ${nameA} 대비 ${absChange.toFixed(0)}ms ${direction} (${result.effectInterpretation} effect)` : '두 variant 간 유의미한 차이 없음'}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
  ];

  return lines.join('\n');
}

/**
 * 권장 표본 크기 계산 (Power analysis)
 *
 * @param expectedEffectSize - 예상 효과크기 (Cohen's d)
 * @param power - 검정력 (기본값 0.8)
 * @param alpha - 유의수준 (기본값 0.05)
 */
export function calculateRequiredSampleSize(
  expectedEffectSize: number,
  power: number = 0.8,
  alpha: number = 0.05
): number {
  // z-값 계산
  const zAlpha = normalQuantile(1 - alpha / 2);
  const zBeta = normalQuantile(power);

  // paired t-test용 표본 크기 공식
  const n = Math.pow((zAlpha + zBeta) / expectedEffectSize, 2);

  return Math.ceil(n);
}
