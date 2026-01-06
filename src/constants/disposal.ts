/**
 * 폐기 관련 상수 정의
 * 병원에서 제품 폐기 시 사용되는 사유 타입 등을 정의합니다.
 */

/**
 * 폐기 사유 타입
 */
export const DISPOSAL_REASON_TYPES = {
  TREATMENT_LOSS: 'TREATMENT_LOSS',
  EXPIRED: 'EXPIRED',
  DEFECTIVE: 'DEFECTIVE',
  OTHER: 'OTHER',
} as const;

export type DisposalReasonType = (typeof DISPOSAL_REASON_TYPES)[keyof typeof DISPOSAL_REASON_TYPES];

/**
 * 폐기 사유 레이블 (한글)
 */
export const DISPOSAL_REASON_LABELS: Record<DisposalReasonType, string> = {
  TREATMENT_LOSS: '시술 중 손실',
  EXPIRED: '유효기간 만료',
  DEFECTIVE: '제품 불량',
  OTHER: '기타',
};

/**
 * 폐기 사유 목록 (드롭다운용)
 */
export const DISPOSAL_REASON_OPTIONS = Object.entries(DISPOSAL_REASON_LABELS).map(
  ([value, label]) => ({
    value: value as DisposalReasonType,
    label,
  })
);
