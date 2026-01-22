/**
 * Hospital Disposal Preview 컴포넌트
 * Design System 페이지 맵에서 폐기 등록 페이지 미리보기
 */

import { DisposalView, type DisposalViewProps } from '@/components/views/hospital';

export function HospitalDisposalPreview(
  props: DisposalViewProps
): React.ReactElement {
  return <DisposalView {...props} />;
}
