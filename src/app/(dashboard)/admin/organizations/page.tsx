import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { OrganizationsTableWrapper } from './OrganizationsTableWrapper';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '조직 관리 | 관리자',
  description: '전체 조직 관리',
};

interface PageProps {
  searchParams: Promise<{
    status?: string;
    type?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function AdminOrganizationsPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="조직 관리"
        description="전체 조직을 관리합니다. 조직 승인, 비활성화, 삭제 등의 작업을 수행할 수 있습니다."
      />

      <Suspense fallback={<LoadingSpinner />}>
        <OrganizationsTableWrapper
          status={params.status}
          type={params.type}
          search={params.search}
          page={params.page ? parseInt(params.page) : 1}
        />
      </Suspense>
    </div>
  );
}
