import { redirect } from 'next/navigation';
import { getCachedCurrentUser } from '@/services/auth.service';
import { getInventorySummary, getProductInventoryDetail } from '@/services/inventory.service';
import { getHospitalKnownProducts } from '@/services/hospital-product.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { InventoryTable } from '@/components/tables/InventoryTable';
import type { InventorySummaryWithAlias } from '@/types/api.types';

export const metadata = {
  title: '재고 조회 | 병원',
  description: '제품별 재고 현황 조회',
};

/**
 * 병원 재고 조회 페이지
 */
export default async function HospitalInventoryPage(): Promise<React.ReactElement> {
  const user = await getCachedCurrentUser();

  if (user?.organization.type !== 'HOSPITAL') {
    redirect('/login');
  }

  // 재고 요약 조회
  const summaryResult = await getInventorySummary(user.organization.id);
  const summaries = summaryResult.success ? summaryResult.data! : [];

  // 별칭 정보 조회 및 병합
  const knownProductsResult = await getHospitalKnownProducts(user.organization.id);
  const aliasMap = new Map<string, string | null>();
  if (knownProductsResult.success && knownProductsResult.data) {
    knownProductsResult.data.forEach((kp) => {
      aliasMap.set(kp.productId, kp.alias);
    });
  }

  // 별칭 정보 병합
  const summariesWithAlias: InventorySummaryWithAlias[] = summaries.map((s) => ({
    ...s,
    alias: aliasMap.get(s.productId) ?? null,
  }));

  // 상세 조회 함수 (클라이언트에서 호출)
  async function getDetail(productId: string) {
    'use server';
    const result = await getProductInventoryDetail(user!.organization.id, productId);
    return result.success ? result.data! : null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="재고 조회"
        description="제품별 재고 현황을 확인합니다. 각 제품을 클릭하면 Lot별 상세 정보를 볼 수 있습니다."
      />

      <InventoryTable summaries={summariesWithAlias} getDetail={getDetail} />
    </div>
  );
}
