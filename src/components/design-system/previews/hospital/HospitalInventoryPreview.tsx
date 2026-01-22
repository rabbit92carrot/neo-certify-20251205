'use client';

import { InventoryView, type InventoryViewProps } from '@/components/views/shared';

/**
 * Hospital Inventory Preview 컴포넌트
 */
export function HospitalInventoryPreview(props: InventoryViewProps): React.ReactElement {
  return <InventoryView {...props} />;
}
