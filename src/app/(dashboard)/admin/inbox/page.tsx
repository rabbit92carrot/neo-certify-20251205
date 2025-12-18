import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { InboxTableWrapper } from './InboxTableWrapper';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '알림 보관함 | 관리자',
  description: '조직 알림 메시지를 확인합니다.',
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    isRead?: string;
    type?: string;
  }>;
}

export default async function AdminInboxPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="알림 보관함"
        description="시스템 알림 및 메시지를 확인합니다."
      />

      <Suspense fallback={<LoadingSpinner />}>
        <InboxTableWrapper
          page={params.page ? parseInt(params.page) : 1}
          isRead={params.isRead === 'true' ? true : params.isRead === 'false' ? false : undefined}
          alertType={params.type}
        />
      </Suspense>
    </div>
  );
}
