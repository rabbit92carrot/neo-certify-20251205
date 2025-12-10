import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { RecallTableWrapper } from './RecallTableWrapper';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '회수 모니터링 | 관리자',
  description: '회수 이력 모니터링',
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    startDate?: string;
    endDate?: string;
    type?: string;
  }>;
}

export default async function AdminRecallsPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="회수 모니터링"
        description="출고 및 시술 회수 이력을 모니터링합니다."
      />

      <Suspense fallback={<LoadingSpinner />}>
        <RecallTableWrapper
          page={params.page ? parseInt(params.page) : 1}
          startDate={params.startDate}
          endDate={params.endDate}
          type={params.type as 'shipment' | 'treatment' | 'all' | undefined}
        />
      </Suspense>
    </div>
  );
}
