import { redirect } from 'next/navigation';
import { getCachedCurrentUser } from '@/services/auth.service';
import { getProductsWithLotsForShipment } from '@/services/inventory.service';
import { getCachedShipmentTargetOrganizations } from '@/services/shipment.service';
import { PageHeader } from '@/components/shared';
import { ShipmentForm } from '@/components/forms/ShipmentForm';
import { createShipmentAction } from '../actions';

export const metadata = {
  title: '출고 | 제조사',
  description: '유통사 또는 병원으로 제품 출고',
};

/**
 * 제조사 출고 페이지
 * 최적화: getProductsWithLotsForShipment로 N+1 쿼리 방지
 */
export default async function ManufacturerShipmentPage(): Promise<React.ReactElement> {
  const user = await getCachedCurrentUser();

  if (user?.organization.type !== 'MANUFACTURER') {
    redirect('/login');
  }

  const orgId = user.organization.id;
  const orgType = user.organization.type;

  // 병렬로 데이터 조회
  const [productsResult, targetOrgsResult] = await Promise.all([
    // 제품 + Lot 정보를 한 번에 조회 (N+1 쿼리 방지)
    getProductsWithLotsForShipment(orgId),
    // 캐싱된 대상 조직 목록 조회
    getCachedShipmentTargetOrganizations(orgType, orgId),
  ]);

  const productsWithLots = productsResult.success ? productsResult.data! : [];
  const targetOrganizations = targetOrgsResult.success ? targetOrgsResult.data! : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="출고"
        description="유통사 또는 병원으로 제품을 출고합니다. FIFO 방식으로 자동 출고되며, 특정 Lot을 선택할 수도 있습니다."
      />

      <ShipmentForm
        organizationType={orgType}
        products={productsWithLots}
        targetOrganizations={targetOrganizations}
        onSubmit={createShipmentAction}
        canSelectLot={true}
      />
    </div>
  );
}
