'use client';

import { InventoryView, type InventoryViewProps } from '@/components/views/shared';

/**
 * Manufacturer Inventory Preview 컴포넌트
 */
export function ManufacturerInventoryPreview(props: InventoryViewProps): React.ReactElement {
  return <InventoryView {...props} />;
}
