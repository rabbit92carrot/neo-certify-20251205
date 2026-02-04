'use client';

/**
 * ShipmentForm V2 클라이언트 래퍼
 * Server Action을 클라이언트 컴포넌트 호환 형태로 변환합니다.
 *
 * V2 최적화:
 * - 초기 로딩 시 Lot 제외 (lazy load)
 * - 12개 제품만 초기 로딩
 * - 검색/즐겨찾기 기능
 */

import { useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Hospital, Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { SearchableComboboxOption } from '@/components/ui/searchable-combobox';
import type {
  ShipmentProductSummary,
  OrganizationType,
  Organization,
  InventoryByLot,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api.types';
import type { ShipmentItemData } from '@/lib/validations/shipment';

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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
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
 * Lazy-loaded ShipmentFormV2
 */
const ShipmentFormV2 = dynamic(
  () => import('./ShipmentFormV2').then((mod) => mod.ShipmentFormV2),
  { loading: () => <FormLoadingSkeleton /> }
);

interface ShipmentFormWrapperV2Props {
  organizationId: string;
  organizationType: OrganizationType;
  initialProducts: ShipmentProductSummary[];
  onSubmit: (
    toOrganizationId: string,
    items: ShipmentItemData[]
  ) => Promise<{ success: boolean; error?: { message: string } }>;
  canSelectLot?: boolean;
  searchTargetsAction: (
    query: string,
    limit?: number
  ) => Promise<ApiResponse<Pick<Organization, 'id' | 'name' | 'type'>[]>>;
  searchProductsAction: (
    search: string,
    favoriteIds: string[]
  ) => Promise<ApiResponse<ShipmentProductSummary[]>>;
  /** Lot 조회 액션 (canSelectLot=true 일 때만 필요) */
  getProductLotsAction?: (productId: string) => Promise<ApiResponse<InventoryByLot[]>>;
  getAllProductsAction?: (
    page: number,
    search: string
  ) => Promise<ApiResponse<PaginatedResponse<ShipmentProductSummary>>>;
}

/**
 * ShipmentFormV2를 위한 클라이언트 래퍼
 * Server Action 결과를 컴포넌트 호환 형식으로 변환합니다.
 */
export function ShipmentFormWrapperV2({
  organizationId,
  organizationType,
  initialProducts,
  onSubmit,
  canSelectLot,
  searchTargetsAction,
  searchProductsAction,
  getProductLotsAction,
  getAllProductsAction,
}: ShipmentFormWrapperV2Props): React.ReactElement {
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
    <ShipmentFormV2
      organizationId={organizationId}
      organizationType={organizationType}
      initialProducts={initialProducts}
      onSearchOrganizations={handleSearchOrganizations}
      onSubmit={onSubmit}
      canSelectLot={canSelectLot}
      searchProductsAction={searchProductsAction}
      getProductLotsAction={getProductLotsAction}
      getAllProductsAction={getAllProductsAction}
    />
  );
}
