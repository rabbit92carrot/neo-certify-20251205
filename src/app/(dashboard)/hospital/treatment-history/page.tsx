import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCachedCurrentUser } from '@/services/auth.service';
import { getTreatmentHistory } from '@/services/treatment.service';
import { getHospitalKnownProducts } from '@/services/hospital-product.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { TreatmentHistoryTable } from '@/components/tables/TreatmentHistoryTable';
import { recallTreatmentAction } from '../actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader } from '@/components/ui/card';

export const metadata = {
  title: '시술 이력 | 병원',
  description: '시술 이력 조회 및 회수',
};

/**
 * 시술 이력 테이블 비동기 컴포넌트
 * Suspense boundary 내에서 데이터 로딩
 */
async function TreatmentHistoryTableWrapper({
  orgId,
}: {
  orgId: string;
}): Promise<React.ReactElement> {
  // Phase 7: 시술 이력 + 별칭 정보 병렬 조회 (의존성 없음)
  const [historyResult, knownProductsResult] = await Promise.all([
    getTreatmentHistory(orgId, {
      page: 1,
      pageSize: 50,
    }),
    getHospitalKnownProducts(orgId),
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
    <TreatmentHistoryTable
      treatments={treatmentsWithAlias}
      onRecall={recallTreatmentAction}
    />
  );
}

/**
 * 시술 이력 테이블 스켈레톤
 */
function TreatmentHistoryTableSkeleton(): React.ReactElement {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

/**
 * 병원 시술 이력 페이지
 * Suspense로 데이터 로딩 분리하여 PageHeader 즉시 표시
 */
export default async function HospitalTreatmentHistoryPage(): Promise<React.ReactElement> {
  const user = await getCachedCurrentUser();

  if (user?.organization.type !== 'HOSPITAL') {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="시술 이력"
        description="등록된 시술 내역을 확인하고, 24시간 이내 오류 시 회수할 수 있습니다."
      />

      <Suspense fallback={<TreatmentHistoryTableSkeleton />}>
        <TreatmentHistoryTableWrapper orgId={user.organization.id} />
      </Suspense>
    </div>
  );
}
