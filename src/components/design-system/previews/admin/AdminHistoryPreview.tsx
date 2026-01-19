/**
 * Admin History Preview 컴포넌트
 * Design System 페이지 맵에서 관리자 전체 이력 페이지 미리보기
 */

import { AdminHistoryView, type AdminHistoryViewProps } from '@/components/views/admin';

export function AdminHistoryPreview(
  props: AdminHistoryViewProps
): React.ReactElement {
  return (
    <AdminHistoryView
      {...props}
      title="전체 이력"
      description="모든 이벤트 이력을 요약하여 조회합니다."
    />
  );
}
