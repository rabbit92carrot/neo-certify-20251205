import { redirect } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { getCachedCurrentUser } from '@/services/auth.service';
import { getActiveProductsForTreatmentCacheable } from '@/services/hospital-product.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { LazyDisposalForm } from '@/components/forms/lazy';
import { createDisposalAction } from '../actions';

export const metadata = {
  title: '폐기 등록 | 병원',
  description: '제품 폐기 등록',
};

/**
 * Issue #001: hospital-disposal 성능 최적화
 * 활성 제품 목록 캐싱 (30초)
 * 재고 정보가 포함되어 있어 짧은 캐시 주기 사용
 */
const getCachedActiveProducts = (hospitalId: string) =>
  unstable_cache(
    async () => getActiveProductsForTreatmentCacheable(hospitalId),
    [`hospital-active-products-${hospitalId}`],
    { revalidate: 30, tags: ['hospital-products', `hospital-${hospitalId}`] }
  )();

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
  // Issue #001: unstable_cache로 30초 캐싱 (11초 이상치 해결)
  const productsResult = await getCachedActiveProducts(user.organization.id);
  const products = productsResult.success ? productsResult.data! : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="폐기 등록"
        description="손실, 만료, 불량 등의 이유로 제품을 폐기합니다. 폐기 등록 후에는 취소가 불가능합니다."
      />

      <LazyDisposalForm
        products={products}
        onSubmit={createDisposalAction}
      />
    </div>
  );
}
