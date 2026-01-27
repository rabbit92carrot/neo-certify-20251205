'use client';

/**
 * 관리자 이력 페이지 래퍼 컴포넌트
 * 전통적 페이지네이션 + CSV 다운로드
 *
 * 성능 최적화:
 * - 커서 기반 페이지네이션 내부 사용 (OFFSET 대비 10-50배 성능 향상)
 * - 조직/제품 목록 캐싱 (첫 로드 시 1회만 조회)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Download, Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { AdminEventSummaryTable } from '@/components/tables/AdminEventSummaryTable';
import { AdminEventSummaryFilter } from '@/components/shared/AdminEventSummaryFilter';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { generateCsvString, downloadCsv, formatDateTimeKorea } from '@/lib/utils';
import {
  getAdminEventSummaryCursorAction,
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

// 페이지별 커서 캐시 타입
interface PageCursor {
  time?: string;
  key?: string;
}

interface HistoryTableWrapperProps {
  startDate?: string;
  endDate?: string;
  actionTypes?: string;
  lotNumber?: string;
  organizationId?: string;
  productId?: string;
  includeRecalled?: boolean;
  // Server Component에서 미리 로드된 필터 데이터 (Phase 1A 최적화)
  initialOrganizations?: { id: string; name: string; type: OrganizationType }[];
  initialProducts?: { id: string; name: string; modelName: string; manufacturerName: string }[];
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
  initialOrganizations = [],
  initialProducts = [],
}: HistoryTableWrapperProps): React.ReactElement {
  // 이벤트 데이터 상태
  const [events, setEvents] = useState<AdminEventSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

  // 필터 데이터 (Server Component에서 미리 로드됨)
  const organizations = initialOrganizations;
  const products = initialProducts;

  // CSV 로딩 상태
  const [csvLoading, setCsvLoading] = useState(false);

  // 페이지별 커서 캐시 (이전 페이지로 돌아갈 때 사용)
  const pageCursorsRef = useRef<Map<number, PageCursor>>(new Map());

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
   * 특정 페이지 로드
   */
  const loadPage = useCallback(
    async (page: number) => {
      setIsLoading(true);
      setError(null);

      try {
        // 페이지 1은 커서 없이, 그 외는 해당 페이지의 커서 사용
        const cursor = page === 1 ? {} : pageCursorsRef.current.get(page) ?? {};

        const result = await getAdminEventSummaryCursorAction({
          startDate,
          endDate,
          actionTypes: actionTypesArray,
          lotNumber,
          organizationId,
          productId,
          includeRecalled,
          limit: PAGE_SIZE,
          cursorTime: cursor.time,
          cursorKey: cursor.key,
        });

        if (result.success && result.data) {
          setEvents(result.data.items);
          setHasNextPage(result.data.meta.hasMore);
          setCurrentPage(page);

          // 다음 페이지 커서 저장
          const lastItem = result.data.items.at(-1);
          if (lastItem && result.data.meta.hasMore) {
            pageCursorsRef.current.set(page + 1, {
              time: lastItem.eventTime,
              key: lastItem.id,
            });
          }
        } else {
          setError(result.error?.message ?? '데이터를 불러오는데 실패했습니다.');
        }
      } catch {
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    },
    [startDate, endDate, actionTypesArray, lotNumber, organizationId, productId, includeRecalled]
  );

  /**
   * 필터 변경 시 리셋
   */
  useEffect(() => {
    pageCursorsRef.current.clear();
    setCurrentPage(1);
    void loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  /**
   * 이전 페이지
   */
  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      void loadPage(currentPage - 1);
    }
  }, [currentPage, loadPage]);

  /**
   * 다음 페이지
   */
  const handleNextPage = useCallback(() => {
    if (hasNextPage) {
      void loadPage(currentPage + 1);
    }
  }, [hasNextPage, currentPage, loadPage]);

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
    pageCursorsRef.current.clear();
    void loadPage(1);
  }, [loadPage]);

  // 초기 로딩 상태
  if (isLoading && events.length === 0 && currentPage === 1) {
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
              건 (페이지 {currentPage})
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
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <AdminEventSummaryTable events={events} />
      )}

      {/* 페이지네이션 */}
      <div className="flex items-center justify-center gap-4 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevPage}
          disabled={currentPage === 1 || isLoading}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          이전
        </Button>
        <span className="text-sm text-muted-foreground">
          페이지 <span className="font-medium text-foreground">{currentPage}</span>
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          disabled={!hasNextPage || isLoading}
        >
          다음
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
