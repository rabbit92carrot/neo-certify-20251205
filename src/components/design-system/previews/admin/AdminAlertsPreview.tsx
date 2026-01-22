'use client';

/**
 * Admin Alerts Preview 컴포넌트
 * Design System 페이지 맵에서 알림 관리 페이지 미리보기
 */

import { AlertsView, type AlertsViewProps } from '@/components/views/admin';

export function AdminAlertsPreview(
  props: AlertsViewProps
): React.ReactElement {
  return <AlertsView {...props} />;
}
