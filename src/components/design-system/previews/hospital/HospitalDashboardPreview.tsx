'use client';

import {
  HospitalDashboardView,
  type HospitalDashboardViewProps,
} from '@/components/views/hospital';

/**
 * Hospital Dashboard Preview 컴포넌트
 * Design System 캔버스에서 사용
 */
export function HospitalDashboardPreview(props: HospitalDashboardViewProps): React.ReactElement {
  return <HospitalDashboardView {...props} />;
}
