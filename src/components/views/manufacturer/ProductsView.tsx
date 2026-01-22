'use client';

/**
 * 제품 관리 View 컴포넌트
 * Manufacturer 제품 관리 페이지 뷰 (props 기반)
 */

import { PageHeader } from '@/components/shared/PageHeader';
import { ProductsTable } from '@/components/tables/ProductsTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { Product } from '@/types/api.types';

export interface ProductsViewProps {
  /** 제품 목록 */
  products: Product[];
}

export function ProductsView({
  products,
}: ProductsViewProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <PageHeader
        title="제품 관리"
        description="제품 종류를 등록하고 관리합니다."
        actions={
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            제품 등록
          </Button>
        }
      />

      <ProductsTable products={products} />
    </div>
  );
}
