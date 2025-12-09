import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/services/auth.service';
import { getAvailableProductsForShipment } from '@/services/inventory.service';
import { getProductInventoryDetail } from '@/services/inventory.service';
import { getShipmentTargetOrganizations } from '@/services/shipment.service';
import { PageHeader } from '@/components/shared';
import { ShipmentForm } from '@/components/forms/ShipmentForm';
import { createShipmentAction } from '../actions';

export const metadata = {
  title: '출고 | 제조사',
  description: '유통사 또는 병원으로 제품 출고',
};

/**
 * 제조사 출고 페이지
 */
export default async function ManufacturerShipmentPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser();

  if (user?.organization.type !== 'MANUFACTURER') {
    redirect('/login');
  }

  // 출고 가능한 제품 목록 조회 (재고 있는 제품만)
  const productsResult = await getAvailableProductsForShipment(user.organization.id);
  const products = productsResult.success ? productsResult.data! : [];

  // 각 제품의 Lot별 재고 정보 조회 (제조사는 Lot 선택 가능)
  const productsWithLots = await Promise.all(
    products.map(async (product) => {
      const detailResult = await getProductInventoryDetail(user.organization.id, product.id);
      return {
        ...product,
        lots: detailResult.success ? detailResult.data!.byLot : [],
      };
    })
  );

  // 출고 대상 조직 목록 조회
  const targetOrgsResult = await getShipmentTargetOrganizations(user.organization.type);
  const targetOrganizations = targetOrgsResult.success ? targetOrgsResult.data! : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="출고"
        description="유통사 또는 병원으로 제품을 출고합니다. FIFO 방식으로 자동 출고되며, 특정 Lot을 선택할 수도 있습니다."
      />

      <ShipmentForm
        organizationType={user.organization.type}
        products={productsWithLots}
        targetOrganizations={targetOrganizations}
        onSubmit={createShipmentAction}
        canSelectLot={true}
      />
    </div>
  );
}
