'use client';

/**
 * 관리자 이력 페이지 래퍼 컴포넌트
 * 커서 기반 무한 스크롤 + CSV 다운로드
 *
 * 성능 최적화:
 * - 커서 기반 페이지네이션 (OFFSET 대비 10-50배 성능 향상)
 * - 조직/제품 목록 캐싱 (첫 로드 시 1회만 조회)
 * - count 쿼리 제거 (hasMore 플래그로 대체)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Download, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { AdminEventSummaryTable } from '@/components/tables/AdminEventSummaryTable';
import { AdminEventSummaryFilter } from '@/components/shared/AdminEventSummaryFilter';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { generateCsvString, downloadCsv, formatDateTimeKorea } from '@/lib/utils';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import {
  getAdminEventSummaryCursorAction,
  getAllOrganizationsForSelectAction,
  getAllProductsForSelectAction,
  exportEventSummaryCsvAction,
} from '../actions';
import type { AdminEventSummary, OrganizationType } from '@/types/api.types';

// CSV용 로컬 타입 정의
interface CsvItem {
  eventTime: string;
  actionType: string;
  totalQuantity: number;
  fromOwner: string;
  toOwner: string;
  lotNumbers: string;
  productNames: string;
  isRecall: string;
  [key: string]: string | number;
}

interface HistoryTableWrapperProps {
  startDate?: string;
  endDate?: string;
  actionTypes?: string;
  lotNumber?: string;
  organizationId?: string;
  productId?: string;
  includeRecalled?: boolean;
}

// 페이지 사이즈 상수
const PAGE_SIZE = 50;

export function HistoryTableWrapper({
  startDate,
  endDate,
  actionTypes,
  lotNumber,
  organizationId,
  productId,
  includeRecalled = true,
}: HistoryTableWrapperProps): React.ReactElement {
  // 이벤트 데이터 상태
  const [events, setEvents] = useState<AdminEventSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터 데이터 (캐싱됨)
  const [organizations, setOrganizations] = useState<
    { id: string; name: string; type: OrganizationType }[]
  >([]);
  const [products, setProducts] = useState<
    { id: string; name: string; manufacturerName: string }[]
  >([]);

  // CSV 로딩 상태
  const [csvLoading, setCsvLoading] = useState(false);

  // 커서 상태
  const cursorRef = useRef<{ time?: string; key?: string }>({});

  // 필터 데이터 캐시 (마운트 간 유지)
  const filterDataLoadedRef = useRef(false);

  // actionTypes 문자열을 배열로 변환
  const actionTypesArray = actionTypes ? actionTypes.split(',').filter(Boolean) : undefined;

  // 필터 조건 키 (변경 감지용)
  const filterKey = [
    startDate,
    endDate,
    actionTypesArray?.join(','),
    lotNumber,
    organizationId,
    productId,
    includeRecalled,
  ].join('|');

  /**
   * 필터 데이터 로드 (조직/제품 목록) - 캐싱 적용
   */
  const loadFilterData = useCallback(async () => {
    if (filterDataLoadedRef.current) {
      return;
    }

    const [orgsResult, productsResult] = await Promise.all([
      getAllOrganizationsForSelectAction(),
      getAllProductsForSelectAction(),
    ]);

    if (orgsResult.success && orgsResult.data) {
      setOrganizations(orgsResult.data);
    }
    if (productsResult.success && productsResult.data) {
      setProducts(productsResult.data);
    }

    filterDataLoadedRef.current = true;
  }, []);

  /**
   * 첫 페이지 로드
   */
  const loadFirst = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    cursorRef.current = {};

    try {
      const result = await getAdminEventSummaryCursorAction({
        startDate,
        endDate,
        actionTypes: actionTypesArray,
        lotNumber,
        organizationId,
        productId,
        includeRecalled,
        limit: PAGE_SIZE,
      });

      if (result.success && result.data) {
        setEvents(result.data.items);
        setHasMore(result.data.meta.hasMore);

        // 다음 커서 저장
        const lastItem = result.data.items.at(-1);
        if (lastItem) {
          cursorRef.current = {
            time: lastItem.eventTime,
            key: lastItem.id,
          };
        }
      } else {
        setError(result.error?.message || '데이터를 불러오는데 실패했습니다.');
      }
    } catch {
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, actionTypesArray, lotNumber, organizationId, productId, includeRecalled]);

  /**
   * 다음 페이지 로드
   */
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const result = await getAdminEventSummaryCursorAction({
        startDate,
        endDate,
        actionTypes: actionTypesArray,
        lotNumber,
        organizationId,
        productId,
        includeRecalled,
        limit: PAGE_SIZE,
        cursorTime: cursorRef.current.time,
        cursorKey: cursorRef.current.key,
      });

      if (result.success && result.data) {
        const { items, meta } = result.data;
        setEvents((prev) => [...prev, ...items]);
        setHasMore(meta.hasMore);

        // 다음 커서 저장
        const lastItem = items.at(-1);
        if (lastItem) {
          cursorRef.current = {
            time: lastItem.eventTime,
            key: lastItem.id,
          };
        }
      }
    } catch {
      toast.error('추가 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    isLoadingMore,
    hasMore,
    startDate,
    endDate,
    actionTypesArray,
    lotNumber,
    organizationId,
    productId,
    includeRecalled,
  ]);

  // 무한 스크롤 설정
  const { observerRef } = useInfiniteScroll({
    isLoading: isLoadingMore,
    hasMore,
    onLoadMore: loadMore,
    rootMargin: '200px',
  });

  // 초기 로드 및 필터 변경 시 리셋
  useEffect(() => {
    void loadFilterData();
    void loadFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  // CSV 다운로드
  const handleCsvDownload = useCallback(async () => {
    setCsvLoading(true);

    try {
      const result = await exportEventSummaryCsvAction({
        startDate,
        endDate,
        actionTypes: actionTypesArray,
        lotNumber,
        organizationId,
        productId,
        includeRecalled,
      });

      if (result.success && result.data) {
        const csvData: CsvItem[] = result.data.items.map((event) => ({
          eventTime: formatDateTimeKorea(event.eventTime),
          actionType: event.actionTypeLabel,
          totalQuantity: event.totalQuantity,
          fromOwner: event.fromOwner?.name || '-',
          toOwner: event.toOwner?.name || '-',
          lotNumbers: event.lotSummaries.map((l) => l.lotNumber).join(', '),
          productNames: [...new Set(event.lotSummaries.map((l) => l.productName))].join(', '),
          isRecall: event.isRecall ? 'Y' : 'N',
        }));

        const csvString = generateCsvString(csvData, [
          { key: 'eventTime', label: '일시' },
          { key: 'actionType', label: '이벤트' },
          { key: 'totalQuantity', label: '수량' },
          { key: 'fromOwner', label: '출발' },
          { key: 'toOwner', label: '도착' },
          { key: 'lotNumbers', label: 'Lot 번호' },
          { key: 'productNames', label: '제품명' },
          { key: 'isRecall', label: '회수 여부' },
        ]);

        const filename = `이벤트이력_${new Date().toISOString().split('T')[0]}.csv`;
        downloadCsv(csvString, filename);
      } else {
        toast.error('CSV 데이터를 가져오는데 실패했습니다.');
      }
    } catch {
      toast.error('CSV 다운로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setCsvLoading(false);
    }
  }, [startDate, endDate, actionTypesArray, lotNumber, organizationId, productId, includeRecalled]);

  // 새로고침
  const handleRefresh = useCallback(() => {
    void loadFirst();
  }, [loadFirst]);

  // 초기 로딩 상태
  if (isLoading && events.length === 0) {
    return <LoadingSpinner />;
  }

  // 에러 상태
  if (error && events.length === 0) {
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
    <div className="space-y-6">
      {/* 필터 */}
      <AdminEventSummaryFilter organizations={organizations} products={products} />

      {/* 툴바: CSV 다운로드 + 새로고침 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {events.length > 0 && (
            <>
              <span className="font-medium text-foreground">{events.length.toLocaleString()}</span>
              건 로드됨
              {hasMore && ' (스크롤하여 더 보기)'}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCsvDownload}
            disabled={csvLoading || events.length === 0}
          >
            {csvLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            CSV 다운로드
          </Button>
        </div>
      </div>

      {/* 테이블 */}
      <AdminEventSummaryTable events={events} />

      {/* 무한 스크롤 트리거 */}
      <div ref={observerRef} className="h-10 flex items-center justify-center">
        {isLoadingMore && (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        )}
        {!hasMore && events.length > 0 && (
          <p className="text-sm text-muted-foreground">모든 데이터를 불러왔습니다.</p>
        )}
      </div>
    </div>
  );
}
