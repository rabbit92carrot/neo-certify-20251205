import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { AlertsTableWrapper } from './AlertsTableWrapper';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '비활성 제품 사용 알림 | 관리자',
  description: '비활성(단종/리콜) 제품 사용 알림을 모니터링합니다.',
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    acknowledged?: string;
  }>;
}

export default async function AdminAlertsPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="비활성 제품 사용 알림"
        description="단종 또는 리콜된 제품이 출고/시술에 사용된 경우를 모니터링합니다."
      />

      <Suspense fallback={<LoadingSpinner />}>
        <AlertsTableWrapper
          page={params.page ? parseInt(params.page) : 1}
          acknowledged={params.acknowledged === 'true' ? true : params.acknowledged === 'false' ? false : undefined}
        />
      </Suspense>
    </div>
  );
}
