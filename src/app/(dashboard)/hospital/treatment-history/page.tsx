import { redirect } from 'next/navigation';
import { getCachedCurrentUser } from '@/services/auth.service';
import { getTreatmentHistory } from '@/services/treatment.service';
import { getHospitalKnownProducts } from '@/services/hospital-product.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { TreatmentHistoryTable } from '@/components/tables/TreatmentHistoryTable';
import { recallTreatmentAction } from '../actions';

export const metadata = {
  title: '시술 이력 | 병원',
  description: '시술 이력 조회 및 회수',
};

/**
 * 병원 시술 이력 페이지
 * Phase 7: 순차 로딩 → 병렬화로 성능 개선 (~20% 단축)
 */
export default async function HospitalTreatmentHistoryPage(): Promise<React.ReactElement> {
  const user = await getCachedCurrentUser();

  if (user?.organization.type !== 'HOSPITAL') {
    redirect('/login');
  }

  // Phase 7: 시술 이력 + 별칭 정보 병렬 조회 (의존성 없음)
  const [historyResult, knownProductsResult] = await Promise.all([
    getTreatmentHistory(user.organization.id, {
      page: 1,
      pageSize: 50,
    }),
    getHospitalKnownProducts(user.organization.id),
  ]);

  const treatments = historyResult.success ? historyResult.data!.items : [];
  const aliasMap = new Map<string, { alias: string | null; modelName: string }>();
  if (knownProductsResult.success && knownProductsResult.data) {
    knownProductsResult.data.forEach((kp) => {
      aliasMap.set(kp.productId, { alias: kp.alias, modelName: kp.modelName });
    });
  }

  // 시술 이력에 별칭 정보 병합
  const treatmentsWithAlias = treatments.map((t) => ({
    ...t,
    itemSummary: t.itemSummary.map((item) => {
      const aliasInfo = aliasMap.get(item.productId);
      return {
        ...item,
        alias: aliasInfo?.alias ?? null,
        modelName: aliasInfo?.modelName ?? undefined,
      };
    }),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="시술 이력"
        description="등록된 시술 내역을 확인하고, 24시간 이내 오류 시 회수할 수 있습니다."
      />

      <TreatmentHistoryTable
        treatments={treatmentsWithAlias}
        onRecall={recallTreatmentAction}
      />
    </div>
  );
}
