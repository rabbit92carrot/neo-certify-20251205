/**
 * 생산 등록 View 컴포넌트
 * Design System Preview용 (props 기반)
 */

import { PageHeader } from '@/components/shared/PageHeader';
import { LotForm } from '@/components/forms/LotForm';
import type { Product, ManufacturerSettings } from '@/types/api.types';

export interface ProductionViewProps {
  /** 선택 가능한 제품 목록 */
  products: Product[];
  /** 제조사 설정 */
  settings?: ManufacturerSettings;
}

export function ProductionView({
  products,
  settings,
}: ProductionViewProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <PageHeader
        title="생산 등록"
        description="새로운 Lot을 등록합니다. 등록 시 가상 식별코드가 자동 생성됩니다."
      />

      <LotForm products={products} settings={settings} />
    </div>
  );
}
