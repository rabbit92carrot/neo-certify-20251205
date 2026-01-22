'use client';

/**
 * Admin Organizations Preview 컴포넌트
 * Design System 페이지 맵에서 조직 관리 페이지 미리보기
 */

import { OrganizationsView, type OrganizationsViewProps } from '@/components/views/admin';

export function AdminOrganizationsPreview(
  props: OrganizationsViewProps
): React.ReactElement {
  return <OrganizationsView {...props} />;
}
