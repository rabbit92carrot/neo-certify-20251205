/**
 * 조직 알림 서비스
 * 조직 간 알림 조회, 읽음 처리, 미읽은 카운트 관련 비즈니스 로직
 */

import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  ApiResponse,
  PaginatedResponse,
  OrganizationAlert,
  OrganizationAlertType,
} from '@/types/api.types';

// 캐시 TTL 상수 (초)
const ALERT_COUNT_CACHE_TTL = 60; // 1분

/**
 * 조직 알림 목록 조회 (보관함)
 *
 * @param organizationId 조직 ID
 * @param options 조회 옵션
 * @returns 페이지네이션된 알림 목록
 */
export async function getOrganizationAlerts(
  organizationId: string,
  options: {
    page?: number;
    pageSize?: number;
    isRead?: boolean;
    alertType?: OrganizationAlertType;
  } = {}
): Promise<ApiResponse<PaginatedResponse<OrganizationAlert>>> {
  const supabase = await createClient();
  const { page = 1, pageSize = 20, isRead, alertType } = options;
  const offset = (page - 1) * pageSize;

  let queryBuilder = supabase
    .from('organization_alerts')
    .select('*', { count: 'exact' })
    .eq('recipient_org_id', organizationId)
    .order('created_at', { ascending: false });

  // 읽음 여부 필터
  if (isRead !== undefined) {
    queryBuilder = queryBuilder.eq('is_read', isRead);
  }

  // 알림 유형 필터
  if (alertType) {
    queryBuilder = queryBuilder.eq('alert_type', alertType);
  }

  const { data, count, error } = await queryBuilder.range(offset, offset + pageSize - 1);

  if (error) {
    return {
      success: false,
      error: {
        code: 'QUERY_ERROR',
        message: '알림 조회에 실패했습니다.',
      },
    };
  }

  const total = count || 0;

  // DB 데이터를 API 타입으로 변환
  const alerts: OrganizationAlert[] = (data || []).map((row) => ({
    id: row.id,
    alertType: row.alert_type as OrganizationAlertType,
    recipientOrgId: row.recipient_org_id,
    title: row.title,
    content: row.content,
    metadata: row.metadata as OrganizationAlert['metadata'],
    isRead: row.is_read,
    readAt: row.read_at ?? undefined,
    createdAt: row.created_at,
  }));

  return {
    success: true,
    data: {
      items: alerts,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: offset + pageSize < total,
      },
    },
  };
}

/**
 * 알림 읽음 처리
 *
 * @param organizationId 조직 ID
 * @param alertId 알림 ID
 * @returns 성공 여부
 */
export async function markAlertAsRead(
  organizationId: string,
  alertId: string
): Promise<ApiResponse<void>> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('organization_alerts')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .eq('recipient_org_id', organizationId);

  if (error) {
    return {
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: '알림 읽음 처리에 실패했습니다.',
      },
    };
  }

  return { success: true };
}

/**
 * 여러 알림 읽음 처리
 *
 * @param organizationId 조직 ID
 * @param alertIds 알림 ID 배열
 * @returns 성공 여부
 */
export async function markAlertsAsRead(
  organizationId: string,
  alertIds: string[]
): Promise<ApiResponse<void>> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('organization_alerts')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .in('id', alertIds)
    .eq('recipient_org_id', organizationId);

  if (error) {
    return {
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: '알림 읽음 처리에 실패했습니다.',
      },
    };
  }

  return { success: true };
}

/**
 * 모든 알림 읽음 처리
 *
 * @param organizationId 조직 ID
 * @returns 성공 여부
 */
export async function markAllAlertsAsRead(
  organizationId: string
): Promise<ApiResponse<void>> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('organization_alerts')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('recipient_org_id', organizationId)
    .eq('is_read', false);

  if (error) {
    return {
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: '알림 읽음 처리에 실패했습니다.',
      },
    };
  }

  return { success: true };
}

/**
 * 미읽은 알림 카운트 조회
 *
 * @param organizationId 조직 ID
 * @returns 미읽은 알림 개수
 */
export async function getUnreadAlertCount(
  organizationId: string
): Promise<ApiResponse<number>> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('organization_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_org_id', organizationId)
    .eq('is_read', false);

  if (error) {
    return {
      success: false,
      error: {
        code: 'QUERY_ERROR',
        message: '알림 카운트 조회에 실패했습니다.',
      },
    };
  }

  return { success: true, data: count || 0 };
}

/**
 * 캐싱된 미읽은 알림 카운트 조회
 *
 * @param organizationId 조직 ID
 * @returns 미읽은 알림 개수
 */
export const getCachedUnreadAlertCount = (organizationId: string) =>
  unstable_cache(
    async () => {
      const result = await getUnreadAlertCount(organizationId);
      return result;
    },
    [`unread-alerts-${organizationId}`],
    {
      tags: ['alerts', `alerts-${organizationId}`],
      revalidate: ALERT_COUNT_CACHE_TTL,
    }
  )();

/**
 * 알림 상세 조회
 *
 * @param organizationId 조직 ID
 * @param alertId 알림 ID
 * @returns 알림 상세 정보
 */
export async function getAlertDetail(
  organizationId: string,
  alertId: string
): Promise<ApiResponse<OrganizationAlert>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organization_alerts')
    .select('*')
    .eq('id', alertId)
    .eq('recipient_org_id', organizationId)
    .single();

  if (error || !data) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: '알림을 찾을 수 없습니다.',
      },
    };
  }

  const alert: OrganizationAlert = {
    id: data.id,
    alertType: data.alert_type as OrganizationAlertType,
    recipientOrgId: data.recipient_org_id,
    title: data.title,
    content: data.content,
    metadata: data.metadata as OrganizationAlert['metadata'],
    isRead: data.is_read,
    readAt: data.read_at ?? undefined,
    createdAt: data.created_at,
  };

  return { success: true, data: alert };
}
