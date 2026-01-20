'use client';

/**
 * 출고 View 컴포넌트
 * 제조사/유통사 공통 출고 페이지 뷰 (props 기반)
 * 실제 ShipmentForm 컴포넌트를 사용하여 동일한 UI 표시
 */

import { PageHeader } from '@/components/shared/PageHeader';
import { ShipmentForm } from '@/components/forms/ShipmentForm';
import type { OrganizationType, Product, InventoryByLot } from '@/types/api.types';
import type { SearchableComboboxOption } from '@/components/ui/searchable-combobox';

/**
 * 출고용 제품 (재고 포함)
 */
export interface ShipmentProductWithInventory extends Product {
  availableQuantity: number;
  lots?: InventoryByLot[];
}

export interface ShipmentViewProps {
  /** 조직 유형 */
  organizationType: OrganizationType;
  /** 출고 가능한 제품 목록 */
  products: ShipmentProductWithInventory[];
  /** 제조사는 Lot 선택 가능 */
  canSelectLot?: boolean;
}

/**
 * 출고 View - 실제 ShipmentForm 사용
 */
export function ShipmentView({
  organizationType,
  products,
  canSelectLot = false,
}: ShipmentViewProps): React.ReactElement {
  const isManufacturer = organizationType === 'MANUFACTURER';
  const description = isManufacturer
    ? '유통사 또는 병원으로 제품을 출고합니다. FIFO 방식으로 자동 출고되며, 특정 Lot을 선택할 수도 있습니다.'
    : '병원으로 제품을 출고합니다. FIFO 방식으로 가장 오래된 재고부터 자동 출고됩니다.';

  // Preview용 no-op 핸들러
  const handleSearchOrganizations = async (_query: string): Promise<SearchableComboboxOption[]> => {
    // Preview에서는 빈 배열 반환
    return [];
  };

  const handleSubmit = async (
    _toOrganizationId: string,
    _items: { productId: string; quantity: number; lotId?: string }[]
  ): Promise<{ success: boolean; error?: { message: string } }> => {
    // Preview에서는 항상 성공 반환 (실제 동작 없음)
    return { success: true };
  };

  return (
    <div className="space-y-6">
      <PageHeader title="출고" description={description} />

      <ShipmentForm
        organizationType={organizationType}
        products={products}
        onSearchOrganizations={handleSearchOrganizations}
        onSubmit={handleSubmit}
        canSelectLot={canSelectLot}
      />
    </div>
  );
}
