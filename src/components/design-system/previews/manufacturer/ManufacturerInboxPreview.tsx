/**
 * Manufacturer Inbox Preview 컴포넌트
 * Design System 페이지 맵에서 메시지함 페이지 미리보기
 */

import { InboxView, type InboxViewProps } from '@/components/views/shared';

export function ManufacturerInboxPreview(
  props: InboxViewProps
): React.ReactElement {
  return <InboxView {...props} />;
}
