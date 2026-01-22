'use client';

import {
  ManufacturerDashboardView,
  type ManufacturerDashboardViewProps,
} from '@/components/views/manufacturer';

/**
 * Manufacturer Dashboard Preview 컴포넌트
 * Design System 캔버스에서 사용
 */
export function ManufacturerDashboardPreview(
  props: ManufacturerDashboardViewProps
): React.ReactElement {
  return <ManufacturerDashboardView {...props} />;
}
