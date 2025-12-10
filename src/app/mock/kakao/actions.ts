'use server';

import {
  getNotificationMessages,
  type NotificationType,
  type NotificationItem,
} from '@/services/notification.service';

interface LoadMessagesParams {
  phoneNumber?: string;
  type?: NotificationType;
  page: number;
}

interface LoadMessagesResult {
  items: NotificationItem[];
  hasMore: boolean;
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
