import { getCachedCurrentUser } from '@/services/auth.service';
import { getActiveProducts } from '@/services/product.service';
import { PageHeader } from '@/components/shared';
import { LotForm } from '@/components/forms/LotForm';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';

export const metadata = {
  title: '생산 등록 | 제조사',
  description: 'Lot 생산 등록',
};

/**
 * 생산 등록 페이지
 */
export default async function ProductionPage(): Promise<React.ReactElement> {
  const user = await getCachedCurrentUser();

  if (user?.organization.type !== 'MANUFACTURER') {
    redirect('/login');
  }

  // 활성 제품 목록 조회
  const productsResult = await getActiveProducts(user.organization.id);
  const products = productsResult.success ? productsResult.data! : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="생산 등록"
        description="새로운 Lot을 등록합니다. 등록 시 가상 식별코드가 자동 생성됩니다."
        actions={
          products.length === 0 ? (
            <Link href="/manufacturer/products">
              <Button variant="outline">
                <Package className="mr-2 h-4 w-4" />
                제품 등록하기
              </Button>
            </Link>
          ) : undefined
        }
      />

      <LotForm products={products} settings={user.manufacturerSettings} />
    </div>
  );
}
