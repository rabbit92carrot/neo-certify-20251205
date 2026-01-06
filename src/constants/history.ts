/**
 * 이력 관련 상수 정의
 */

export const HISTORY_ACTION_TYPES = {
  PRODUCED: 'PRODUCED',
  SHIPPED: 'SHIPPED',
  RECEIVED: 'RECEIVED',
  TREATED: 'TREATED',
  RECALLED: 'RECALLED',
  RETURNED: 'RETURNED',
  DISPOSED: 'DISPOSED',
} as const;

export const HISTORY_ACTION_TYPE_LABELS: Record<HistoryActionType, string> = {
  PRODUCED: '생산',
  SHIPPED: '출고',
  RECEIVED: '입고',
  TREATED: '시술',
  RECALLED: '회수',
  RETURNED: '반품',
  DISPOSED: '폐기',
};

export const NOTIFICATION_TYPES = {
  CERTIFICATION: 'CERTIFICATION',
  RECALL: 'RECALL',
} as const;

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  CERTIFICATION: '정품 인증',
  RECALL: '회수 알림',
};

// 타입 추출
export type HistoryActionType = (typeof HISTORY_ACTION_TYPES)[keyof typeof HISTORY_ACTION_TYPES];
export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];
