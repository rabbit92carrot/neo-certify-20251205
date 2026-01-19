/**
 * Hospital History Preview 컴포넌트
 * Design System 페이지 맵에서 병원 거래이력 페이지 미리보기
 */

import { HistoryView, type HistoryViewProps } from '@/components/views/shared';

export function HospitalHistoryPreview(
  props: HistoryViewProps
): React.ReactElement {
  return (
    <HistoryView
      {...props}
      title="거래 이력"
      description="입고, 시술, 폐기 이력을 확인할 수 있습니다."
    />
  );
}
