import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/services/auth.service';
import { getInventorySummary, getProductInventoryDetail } from '@/services/inventory.service';
import { PageHeader } from '@/components/shared';
import { InventoryTable } from '@/components/tables/InventoryTable';

export const metadata = {
  title: '재고 조회 | 유통사',
  description: '제품별 재고 현황 조회',
};

/**
 * 유통사 재고 조회 페이지
 */
export default async function DistributorInventoryPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser();

  if (user?.organization.type !== 'DISTRIBUTOR') {
    redirect('/login');
  }

  // 재고 요약 조회
  const summaryResult = await getInventorySummary(user.organization.id);
  const summaries = summaryResult.success ? summaryResult.data! : [];

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

      <InventoryTable summaries={summaries} getDetail={getDetail} />
    </div>
  );
}
