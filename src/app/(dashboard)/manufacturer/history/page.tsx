import { redirect } from 'next/navigation';
import { getCachedCurrentUser } from '@/services/auth.service';
import { PageHeader, HistoryPageWrapper } from '@/components/shared';
import { getManufacturerHistoryCursorAction, recallShipmentAction } from '../actions';

export const metadata = {
  title: '거래 이력 | 제조사',
  description: '생산, 출고, 회수 이력 조회',
};

/**
 * 제조사 거래이력 페이지
 * 커서 기반 무한 스크롤로 성능 최적화
 * 출고 회수 기능 포함 (24시간 이내)
 */
export default async function ManufacturerHistoryPage(): Promise<React.ReactElement> {
  const user = await getCachedCurrentUser();

  if (user?.organization.type !== 'MANUFACTURER') {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="거래 이력"
        description="생산, 출고, 회수 이력을 확인할 수 있습니다. 출고 건은 24시간 이내에 회수할 수 있습니다."
      />

      <HistoryPageWrapper
        currentOrgId={user.organization.id}
        fetchHistoryCursor={getManufacturerHistoryCursorAction}
        actionTypeOptions={[
          { value: 'PRODUCED', label: '생산' },
          { value: 'SHIPPED', label: '출고' },
          { value: 'RECALLED', label: '회수' },
        ]}
        onRecall={recallShipmentAction}
        showRecallButton={true}
        defaultActionType="SHIPPED"
      />
    </div>
  );
}
