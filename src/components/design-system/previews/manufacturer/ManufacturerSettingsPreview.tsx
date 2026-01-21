/**
 * Manufacturer Settings Preview 컴포넌트
 * Design System 페이지 맵에서 설정 페이지 미리보기
 */

import { ManufacturerSettingsView, type ManufacturerSettingsViewProps } from '@/components/views/manufacturer';

export function ManufacturerSettingsPreview(
  props: ManufacturerSettingsViewProps
): React.ReactElement {
  return <ManufacturerSettingsView {...props} />;
}
