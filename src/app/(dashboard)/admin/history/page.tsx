import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { HistoryTableWrapper } from './HistoryTableWrapper';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '전체 이력 | 관리자',
  description: '전체 가상 코드 이력 조회',
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    startDate?: string;
    endDate?: string;
    currentStatus?: string;
    currentOwnerId?: string;
    originalProducerId?: string;
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
        description="모든 가상 식별코드의 이력을 조회합니다. 필터를 사용하여 원하는 데이터를 검색할 수 있습니다."
      />

      <Suspense fallback={<LoadingSpinner />}>
        <HistoryTableWrapper
          page={params.page ? parseInt(params.page) : 1}
          startDate={params.startDate}
          endDate={params.endDate}
          currentStatus={params.currentStatus}
          currentOwnerId={params.currentOwnerId}
          originalProducerId={params.originalProducerId}
          productId={params.productId}
          includeRecalled={params.includeRecalled !== 'false'}
        />
      </Suspense>
    </div>
  );
}
