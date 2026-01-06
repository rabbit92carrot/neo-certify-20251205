import { redirect } from 'next/navigation';
import { getCachedCurrentUser } from '@/services/auth.service';
import { PageHeader, HistoryPageWrapper } from '@/components/shared';
import { getManufacturerHistoryCursorAction } from '../actions';

export const metadata = {
  title: '거래 이력 | 제조사',
  description: '생산, 출고, 반품 이력 조회',
};

/**
 * 제조사 거래이력 페이지
 * 커서 기반 무한 스크롤로 성능 최적화
 * 참고: 제조사는 발송자이므로 반품 기능 미제공 (수신자만 반품 가능)
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
        description="생산, 출고, 반품 이력을 확인할 수 있습니다."
      />

      <HistoryPageWrapper
        currentOrgId={user.organization.id}
        fetchHistoryCursor={getManufacturerHistoryCursorAction}
        actionTypeOptions={[
          { value: 'PRODUCED', label: '생산' },
          { value: 'SHIPPED', label: '출고' },
          { value: 'RETURNED', label: '반품' },
        ]}
        showReturnButton={false}
        defaultActionType="SHIPPED"
      />
    </div>
  );
}
