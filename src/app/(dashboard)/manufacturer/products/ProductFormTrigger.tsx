'use client';

/**
 * 제품 등록 버튼 + 다이얼로그 트리거 컴포넌트
 * Server Component에서 Client Component 분리
 * react-query가 캐시 무효화로 자동 refetch하므로 router.refresh() 불필요
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ProductForm } from '@/components/forms/ProductForm';
import { Plus } from 'lucide-react';

export function ProductFormTrigger(): React.ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        제품 등록
      </Button>
      <ProductForm open={open} onOpenChange={setOpen} />
    </>
  );
}
