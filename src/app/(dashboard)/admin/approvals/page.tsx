import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ApprovalTableWrapper } from './ApprovalTableWrapper';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '가입 승인 | 관리자',
  description: '조직 가입 승인 관리',
};

export default async function AdminApprovalsPage(): Promise<React.ReactElement> {
  return (
    <div className="space-y-6">
      <PageHeader
        title="가입 승인"
        description="가입 신청한 조직을 검토하고 승인하거나 거부합니다."
      />

      <Suspense fallback={<LoadingSpinner />}>
        <ApprovalTableWrapper />
      </Suspense>
    </div>
  );
}
