import { getCachedCurrentUser } from '@/services/auth.service';
import { getProducts } from '@/services/product.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { ProductsTableWithSearch } from '@/components/tables/ProductsTableWithSearch';
import { ProductFormTrigger } from './ProductFormTrigger';
import { searchProductsAction } from '../actions';
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

  // 제품 목록 조회 (모델명 오름차순 기본 정렬)
  const result = await getProducts(user.organization.id, {
    page: 1,
    pageSize: 20,
    sortBy: 'model_name',
    sortOrder: 'asc',
  });

  const products = result.success ? result.data!.items : [];
  const meta = result.success
    ? result.data!.meta
    : { page: 1, pageSize: 20, total: 0, totalPages: 0, hasMore: false };

  return (
    <div className="space-y-6">
      <PageHeader
        title="제품 관리"
        description="제품 종류를 등록하고 관리합니다."
        actions={<ProductFormTrigger />}
      />

      <ProductsTableWithSearch
        initialProducts={products}
        initialMeta={meta}
        searchProductsAction={searchProductsAction}
      />
    </div>
  );
}
