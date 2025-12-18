import { redirect } from 'next/navigation';
import { getCachedCurrentUser } from '@/services/auth.service';
import { getAvailableProductsForShipment } from '@/services/inventory.service';
import { getCachedShipmentTargetOrganizations } from '@/services/shipment.service';
import { PageHeader } from '@/components/shared';
import { ShipmentForm } from '@/components/forms/ShipmentForm';
import { createShipmentAction } from '../actions';

export const metadata = {
  title: '출고 | 유통사',
  description: '유통사 또는 병원으로 제품 출고',
};

/**
 * 유통사 출고 페이지
 * 최적화: 병렬 데이터 페칭 + 캐싱된 대상 조직 목록
 */
export default async function DistributorShipmentPage(): Promise<React.ReactElement> {
  const user = await getCachedCurrentUser();

  if (user?.organization.type !== 'DISTRIBUTOR') {
    redirect('/login');
  }

  const orgId = user.organization.id;
  const orgType = user.organization.type;

  // 병렬로 데이터 조회
  const [productsResult, targetOrgsResult] = await Promise.all([
    // 출고 가능한 제품 목록 조회 (재고 있는 제품만)
    getAvailableProductsForShipment(orgId),
    // 캐싱된 대상 조직 목록 조회
    getCachedShipmentTargetOrganizations(orgType, orgId),
  ]);

  const products = productsResult.success ? productsResult.data! : [];
  const targetOrganizations = targetOrgsResult.success ? targetOrgsResult.data! : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="출고"
        description="유통사 또는 병원으로 제품을 출고합니다. FIFO 방식으로 자동 출고됩니다."
      />

      <ShipmentForm
        organizationType={orgType}
        products={products}
        targetOrganizations={targetOrganizations}
        onSubmit={createShipmentAction}
        canSelectLot={false}
      />
    </div>
  );
}
