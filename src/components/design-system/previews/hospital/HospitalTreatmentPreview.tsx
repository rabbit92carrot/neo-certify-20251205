/**
 * Hospital Treatment Preview 컴포넌트
 * Design System 페이지 맵에서 시술 등록 페이지 미리보기
 */

import { TreatmentView, type TreatmentViewProps } from '@/components/views/hospital';

/** Preview용 mock 환자 검색 함수 (Server Action 인증 오류 방지) */
const mockSearchFn = async (_query: string) => ({
  success: true,
  data: ['010-1234-5678', '010-9876-5432'],
});

export function HospitalTreatmentPreview(
  props: TreatmentViewProps
): React.ReactElement {
  return <TreatmentView {...props} searchFn={mockSearchFn} />;
}
