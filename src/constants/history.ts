/**
 * 이력 관련 상수 정의
 */

export const HISTORY_ACTION_TYPES = {
  PRODUCED: 'PRODUCED',
  SHIPPED: 'SHIPPED',
  RECEIVED: 'RECEIVED',
  TREATED: 'TREATED',
  RECALLED: 'RECALLED',
  RETURN_SENT: 'RETURN_SENT',
  RETURN_RECEIVED: 'RETURN_RECEIVED',
  DISPOSED: 'DISPOSED',
  /** @deprecated Use RETURN_SENT or RETURN_RECEIVED instead */
  RETURNED: 'RETURNED',
} as const;

export const HISTORY_ACTION_TYPE_LABELS: Record<HistoryActionType, string> = {
  PRODUCED: '생산',
  SHIPPED: '출고',
  RECEIVED: '입고',
  TREATED: '시술',
  RECALLED: '회수',
  RETURN_SENT: '반품 출고',
  RETURN_RECEIVED: '반품 입고',
  DISPOSED: '폐기',
  /** @deprecated Legacy label */
  RETURNED: '반품',
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
