'use client';

/**
 * 무한 스크롤 훅
 * Intersection Observer를 사용하여 무한 스크롤을 구현합니다.
 */

import { useCallback, useEffect, useRef } from 'react';

interface UseInfiniteScrollOptions {
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 더 로드할 데이터가 있는지 */
  hasMore?: boolean;
  /** 다음 페이지 로드 함수 */
  onLoadMore?: () => void;
  /** root margin (뷰포트 기준 여백) */
  rootMargin?: string;
  /** threshold (요소가 보이는 비율) */
  threshold?: number;
}

interface UseInfiniteScrollReturn {
  /** 관찰 대상 ref */
  observerRef: React.RefObject<HTMLDivElement | null>;
  /** 로딩 중 상태 (외부에서 전달받은 isLoading 반환) */
  isLoadingMore: boolean;
}

/**
 * 무한 스크롤 훅
 *
 * @example
 * ```tsx
 * function MyList() {
 *   const [items, setItems] = useState<Item[]>([]);
 *   const [hasMore, setHasMore] = useState(true);
 *   const [isLoading, setIsLoading] = useState(false);
 *
 *   const loadMore = async () => {
 *     setIsLoading(true);
 *     const newItems = await fetchItems(page);
 *     setItems(prev => [...prev, ...newItems]);
 *     setHasMore(newItems.length > 0);
 *     setIsLoading(false);
 *   };
 *
 *   const { observerRef, isLoadingMore } = useInfiniteScroll({
 *     isLoading,
 *     hasMore,
 *     onLoadMore: loadMore,
 *   });
 *
 *   return (
 *     <div>
 *       {items.map(item => <div key={item.id}>{item.name}</div>)}
 *       <div ref={observerRef}>
 *         {isLoadingMore && <LoadingSpinner />}
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useInfiniteScroll({
  isLoading = false,
  hasMore = false,
  onLoadMore,
  rootMargin = '100px',
  threshold = 0.1,
}: UseInfiniteScrollOptions = {}): UseInfiniteScrollReturn {
  const observerRef = useRef<HTMLDivElement | null>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target && target.isIntersecting && hasMore && !isLoading && onLoadMore) {
        onLoadMore();
      }
    },
    [hasMore, isLoading, onLoadMore]
  );

  useEffect(() => {
    const element = observerRef.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(handleObserver, {
      rootMargin,
      threshold,
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [handleObserver, rootMargin, threshold]);

  return {
    observerRef,
    isLoadingMore: isLoading,
  };
}
