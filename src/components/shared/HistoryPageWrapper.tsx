'use client';

/**
 * 거래 이력 페이지 래퍼 컴포넌트
 * 제조사/유통사/병원 공통 커서 기반 무한 스크롤 이력 조회
 *
 * 성능 최적화:
 * - 커서 기반 페이지네이션 (OFFSET 대비 10-50배 성능 향상)
 * - count 쿼리 제거 (hasMore 플래그로 대체)
 * - 무한 스크롤로 UX 개선
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { TransactionHistoryTable } from '@/components/tables/TransactionHistoryTable';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import type { TransactionHistorySummary, CursorPaginatedHistory } from '@/services/history.service';
import type { ApiResponse, HistoryActionType } from '@/types/api.types';

interface HistoryPageWrapperProps {
  /** 현재 조직 ID */
  currentOrgId: string;
  /** 커서 기반 히스토리 조회 함수 */
  fetchHistoryCursor: (query: {
    actionTypes?: HistoryActionType[];
    startDate?: string;
    endDate?: string;
    isRecall?: boolean;
    limit?: number;
    cursorTime?: string;
    cursorKey?: string;
  }) => Promise<ApiResponse<CursorPaginatedHistory>>;
  /** 초기 데이터 (SSR) */
  initialData?: TransactionHistorySummary[];
}

// 페이지 사이즈 상수
const PAGE_SIZE = 50;

export function HistoryPageWrapper({
  currentOrgId,
  fetchHistoryCursor,
  initialData = [],
}: HistoryPageWrapperProps): React.ReactElement {
  // 이벤트 데이터 상태
  const [histories, setHistories] = useState<TransactionHistorySummary[]>(initialData);
  const [isLoading, setIsLoading] = useState(initialData.length === 0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 커서 상태
  const cursorRef = useRef<{ time?: string; key?: string }>({});

  // 초기화 여부
  const initializedRef = useRef(initialData.length > 0);

  /**
   * 첫 페이지 로드
   */
  const loadFirst = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    cursorRef.current = {};

    try {
      const result = await fetchHistoryCursor({
        limit: PAGE_SIZE,
      });

      if (result.success && result.data) {
        setHistories(result.data.items);
        setHasMore(result.data.meta.hasMore);

        // 다음 커서 저장
        const lastItem = result.data.items.at(-1);
        if (lastItem) {
          cursorRef.current = {
            time: lastItem.createdAt,
            key: lastItem.id,
          };
        }
      } else {
        setError(result.error?.message ?? '데이터를 불러오는데 실패했습니다.');
      }
    } catch {
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchHistoryCursor]);

  /**
   * 다음 페이지 로드
   */
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const result = await fetchHistoryCursor({
        limit: PAGE_SIZE,
        cursorTime: cursorRef.current.time,
        cursorKey: cursorRef.current.key,
      });

      if (result.success && result.data) {
        const { items, meta } = result.data;
        setHistories((prev) => [...prev, ...items]);
        setHasMore(meta.hasMore);

        // 다음 커서 저장
        const lastItem = items.at(-1);
        if (lastItem) {
          cursorRef.current = {
            time: lastItem.createdAt,
            key: lastItem.id,
          };
        }
      }
    } catch {
      toast.error('추가 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, fetchHistoryCursor]);

  // 무한 스크롤 설정
  const { observerRef } = useInfiniteScroll({
    isLoading: isLoadingMore,
    hasMore,
    onLoadMore: loadMore,
    rootMargin: '200px',
  });

  // 초기 로드 (initialData가 없는 경우)
  useEffect(() => {
    if (!initializedRef.current) {
      void loadFirst();
      initializedRef.current = true;
    }
  }, [loadFirst]);

  // 새로고침
  const handleRefresh = useCallback(() => {
    void loadFirst();
  }, [loadFirst]);

  // 초기 로딩 상태
  if (isLoading && histories.length === 0) {
    return <LoadingSpinner />;
  }

  // 에러 상태
  if (error && histories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 툴바 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {histories.length > 0 && (
            <>
              <span className="font-medium text-foreground">{histories.length.toLocaleString()}</span>
              건 로드됨
              {hasMore && ' (스크롤하여 더 보기)'}
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* 테이블 */}
      <TransactionHistoryTable histories={histories} currentOrgId={currentOrgId} />

      {/* 무한 스크롤 트리거 */}
      <div ref={observerRef} className="h-10 flex items-center justify-center">
        {isLoadingMore && (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        )}
        {!hasMore && histories.length > 0 && (
          <p className="text-sm text-muted-foreground">모든 데이터를 불러왔습니다.</p>
        )}
      </div>
    </div>
  );
}
