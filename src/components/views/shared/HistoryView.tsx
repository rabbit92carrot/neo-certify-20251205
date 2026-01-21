'use client';

/**
 * 거래 이력 View 컴포넌트
 * 제조사/유통사/병원 공통 히스토리 뷰 (props 기반 순수 렌더링)
 */

import { HistoryPageWrapper } from '@/components/shared/HistoryPageWrapper';
import type { TransactionHistorySummary, CursorPaginatedHistory } from '@/services/history.service';
import type { ApiResponse, HistoryActionType } from '@/types/api.types';

export interface HistoryViewProps {
  /** 거래 이력 목록 */
  histories: TransactionHistorySummary[];
  /** 현재 조직 ID */
  currentOrgId: string;
  /** 액션 타입 옵션 */
  actionTypeOptions: Array<{ value: string; label: string }>;
  /** 기본 액션 타입 */
  defaultActionType?: string;
  /** 반품 버튼 표시 여부 */
  showReturnButton?: boolean;
}

export function HistoryView({
  histories,
  currentOrgId,
  actionTypeOptions,
  defaultActionType = 'all',
  showReturnButton = false,
}: HistoryViewProps): React.ReactElement {
  // Preview용 mock fetch 함수 - 초기 데이터만 반환하고 추가 페이지는 없음
  const mockFetchHistoryCursor = async (_query: {
    actionTypes?: HistoryActionType[];
    startDate?: string;
    endDate?: string;
    isRecall?: boolean;
    limit?: number;
    cursorTime?: string;
    cursorKey?: string;
  }): Promise<ApiResponse<CursorPaginatedHistory>> => {
    return {
      success: true,
      data: {
        items: histories,
        meta: {
          hasMore: false,
          limit: 20,
        },
      },
    };
  };

  return (
    <HistoryPageWrapper
      currentOrgId={currentOrgId}
      fetchHistoryCursor={mockFetchHistoryCursor}
      initialData={histories}
      actionTypeOptions={actionTypeOptions}
      showReturnButton={showReturnButton}
      defaultActionType={defaultActionType}
    />
  );
}
