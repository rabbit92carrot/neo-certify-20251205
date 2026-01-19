'use client';

import { PageHeader } from '@/components/shared';
import { InventoryTable } from '@/components/tables/InventoryTable';
import type { InventorySummary, ProductInventoryDetail } from '@/types/api.types';

/**
 * InventoryView Props
 */
export interface InventoryViewProps {
  /** 제품별 재고 요약 */
  summaries: InventorySummary[];
  /** 상세 정보 조회 함수 (optional, preview에서는 mock 반환) */
  getDetail?: (productId: string) => Promise<ProductInventoryDetail | null>;
  /** 페이지 제목 */
  title?: string;
  /** 페이지 설명 */
  description?: string;
}

/**
 * 재고 조회 View 컴포넌트 (공통)
 * Manufacturer, Distributor, Hospital에서 재사용
 */
export function InventoryView({
  summaries,
  getDetail,
  title = '재고 조회',
  description = '제품별 재고 현황을 확인합니다. 각 제품을 클릭하면 Lot별 상세 정보를 볼 수 있습니다.',
}: InventoryViewProps): React.ReactElement {
  // getDetail이 없으면 기본 mock 함수 사용
  const detailFn = getDetail ?? (async () => null);

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <InventoryTable summaries={summaries} getDetail={detailFn} />
    </div>
  );
}
