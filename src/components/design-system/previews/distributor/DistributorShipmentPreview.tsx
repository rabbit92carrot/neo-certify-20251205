/**
 * Distributor Shipment Preview 컴포넌트
 * Design System 페이지 맵에서 유통사 출고 페이지 미리보기
 */

import { ShipmentView, type ShipmentViewProps } from '@/components/views/shared';

export function DistributorShipmentPreview(
  props: ShipmentViewProps
): React.ReactElement {
  return <ShipmentView {...props} />;
}
