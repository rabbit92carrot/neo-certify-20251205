import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/services/auth.service';
import { getAvailableProductsForShipment } from '@/services/inventory.service';
import { PageHeader } from '@/components/shared';
import { TreatmentForm } from '@/components/forms/TreatmentForm';
import { createTreatmentAction } from '../actions';

export const metadata = {
  title: '시술 등록 | 병원',
  description: '환자 시술 등록',
};

/**
 * 병원 시술 등록 페이지
 */
export default async function HospitalTreatmentPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser();

  if (user?.organization.type !== 'HOSPITAL') {
    redirect('/login');
  }

  // 시술 가능한 제품 목록 조회 (재고가 있는 제품)
  const productsResult = await getAvailableProductsForShipment(user.organization.id);
  const products = productsResult.success ? productsResult.data! : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="시술 등록"
        description="환자에게 시술한 제품을 등록합니다. 시술 등록 시 환자에게 정품 인증 알림이 발송됩니다."
      />

      <TreatmentForm
        products={products}
        onSubmit={createTreatmentAction}
      />
    </div>
  );
}
