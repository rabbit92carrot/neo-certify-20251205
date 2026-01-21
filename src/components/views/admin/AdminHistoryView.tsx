/**
 * 관리자 전체 이력 View 컴포넌트
 * Admin 전용 이벤트 요약 뷰 (props 기반 순수 렌더링)
 */

import { PageHeader } from '@/components/shared/PageHeader';
import { AdminEventSummaryTable } from '@/components/tables/AdminEventSummaryTable';
import type { AdminEventSummary } from '@/types/api.types';

export interface AdminHistoryViewProps {
  /** 이벤트 요약 목록 */
  events: AdminEventSummary[];
  /** 페이지 제목 */
  title?: string;
  /** 페이지 설명 */
  description?: string;
}

export function AdminHistoryView({
  events,
  title = '전체 이력',
  description = '모든 이벤트 이력을 요약하여 조회합니다.',
}: AdminHistoryViewProps): React.ReactElement {
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground">조직</span>
            <div className="h-10 px-3 py-2 border rounded-md bg-white text-sm text-muted-foreground">
              전체
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground">Lot 번호</span>
            <div className="h-10 px-3 py-2 border rounded-md bg-white text-sm text-muted-foreground">
              -
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
          <span className="font-medium text-foreground">{events.length}</span>건
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 px-3 py-2 border rounded-md bg-white text-sm text-muted-foreground">
            CSV 다운로드
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <AdminEventSummaryTable events={events} />
    </div>
  );
}
