/**
 * 알림 메시지 서비스
 * 카카오 알림톡 Mock 페이지용 데이터 조회
 *
 * 알림 유형:
 * - CERTIFICATION: 정품 인증 완료 알림
 * - RECALL: 인증 회수 알림
 */

import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, PaginatedResponse, NotificationMessage } from '@/types/api.types';
import type { Enums } from '@/types/database.types';
import { ERROR_CODES } from '@/constants/errors';
import { createErrorResponse, createSuccessResponse } from './common.service';

// ============================================================================
// 타입 정의
// ============================================================================

export type NotificationType = Enums<'notification_type'>;

/**
 * 알림 메시지 조회 파라미터
 */
export interface NotificationQueryParams {
  /** 전화번호 필터 (선택) */
  phoneNumber?: string;
  /** 메시지 유형 필터 (선택) */
  type?: NotificationType;
  /** 페이지 번호 (1부터 시작) */
  page?: number;
  /** 페이지 크기 */
  pageSize?: number;
}

/**
 * 알림 메시지 아이템 (UI용)
 */
export interface NotificationItem {
  id: string;
  type: NotificationType;
  typeLabel: string;
  patientPhone: string;
  content: string;
  isSent: boolean;
  createdAt: string;
}

// ============================================================================
// 상수
// ============================================================================

const DEFAULT_PAGE_SIZE = 20;

const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  CERTIFICATION: '정품 인증',
  RECALL: '인증 회수',
};

// ============================================================================
// 서비스 함수
// ============================================================================

/**
 * 알림 메시지 목록 조회
 * 공개 라우트용 - 인증 불필요
 */
export async function getNotificationMessages(
  params: NotificationQueryParams = {}
): Promise<ApiResponse<PaginatedResponse<NotificationItem>>> {
  try {
    const supabase = await createClient();

    const { phoneNumber, type, page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;

    // 기본 쿼리 - 최신순 정렬
    let query = supabase
      .from('notification_messages')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // 전화번호 필터 (정규화된 전화번호로 검색)
    if (phoneNumber) {
      const normalizedPhone = phoneNumber.replace(/[\s-]/g, '');
      query = query.eq('patient_phone', normalizedPhone);
    }

    // 메시지 유형 필터
    if (type) {
      query = query.eq('type', type);
    }

    // 페이지네이션
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: messages, error, count } = await query;

    if (error) {
      console.error('[Notification Service] Query error:', error);
      return createErrorResponse(ERROR_CODES.SERVER_ERROR, '알림 메시지 조회 중 오류가 발생했습니다.');
    }

    // 데이터 변환
    const items: NotificationItem[] = (messages || []).map((msg: NotificationMessage) => ({
      id: msg.id,
      type: msg.type,
      typeLabel: NOTIFICATION_TYPE_LABELS[msg.type],
      patientPhone: msg.patient_phone,
      content: msg.content,
      isSent: msg.is_sent,
      createdAt: msg.created_at,
    }));

    const totalCount = count ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return createSuccessResponse({
      items,
      meta: {
        page,
        pageSize,
        total: totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('[Notification Service] Unexpected error:', error);
    return createErrorResponse(ERROR_CODES.SERVER_ERROR, '서버 오류가 발생했습니다.');
  }
}

/**
 * 특정 환자의 알림 메시지 조회
 */
export async function getPatientNotifications(
  phoneNumber: string,
  params: { page?: number; pageSize?: number } = {}
): Promise<ApiResponse<PaginatedResponse<NotificationItem>>> {
  return getNotificationMessages({
    phoneNumber,
    ...params,
  });
}

/**
 * 알림 메시지 통계 조회
 */
export async function getNotificationStats(): Promise<
  ApiResponse<{
    totalCount: number;
    certificationCount: number;
    recallCount: number;
    sentCount: number;
    pendingCount: number;
  }>
> {
  try {
    const supabase = await createClient();

    // 전체 카운트
    const { count: totalCount, error: totalError } = await supabase
      .from('notification_messages')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      return createErrorResponse(ERROR_CODES.SERVER_ERROR, '통계 조회 오류');
    }

    // 인증 카운트
    const { count: certificationCount, error: certError } = await supabase
      .from('notification_messages')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'CERTIFICATION');

    if (certError) {
      return createErrorResponse(ERROR_CODES.SERVER_ERROR, '통계 조회 오류');
    }

    // 회수 카운트
    const { count: recallCount, error: recallError } = await supabase
      .from('notification_messages')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'RECALL');

    if (recallError) {
      return createErrorResponse(ERROR_CODES.SERVER_ERROR, '통계 조회 오류');
    }

    // 발송 완료 카운트
    const { count: sentCount, error: sentError } = await supabase
      .from('notification_messages')
      .select('*', { count: 'exact', head: true })
      .eq('is_sent', true);

    if (sentError) {
      return createErrorResponse(ERROR_CODES.SERVER_ERROR, '통계 조회 오류');
    }

    return createSuccessResponse({
      totalCount: totalCount ?? 0,
      certificationCount: certificationCount ?? 0,
      recallCount: recallCount ?? 0,
      sentCount: sentCount ?? 0,
      pendingCount: (totalCount ?? 0) - (sentCount ?? 0),
    });
  } catch (error) {
    console.error('[Notification Service] Stats error:', error);
    return createErrorResponse(ERROR_CODES.SERVER_ERROR, '서버 오류가 발생했습니다.');
  }
}
