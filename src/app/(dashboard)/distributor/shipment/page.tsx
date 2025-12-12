import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/services/auth.service';
import { getAvailableProductsForShipment } from '@/services/inventory.service';
import { getShipmentTargetOrganizations } from '@/services/shipment.service';
import { PageHeader } from '@/components/shared';
import { ShipmentForm } from '@/components/forms/ShipmentForm';
import { createShipmentAction } from '../actions';

export const metadata = {
  title: '출고 | 유통사',
  description: '유통사 또는 병원으로 제품 출고',
};

/**
 * 유통사 출고 페이지
 */
export default async function DistributorShipmentPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser();

  if (user?.organization.type !== 'DISTRIBUTOR') {
    redirect('/login');
  }

  // 출고 가능한 제품 목록 조회 (재고 있는 제품만)
  const productsResult = await getAvailableProductsForShipment(user.organization.id);
  const products = productsResult.success ? productsResult.data! : [];

  // 출고 대상 조직 목록 조회 (자기 자신 제외)
  const targetOrgsResult = await getShipmentTargetOrganizations(
    user.organization.type,
    user.organization.id
  );
  const targetOrganizations = targetOrgsResult.success ? targetOrgsResult.data! : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="출고"
        description="유통사 또는 병원으로 제품을 출고합니다. FIFO 방식으로 자동 출고됩니다."
      />

      <ShipmentForm
        organizationType={user.organization.type}
        products={products}
        targetOrganizations={targetOrganizations}
        onSubmit={createShipmentAction}
        canSelectLot={false}
      />
    </div>
  );
}
