'use client';

/**
 * ShipmentForm 클라이언트 래퍼
 * Server Action을 SearchableCombobox 호환 형태로 변환합니다.
 *
 * 성능 최적화:
 * - ShipmentForm을 dynamic import로 lazy loading (12KB 지연 로드)
 */

import { useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Hospital, Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { SearchableComboboxOption } from '@/components/ui/searchable-combobox';

/**
 * 폼 로딩 스켈레톤
 */
function FormLoadingSkeleton(): React.ReactElement {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Lazy-loaded ShipmentForm (12KB 지연 로드)
 */
const ShipmentForm = dynamic(
  () => import('@/components/forms/ShipmentForm').then((mod) => mod.ShipmentForm),
  { loading: () => <FormLoadingSkeleton /> }
);
import type { Product, Organization, OrganizationType, InventoryByLot, ApiResponse } from '@/types/api.types';
import type { ShipmentItemData } from '@/lib/validations/shipment';

interface ProductWithInventory extends Product {
  availableQuantity: number;
  lots?: InventoryByLot[];
}

interface ShipmentFormWrapperProps {
  organizationType: OrganizationType;
  products: ProductWithInventory[];
  onSubmit: (
    toOrganizationId: string,
    items: ShipmentItemData[]
  ) => Promise<{ success: boolean; error?: { message: string } }>;
  canSelectLot?: boolean;
  searchTargetsAction: (
    query: string,
    limit?: number
  ) => Promise<ApiResponse<Pick<Organization, 'id' | 'name' | 'type'>[]>>;
}

/**
 * ShipmentForm을 위한 클라이언트 래퍼
 * Server Action 결과를 SearchableComboboxOption으로 변환합니다.
 */
export function ShipmentFormWrapper({
  organizationType,
  products,
  onSubmit,
  canSelectLot,
  searchTargetsAction,
}: ShipmentFormWrapperProps): React.ReactElement {
  /**
   * 조직 검색 핸들러
   * Server Action을 호출하고 결과를 SearchableComboboxOption으로 변환합니다.
   */
  const handleSearchOrganizations = useCallback(
    async (query: string): Promise<SearchableComboboxOption[]> => {
      const result = await searchTargetsAction(query, 20);

      if (result.success && result.data) {
        return result.data.map((org) => ({
          value: org.id,
          label: org.name,
          icon:
            org.type === 'HOSPITAL' ? (
              <Hospital className="h-4 w-4" />
            ) : (
              <Building2 className="h-4 w-4" />
            ),
          description: org.type === 'HOSPITAL' ? '병원' : '유통사',
        }));
      }

      return [];
    },
    [searchTargetsAction]
  );

  return (
    <ShipmentForm
      organizationType={organizationType}
      products={products}
      onSearchOrganizations={handleSearchOrganizations}
      onSubmit={onSubmit}
      canSelectLot={canSelectLot}
    />
  );
}
