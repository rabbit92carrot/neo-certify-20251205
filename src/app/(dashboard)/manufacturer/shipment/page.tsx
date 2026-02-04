import { redirect } from 'next/navigation';
import { getCachedCurrentUser } from '@/services/auth.service';
import { getTopProductsForShipment } from '@/services/inventory.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { ShipmentFormWrapperV2 } from '@/components/forms/shipment/ShipmentFormWrapperV2';
import {
  createShipmentAction,
  searchShipmentTargetsAction,
  searchShipmentProductsAction,
  getProductLotsAction,
  getAllProductsForShipmentDialogAction,
} from '../actions';

export const metadata = {
  title: '출고 | 제조사',
  description: '유통사 또는 병원으로 제품 출고',
};

/**
 * 제조사 출고 페이지
 * 최적화:
 * - getTopProductsForShipment로 초기 12개만 로드 (Lot 제외)
 * - Lot은 제품 선택 시 lazy load
 * - 조직 목록은 검색 시에만 조회 (Lazy Load)
 */
export default async function ManufacturerShipmentPage(): Promise<React.ReactElement> {
  const user = await getCachedCurrentUser();

  if (user?.organization.type !== 'MANUFACTURER') {
    redirect('/login');
  }

  const orgId = user.organization.id;
  const orgType = user.organization.type;

  // 상위 12개 제품 조회 (Lot 제외로 빠른 로딩)
  const productsResult = await getTopProductsForShipment(orgId, { limit: 12 });
  const initialProducts = productsResult.success ? productsResult.data! : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="출고"
        description="유통사 또는 병원으로 제품을 출고합니다. FIFO 방식으로 자동 출고되며, 특정 Lot을 선택할 수도 있습니다."
      />

      <ShipmentFormWrapperV2
        organizationId={orgId}
        organizationType={orgType}
        initialProducts={initialProducts}
        onSubmit={createShipmentAction}
        canSelectLot={true}
        searchTargetsAction={searchShipmentTargetsAction}
        searchProductsAction={searchShipmentProductsAction}
        getProductLotsAction={getProductLotsAction}
        getAllProductsAction={getAllProductsForShipmentDialogAction}
      />
    </div>
  );
}
