'use client';

/**
 * 제품 등록 버튼 + 다이얼로그 트리거 컴포넌트
 * Server Component에서 Client Component 분리
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ProductForm } from '@/components/forms/ProductForm';
import { Plus } from 'lucide-react';

export function ProductFormTrigger(): React.ReactElement {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        제품 등록
      </Button>
      <ProductForm open={open} onOpenChange={setOpen} onSuccess={handleSuccess} />
    </>
  );
}
