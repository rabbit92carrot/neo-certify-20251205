import { redirect } from 'next/navigation';
import { getCachedCurrentUser } from '@/services/auth.service';
import { getTopProductsForShipment } from '@/services/inventory.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { ShipmentFormWrapperV2 } from '@/components/forms/shipment/ShipmentFormWrapperV2';
import {
  createShipmentAction,
  searchShipmentTargetsAction,
  searchShipmentProductsAction,
  getAllProductsForShipmentDialogAction,
} from '../actions';

export const metadata = {
  title: '출고 | 유통사',
  description: '유통사 또는 병원으로 제품 출고',
};

/**
 * 유통사 출고 페이지
 * V2 최적화:
 * - getTopProductsForShipment로 초기 12개만 로드 (Lot 제외)
 * - 조직 목록은 검색 시에만 조회 (Lazy Load)
 * - 제품 검색 및 전체 제품 다이얼로그 지원
 */
export default async function DistributorShipmentPage(): Promise<React.ReactElement> {
  const user = await getCachedCurrentUser();

  if (user?.organization.type !== 'DISTRIBUTOR') {
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
        description="유통사 또는 병원으로 제품을 출고합니다. FIFO 방식으로 자동 출고됩니다."
      />

      <ShipmentFormWrapperV2
        organizationId={orgId}
        organizationType={orgType}
        initialProducts={initialProducts}
        onSubmit={createShipmentAction}
        canSelectLot={false}
        searchTargetsAction={searchShipmentTargetsAction}
        searchProductsAction={searchShipmentProductsAction}
        getAllProductsAction={getAllProductsForShipmentDialogAction}
      />
    </div>
  );
}
