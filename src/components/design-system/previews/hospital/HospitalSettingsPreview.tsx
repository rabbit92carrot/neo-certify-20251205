/**
 * Hospital Settings Preview 컴포넌트
 * Design System 페이지 맵에서 설정 페이지 미리보기
 */

import { HospitalSettingsView, type HospitalSettingsViewProps } from '@/components/views/hospital';

export function HospitalSettingsPreview(
  props: HospitalSettingsViewProps
): React.ReactElement {
  return <HospitalSettingsView {...props} />;
}
