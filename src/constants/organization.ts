/**
 * 조직 관련 상수 정의
 * SSOT 원칙에 따라 이 파일에서만 조직 관련 상수를 정의합니다.
 */

export const ORGANIZATION_TYPES = {
  MANUFACTURER: 'MANUFACTURER',
  DISTRIBUTOR: 'DISTRIBUTOR',
  HOSPITAL: 'HOSPITAL',
  ADMIN: 'ADMIN',
} as const;

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  MANUFACTURER: '제조사',
  DISTRIBUTOR: '유통사',
  HOSPITAL: '병원',
  ADMIN: '관리자',
};

export const ORGANIZATION_STATUSES = {
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  DELETED: 'DELETED',
} as const;

export const ORGANIZATION_STATUS_LABELS: Record<OrganizationStatus, string> = {
  PENDING_APPROVAL: '승인 대기',
  ACTIVE: '활성',
  INACTIVE: '비활성',
  DELETED: '삭제됨',
};

// 타입 추출
export type OrganizationType = (typeof ORGANIZATION_TYPES)[keyof typeof ORGANIZATION_TYPES];
export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[keyof typeof ORGANIZATION_STATUSES];
