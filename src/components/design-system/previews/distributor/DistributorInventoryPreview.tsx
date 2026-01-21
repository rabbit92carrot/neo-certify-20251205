'use client';

import { InventoryView, type InventoryViewProps } from '@/components/views/shared';

/**
 * Distributor Inventory Preview 컴포넌트
 */
export function DistributorInventoryPreview(props: InventoryViewProps): React.ReactElement {
  return <InventoryView {...props} />;
}
