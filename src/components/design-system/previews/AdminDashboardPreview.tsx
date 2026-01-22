'use client';

import { AdminDashboardView, type AdminDashboardViewProps } from '@/components/views/admin';

/**
 * Admin Dashboard Preview 컴포넌트
 * AdminDashboardView를 mock 데이터와 함께 렌더링
 */
export function AdminDashboardPreview(props: AdminDashboardViewProps): React.ReactElement {
  return <AdminDashboardView {...props} />;
}
