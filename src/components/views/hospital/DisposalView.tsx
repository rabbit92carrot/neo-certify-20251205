'use client';

/**
 * 폐기 등록 View 컴포넌트
 * 병원 폐기 페이지 뷰 (props 기반)
 * 실제 DisposalForm 컴포넌트를 사용하여 동일한 UI 표시
 */

import { PageHeader } from '@/components/shared/PageHeader';
import { DisposalForm } from '@/components/forms/DisposalForm';
import type { ProductForTreatment } from '@/types/api.types';
import type { DisposalItemData, DisposalReasonTypeValue } from '@/lib/validations/disposal';

export interface DisposalViewProps {
  /** 폐기 가능한 제품 목록 */
  products: ProductForTreatment[];
}

/**
 * 폐기 등록 View - 실제 DisposalForm 사용
 */
export function DisposalView({
  products,
}: DisposalViewProps): React.ReactElement {
  // Preview용 no-op 핸들러
  const handleSubmit = async (
    _disposalDate: string,
    _disposalReasonType: DisposalReasonTypeValue,
    _disposalReasonCustom: string | null,
    _items: DisposalItemData[]
  ): Promise<{ success: boolean; error?: { message: string } }> => {
    // Preview에서는 항상 성공 반환 (실제 동작 없음)
    return { success: true };
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="폐기 등록"
        description="손실, 만료, 불량 등의 이유로 제품을 폐기합니다. 폐기 등록 후에는 취소가 불가능합니다."
      />

      <DisposalForm
        products={products}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
