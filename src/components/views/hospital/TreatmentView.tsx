'use client';

/**
 * 시술 등록 View 컴포넌트
 * 병원 시술 페이지 뷰 (props 기반)
 * 실제 TreatmentForm 컴포넌트를 사용하여 동일한 UI 표시
 */

import { PageHeader } from '@/components/shared/PageHeader';
import { TreatmentForm } from '@/components/forms/TreatmentForm';
import type { ProductForTreatment } from '@/types/api.types';
import type { TreatmentItemData } from '@/lib/validations/treatment';

export interface TreatmentViewProps {
  /** 조직 ID (Preview용: 기본값 제공) */
  organizationId?: string;
  /** 시술 가능한 제품 목록 */
  products: ProductForTreatment[];
  /** 환자 검색 함수 (Preview에서 mock 주입용) */
  searchFn?: (query: string) => Promise<{ success: boolean; data?: string[] }>;
}

/**
 * 시술 등록 View - 실제 TreatmentForm 사용
 */
export function TreatmentView({
  organizationId = 'preview-org-id',
  products,
  searchFn,
}: TreatmentViewProps): React.ReactElement {
  // Preview용 no-op 핸들러
  const handleSubmit = async (
    _patientPhone: string,
    _treatmentDate: string,
    _items: TreatmentItemData[]
  ): Promise<{ success: boolean; error?: { message: string } }> => {
    // Preview에서는 항상 성공 반환 (실제 동작 없음)
    return { success: true };
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="시술 등록"
        description="환자에게 시술한 제품을 등록합니다. 시술 등록 시 환자에게 정품 인증 알림이 발송됩니다."
      />

      <TreatmentForm
        organizationId={organizationId}
        products={products}
        onSubmit={handleSubmit}
        searchFn={searchFn}
      />
    </div>
  );
}
