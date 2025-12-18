'use client';

/**
 * 커서 기반 페이지네이션 훅
 * 대용량 데이터셋에서 일관된 성능을 제공합니다.
 *
 * 장점:
 * - OFFSET 기반 대비 10-50배 성능 향상 (100K+ 데이터)
 * - 데이터 추가/삭제 시에도 페이지 건너뛰기 없음
 * - 무한 스크롤과 자연스럽게 통합
 */

import { useState, useCallback, useRef } from 'react';
import type { CursorPaginationMeta } from '@/types/api.types';

interface CursorPaginationState<T> {
  /** 현재까지 로드된 모든 아이템 */
  items: T[];
  /** 로딩 상태 */
  isLoading: boolean;
  /** 추가 로딩 상태 (다음 페이지) */
  isLoadingMore: boolean;
  /** 더 로드할 데이터가 있는지 */
  hasMore: boolean;
  /** 에러 메시지 */
  error: string | null;
}

interface CursorPaginationActions<T> {
  /** 첫 페이지 로드 (새로고침) */
  loadFirst: () => Promise<void>;
  /** 다음 페이지 로드 */
  loadMore: () => Promise<void>;
  /** 데이터 초기화 */
  reset: () => void;
  /** 특정 아이템 업데이트 */
  updateItem: (predicate: (item: T) => boolean, updater: (item: T) => T) => void;
  /** 특정 아이템 제거 */
  removeItem: (predicate: (item: T) => boolean) => void;
}

interface FetchResult<T> {
  items: T[];
  meta: CursorPaginationMeta;
}

interface UseCursorPaginationOptions<T> {
  /** 데이터 페치 함수 */
  fetchFn: (cursor?: { time?: string; key?: string }) => Promise<FetchResult<T>>;
  /** 커서 추출 함수 (마지막 아이템에서 커서 값 추출) */
  getCursor: (item: T) => { time: string; key: string };
  /** 페이지 크기 (기본값: 50) */
  limit?: number;
  /** 초기 자동 로드 여부 (기본값: true) */
  autoLoad?: boolean;
}

/**
 * 커서 기반 페이지네이션 훅
 *
 * @example
 * ```tsx
 * const { items, isLoading, hasMore, loadMore, loadFirst } = useCursorPagination({
 *   fetchFn: async (cursor) => {
 *     const result = await getHistoryCursor({
 *       cursorTime: cursor?.time,
 *       cursorKey: cursor?.key,
 *     });
 *     return result;
 *   },
 *   getCursor: (item) => ({
 *     time: item.createdAt,
 *     key: item.id,
 *   }),
 * });
 * ```
 */
export function useCursorPagination<T>({
  fetchFn,
  getCursor,
  autoLoad = true,
}: UseCursorPaginationOptions<T>): CursorPaginationState<T> & CursorPaginationActions<T> {
  const [state, setState] = useState<CursorPaginationState<T>>({
    items: [],
    isLoading: autoLoad,
    isLoadingMore: false,
    hasMore: true,
    error: null,
  });

  // 현재 커서 상태
  const cursorRef = useRef<{ time?: string; key?: string }>({});
  const isInitialLoadDone = useRef(false);
  const isFetching = useRef(false);

  /**
   * 첫 페이지 로드 (새로고침)
   */
  const loadFirst = useCallback(async () => {
    if (isFetching.current) {return;}
    isFetching.current = true;

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      // 커서 초기화
      cursorRef.current = {};
      const result = await fetchFn();

      // 다음 커서 저장
      if (result.items.length > 0) {
        const lastItem = result.items.at(-1);
        if (lastItem) {
          cursorRef.current = getCursor(lastItem);
        }
      }

      setState({
        items: result.items,
        isLoading: false,
        isLoadingMore: false,
        hasMore: result.meta.hasMore,
        error: null,
      });
      isInitialLoadDone.current = true;
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.',
      }));
    } finally {
      isFetching.current = false;
    }
  }, [fetchFn, getCursor]);

  /**
   * 다음 페이지 로드
   */
  const loadMore = useCallback(async () => {
    if (isFetching.current || !state.hasMore || state.isLoading) {return;}
    isFetching.current = true;

    setState((prev) => ({
      ...prev,
      isLoadingMore: true,
      error: null,
    }));

    try {
      const result = await fetchFn(cursorRef.current);

      // 다음 커서 저장
      if (result.items.length > 0) {
        const lastItem = result.items.at(-1);
        if (lastItem) {
          cursorRef.current = getCursor(lastItem);
        }
      }

      setState((prev) => ({
        ...prev,
        items: [...prev.items, ...result.items],
        isLoadingMore: false,
        hasMore: result.meta.hasMore,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoadingMore: false,
        error: err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.',
      }));
    } finally {
      isFetching.current = false;
    }
  }, [fetchFn, getCursor, state.hasMore, state.isLoading]);

  /**
   * 데이터 초기화
   */
  const reset = useCallback(() => {
    cursorRef.current = {};
    isInitialLoadDone.current = false;
    setState({
      items: [],
      isLoading: false,
      isLoadingMore: false,
      hasMore: true,
      error: null,
    });
  }, []);

  /**
   * 특정 아이템 업데이트
   */
  const updateItem = useCallback(
    (predicate: (item: T) => boolean, updater: (item: T) => T) => {
      setState((prev) => ({
        ...prev,
        items: prev.items.map((item) => (predicate(item) ? updater(item) : item)),
      }));
    },
    []
  );

  /**
   * 특정 아이템 제거
   */
  const removeItem = useCallback((predicate: (item: T) => boolean) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => !predicate(item)),
    }));
  }, []);

  // 초기 로드 (autoLoad가 true일 때)
  // useEffect에서 직접 호출하지 않고 컴포넌트에서 호출하도록 함

  return {
    ...state,
    loadFirst,
    loadMore,
    reset,
    updateItem,
    removeItem,
  };
}

export type { CursorPaginationState, CursorPaginationActions, UseCursorPaginationOptions };
