import { redirect } from 'next/navigation';
import { getCachedCurrentUser } from '@/services/auth.service';
import { getActiveProductsForTreatment } from '@/services/hospital-product.service';
import { PageHeader } from '@/components/shared';
import { DisposalForm } from '@/components/forms/DisposalForm';
import { createDisposalAction } from '../actions';

export const metadata = {
  title: '폐기 등록 | 병원',
  description: '제품 폐기 등록',
};

/**
 * 병원 폐기 등록 페이지
 * 손실, 만료, 불량 등의 이유로 제품을 폐기합니다.
 */
export default async function HospitalDisposalPage(): Promise<React.ReactElement> {
  const user = await getCachedCurrentUser();

  if (user?.organization.type !== 'HOSPITAL') {
    redirect('/login');
  }

  // 폐기 가능한 제품 목록 조회 (활성화된 제품 + 재고가 있는 제품)
  const productsResult = await getActiveProductsForTreatment(user.organization.id);
  const products = productsResult.success ? productsResult.data! : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="폐기 등록"
        description="손실, 만료, 불량 등의 이유로 제품을 폐기합니다. 폐기 등록 후에는 취소가 불가능합니다."
      />

      <DisposalForm
        products={products}
        onSubmit={createDisposalAction}
      />
    </div>
  );
}
