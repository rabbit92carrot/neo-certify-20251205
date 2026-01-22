'use client';

/**
 * Admin Approvals Preview 컴포넌트
 * Design System 페이지 맵에서 가입 승인 페이지 미리보기
 */

import { ApprovalsView, type ApprovalsViewProps } from '@/components/views/admin';

export function AdminApprovalsPreview(
  props: ApprovalsViewProps
): React.ReactElement {
  return <ApprovalsView {...props} />;
}
