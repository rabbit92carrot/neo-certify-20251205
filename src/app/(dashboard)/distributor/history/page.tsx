import { redirect } from 'next/navigation';
import { getCachedCurrentUser } from '@/services/auth.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { HistoryPageWrapper } from '@/components/shared/HistoryPageWrapper';
import { getDistributorHistoryCursorAction, returnShipmentAction, getReturnableCodesAction } from '../actions';

export const metadata = {
  title: '거래 이력 | 유통사',
  description: '입고, 출고, 반품 이력 조회',
};

/**
 * 유통사 거래이력 페이지
 * 커서 기반 무한 스크롤로 성능 최적화
 * 반품 기능 포함 (입고 건을 제조사에게 반품 가능, 시간 제한 없음)
 */
export default async function DistributorHistoryPage(): Promise<React.ReactElement> {
  const user = await getCachedCurrentUser();

  if (user?.organization.type !== 'DISTRIBUTOR') {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="거래 이력"
        description="입고, 출고, 반품 이력을 확인할 수 있습니다. 입고 건은 발송 조직에 반품할 수 있습니다."
      />

      <HistoryPageWrapper
        currentOrgId={user.organization.id}
        fetchHistoryCursor={getDistributorHistoryCursorAction}
        actionTypeOptions={[
          { value: 'RECEIVED', label: '입고' },
          { value: 'SHIPPED', label: '출고' },
          { value: 'RETURN_SENT', label: '반품 출고' },
          { value: 'RETURN_RECEIVED', label: '반품 입고' },
        ]}
        onReturn={returnShipmentAction}
        showReturnButton={true}
        onGetReturnableInfo={getReturnableCodesAction}
        defaultActionType="RECEIVED"
      />
    </div>
  );
}
