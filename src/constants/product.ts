/**
 * 제품 및 가상 코드 관련 상수 정의
 */

export const VIRTUAL_CODE_STATUSES = {
  IN_STOCK: 'IN_STOCK',
  USED: 'USED',
  DISPOSED: 'DISPOSED',
} as const;

export const VIRTUAL_CODE_STATUS_LABELS: Record<VirtualCodeStatus, string> = {
  IN_STOCK: '재고',
  USED: '사용됨',
  DISPOSED: '폐기됨',
};

export const OWNER_TYPES = {
  ORGANIZATION: 'ORGANIZATION',
  PATIENT: 'PATIENT',
} as const;

export const OWNER_TYPE_LABELS: Record<OwnerType, string> = {
  ORGANIZATION: '조직',
  PATIENT: '환자',
};

// 타입 추출
export type VirtualCodeStatus = (typeof VIRTUAL_CODE_STATUSES)[keyof typeof VIRTUAL_CODE_STATUSES];
export type OwnerType = (typeof OWNER_TYPES)[keyof typeof OWNER_TYPES];
