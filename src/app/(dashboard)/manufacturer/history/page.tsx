import { redirect } from 'next/navigation';
import { getCachedCurrentUser } from '@/services/auth.service';
import { getManufacturerHistory } from '@/services/history.service';
import { PageHeader } from '@/components/shared';
import { TransactionHistoryTable } from '@/components/tables/TransactionHistoryTable';

export const metadata = {
  title: '거래 이력 | 제조사',
  description: '생산, 출고, 회수 이력 조회',
};

/**
 * 제조사 거래이력 페이지
 */
export default async function ManufacturerHistoryPage(): Promise<React.ReactElement> {
  const user = await getCachedCurrentUser();

  if (user?.organization.type !== 'MANUFACTURER') {
    redirect('/login');
  }

  // 거래이력 조회 (생산, 출고, 회수)
  const historyResult = await getManufacturerHistory(user.organization.id, {
    page: 1,
    pageSize: 50,
  });

  const histories = historyResult.success ? historyResult.data!.items : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="거래 이력"
        description="생산, 출고, 회수 이력을 확인할 수 있습니다. 제품을 클릭하여 고유식별코드를 확인하세요."
      />

      <TransactionHistoryTable
        histories={histories}
        currentOrgId={user.organization.id}
      />
    </div>
  );
}
