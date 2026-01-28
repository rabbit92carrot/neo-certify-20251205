import { redirect } from 'next/navigation';
import { getCachedCurrentUser } from '@/services/auth.service';
import { getActiveProductsForTreatment } from '@/services/hospital-product.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { LazyTreatmentForm } from '@/components/forms/lazy';
import { createTreatmentAction } from '../actions';

export const metadata = {
  title: '시술 등록 | 병원',
  description: '환자 시술 등록',
};

/**
 * 병원 시술 등록 페이지
 */
export default async function HospitalTreatmentPage(): Promise<React.ReactElement> {
  const user = await getCachedCurrentUser();

  if (user?.organization.type !== 'HOSPITAL') {
    redirect('/login');
  }

  // 시술 가능한 제품 목록 조회 (활성화된 제품 + 재고가 있는 제품)
  const productsResult = await getActiveProductsForTreatment(user.organization.id);
  const products = productsResult.success ? productsResult.data! : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="시술 등록"
        description="환자에게 시술한 제품을 등록합니다. 시술 등록 시 환자에게 정품 인증 알림이 발송됩니다."
      />

      <LazyTreatmentForm
        products={products}
        onSubmit={createTreatmentAction}
      />
    </div>
  );
}
