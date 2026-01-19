/**
 * 거래 이력 View 컴포넌트
 * 제조사/유통사/병원 공통 히스토리 뷰 (props 기반 순수 렌더링)
 */

import { PageHeader } from '@/components/shared/PageHeader';
import { TransactionHistoryTable } from '@/components/tables/TransactionHistoryTable';
import type { TransactionHistorySummary } from '@/services/history.service';

export interface HistoryViewProps {
  /** 거래 이력 목록 */
  histories: TransactionHistorySummary[];
  /** 현재 조직 ID */
  currentOrgId: string;
  /** 페이지 제목 */
  title?: string;
  /** 페이지 설명 */
  description?: string;
}

export function HistoryView({
  histories,
  currentOrgId,
  title = '거래 이력',
  description = '거래 이력을 확인합니다.',
}: HistoryViewProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />

      {/* 필터 영역 (Preview에서는 비활성 표시) */}
      <div className="space-y-4 p-4 border rounded-lg bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">필터</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground">시작일</span>
            <div className="h-10 px-3 py-2 border rounded-md bg-white text-sm text-muted-foreground">
              2024.01.01
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground">종료일</span>
            <div className="h-10 px-3 py-2 border rounded-md bg-white text-sm text-muted-foreground">
              2024.01.31
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground">이벤트 유형</span>
            <div className="h-10 px-3 py-2 border rounded-md bg-white text-sm text-muted-foreground">
              전체
            </div>
          </div>
          <div className="flex items-end">
            <div className="w-full h-10 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium text-center">
              조회
            </div>
          </div>
        </div>
      </div>

      {/* 툴바 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{histories.length}</span>건
        </div>
      </div>

      {/* 테이블 */}
      <TransactionHistoryTable
        histories={histories}
        currentOrgId={currentOrgId}
        showReturnButton={false}
      />
    </div>
  );
}
