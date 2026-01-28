'use server';

import {
  getNotificationMessages,
  type NotificationType,
  type NotificationItem,
} from '@/services/notification.service';
import { simulateSend } from '@/services/alimtalk.service';

interface LoadMessagesParams {
  phoneNumber?: string;
  type?: NotificationType;
  page: number;
}

interface LoadMessagesResult {
  items: NotificationItem[];
  hasMore: boolean;
}

interface SimulateSendParams {
  templateCode: string;
  recipientPhone: string;
  message: string;
  type: 'CERTIFICATION' | 'RECALL';
  buttons?: { name: string; url: string }[];
}

interface SimulateSendResult {
  success: boolean;
  notificationId?: string;
  error?: string;
}

/**
 * 발송 시뮬레이션 Server Action
 * 변수 치환된 메시지를 notification_messages에 저장
 */
export async function simulateAlimtalkSend(params: SimulateSendParams): Promise<SimulateSendResult> {
  const result = await simulateSend({
    templateCode: params.templateCode,
    recipientPhone: params.recipientPhone,
    message: params.message,
    type: params.type,
    buttons: params.buttons,
  });

  if (!result.success || !result.data) {
    return { success: false, error: result.error?.message ?? '시뮬레이션 실패' };
  }

  return { success: true, notificationId: result.data.notificationId };
}

/**
 * 알림 메시지 더보기 Server Action
 */
export async function loadMoreMessages(params: LoadMessagesParams): Promise<LoadMessagesResult> {
  const result = await getNotificationMessages({
    phoneNumber: params.phoneNumber,
    type: params.type,
    page: params.page,
    pageSize: 20,
  });

  if (!result.success || !result.data) {
    return { items: [], hasMore: false };
  }

  return {
    items: result.data.items,
    hasMore: result.data.meta.hasMore,
  };
}
