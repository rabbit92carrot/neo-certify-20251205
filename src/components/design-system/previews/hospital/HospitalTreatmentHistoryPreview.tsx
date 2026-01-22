/**
 * Hospital Treatment History Preview 컴포넌트
 * Design System 페이지 맵에서 시술 이력 페이지 미리보기
 */

import { TreatmentHistoryView, type TreatmentHistoryViewProps } from '@/components/views/hospital';

export function HospitalTreatmentHistoryPreview(
  props: TreatmentHistoryViewProps
): React.ReactElement {
  return <TreatmentHistoryView {...props} />;
}
