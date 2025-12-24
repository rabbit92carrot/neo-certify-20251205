import { redirect } from 'next/navigation';
import { getCachedCurrentUser } from '@/services/auth.service';
import { getAvailableProductsForShipment } from '@/services/inventory.service';
import { PageHeader } from '@/components/shared';
import { ShipmentFormWrapper } from '@/components/forms/shipment/ShipmentFormWrapper';
import { createShipmentAction, searchShipmentTargetsAction } from '../actions';

export const metadata = {
  title: '출고 | 유통사',
  description: '유통사 또는 병원으로 제품 출고',
};

/**
 * 유통사 출고 페이지
 * 최적화:
 * - 조직 목록은 Lazy Load (검색 시에만 조회)로 초기 로딩 최소화
 */
export default async function DistributorShipmentPage(): Promise<React.ReactElement> {
  const user = await getCachedCurrentUser();

  if (user?.organization.type !== 'DISTRIBUTOR') {
    redirect('/login');
  }

  const orgId = user.organization.id;
  const orgType = user.organization.type;

  // 제품 목록 조회 (조직 목록은 Lazy Load로 변경)
  const productsResult = await getAvailableProductsForShipment(orgId);
  const products = productsResult.success ? productsResult.data! : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="출고"
        description="유통사 또는 병원으로 제품을 출고합니다. FIFO 방식으로 자동 출고됩니다."
      />

      <ShipmentFormWrapper
        organizationType={orgType}
        products={products}
        onSubmit={createShipmentAction}
        canSelectLot={false}
        searchTargetsAction={searchShipmentTargetsAction}
      />
    </div>
  );
}
