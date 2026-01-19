/**
 * Hospital Treatment Preview 컴포넌트
 * Design System 페이지 맵에서 시술 등록 페이지 미리보기
 */

import { TreatmentView, type TreatmentViewProps } from '@/components/views/hospital';

export function HospitalTreatmentPreview(
  props: TreatmentViewProps
): React.ReactElement {
  return <TreatmentView {...props} />;
}
