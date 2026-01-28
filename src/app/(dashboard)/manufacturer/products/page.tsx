import { getCachedCurrentUser } from '@/services/auth.service';
import { getProducts } from '@/services/product.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { ProductsTable } from '@/components/tables/ProductsTable';
import { ProductFormTrigger } from './ProductFormTrigger';
import { redirect } from 'next/navigation';

export const metadata = {
  title: '제품 관리 | 제조사',
  description: '제품 종류 등록 및 관리',
};

/**
 * 제품 관리 페이지
 */
export default async function ProductsPage(): Promise<React.ReactElement> {
  const user = await getCachedCurrentUser();

  if (user?.organization.type !== 'MANUFACTURER') {
    redirect('/login');
  }

  // 제품 목록 조회 (전체, 비활성 포함)
  const result = await getProducts(user.organization.id, {
    page: 1,
    pageSize: 100,
  });

  const products = result.success ? result.data!.items : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="제품 관리"
        description="제품 종류를 등록하고 관리합니다."
        actions={<ProductFormTrigger />}
      />

      <ProductsTable products={products} />
    </div>
  );
}
