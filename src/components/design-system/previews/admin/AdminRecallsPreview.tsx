'use client';

/**
 * Admin Recalls Preview 컴포넌트
 * Design System 페이지 맵에서 회수 이력 페이지 미리보기
 */

import { RecallsView, type RecallsViewProps } from '@/components/views/admin';

export function AdminRecallsPreview(
  props: RecallsViewProps
): React.ReactElement {
  return <RecallsView {...props} />;
}
