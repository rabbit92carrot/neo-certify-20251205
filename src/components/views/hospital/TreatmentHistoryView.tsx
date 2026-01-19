/**
 * 시술 이력 View 컴포넌트
 * 병원 시술 이력 페이지 뷰 (props 기반)
 */

import { PageHeader } from '@/components/shared/PageHeader';
import { TreatmentHistoryTable } from '@/components/tables/TreatmentHistoryTable';
import type { TreatmentRecordSummary } from '@/services/treatment.service';

export interface TreatmentHistoryViewProps {
  /** 시술 이력 목록 */
  treatments: TreatmentRecordSummary[];
}

export function TreatmentHistoryView({
  treatments,
}: TreatmentHistoryViewProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <PageHeader
        title="시술 이력"
        description="등록된 시술 내역을 확인하고, 24시간 이내 오류 시 회수할 수 있습니다."
      />

      <TreatmentHistoryTable
        treatments={treatments}
        onRecall={async () => ({ success: false, error: { code: 'PREVIEW', message: 'Preview mode' } })}
      />
    </div>
  );
}
