import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { HistoryTableWrapper } from './HistoryTableWrapper';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '전체 이력 | 관리자',
  description: '전체 가상 코드 이력 조회 (이벤트 단위 요약)',
};

interface PageProps {
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
    actionTypes?: string;
    lotNumber?: string;
    organizationId?: string;
    productId?: string;
    includeRecalled?: string;
  }>;
}

export default async function AdminHistoryPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="전체 이력"
        description="모든 이벤트 이력을 요약하여 조회합니다. 행을 클릭하면 상세 정보를 확인할 수 있습니다."
      />

      <Suspense fallback={<LoadingSpinner />}>
        <HistoryTableWrapper
          startDate={params.startDate}
          endDate={params.endDate}
          actionTypes={params.actionTypes}
          lotNumber={params.lotNumber}
          organizationId={params.organizationId}
          productId={params.productId}
          includeRecalled={params.includeRecalled !== 'false'}
        />
      </Suspense>
    </div>
  );
}
