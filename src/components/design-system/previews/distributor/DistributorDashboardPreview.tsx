'use client';

import {
  DistributorDashboardView,
  type DistributorDashboardViewProps,
} from '@/components/views/distributor';

/**
 * Distributor Dashboard Preview 컴포넌트
 * Design System 캔버스에서 사용
 */
export function DistributorDashboardPreview(
  props: DistributorDashboardViewProps
): React.ReactElement {
  return <DistributorDashboardView {...props} />;
}
