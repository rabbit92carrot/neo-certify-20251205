import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/services/auth.service';
import { getShipmentHistory } from '@/services/shipment.service';
import { PageHeader } from '@/components/shared';
import { ShipmentHistoryTable } from '@/components/tables/ShipmentHistoryTable';
import { recallShipmentAction } from '../actions';

export const metadata = {
  title: '출고 이력 | 유통사',
  description: '출고 이력 조회 및 회수',
};

/**
 * 유통사 출고 이력 페이지
 */
export default async function DistributorShipmentHistoryPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser();

  if (user?.organization.type !== 'DISTRIBUTOR') {
    redirect('/login');
  }

  // 출고 이력 조회
  const historyResult = await getShipmentHistory(user.organization.id, {
    page: 1,
    pageSize: 50,
  });

  const shipments = historyResult.success ? historyResult.data!.items : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="출고 이력"
        description="출고한 내역을 확인하고 24시간 이내에 회수할 수 있습니다."
      />

      <ShipmentHistoryTable
        shipments={shipments}
        type="sent"
        onRecall={recallShipmentAction}
      />
    </div>
  );
}
