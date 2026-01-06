import { redirect } from 'next/navigation';
import { getCachedCurrentUser } from '@/services/auth.service';
import { PageHeader, HistoryPageWrapper } from '@/components/shared';
import { getHospitalHistoryCursorAction, returnShipmentAction } from '../actions';
import { getHospitalKnownProducts } from '@/services/hospital-product.service';

export const metadata = {
  title: '거래 이력 | 병원',
  description: '입고, 시술, 회수, 반품 이력 조회',
};

/**
 * 병원 거래이력 페이지
 * 커서 기반 무한 스크롤로 성능 최적화
 * 반품 기능 포함 (입고 건을 유통사에게 반품 가능, 시간 제한 없음)
 */
export default async function HospitalHistoryPage(): Promise<React.ReactElement> {
  const user = await getCachedCurrentUser();

  if (user?.organization.type !== 'HOSPITAL') {
    redirect('/login');
  }

  // 별칭 정보 조회 (병원만 해당)
  const knownProductsResult = await getHospitalKnownProducts(user.organization.id);
  const productAliasMap: Record<string, { alias: string | null; modelName: string }> = {};
  if (knownProductsResult.success && knownProductsResult.data) {
    knownProductsResult.data.forEach((kp) => {
      productAliasMap[kp.productId] = { alias: kp.alias, modelName: kp.modelName };
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="거래 이력"
        description="입고, 시술, 회수, 반품 이력을 확인할 수 있습니다. 입고 건은 발송 조직에 반품할 수 있습니다."
      />

      <HistoryPageWrapper
        currentOrgId={user.organization.id}
        fetchHistoryCursor={getHospitalHistoryCursorAction}
        actionTypeOptions={[
          { value: 'RECEIVED', label: '입고' },
          { value: 'TREATED', label: '시술' },
          { value: 'RECALLED', label: '회수' },
          { value: 'RETURNED', label: '반품' },
        ]}
        productAliasMap={productAliasMap}
        onReturn={returnShipmentAction}
        showReturnButton={true}
      />
    </div>
  );
}
