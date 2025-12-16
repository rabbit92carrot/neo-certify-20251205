'use client';

/**
 * 관리자 이력 페이지 래퍼 컴포넌트
 * 이벤트 단위 요약 뷰 + CSV 다운로드
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminEventSummaryTable } from '@/components/tables/AdminEventSummaryTable';
import { AdminEventSummaryFilter } from '@/components/shared/AdminEventSummaryFilter';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { generateCsvString, downloadCsv, formatDateTimeKorea } from '@/lib/utils';
import {
  getAdminEventSummaryAction,
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
  [key: string]: string | number; // 인덱스 시그니처 추가
}

interface HistoryTableWrapperProps {
  page?: number;
  startDate?: string;
  endDate?: string;
  actionTypes?: string;
  lotNumber?: string;
  organizationId?: string;
  productId?: string;
  includeRecalled?: boolean;
}

export function HistoryTableWrapper({
  page = 1,
  startDate,
  endDate,
  actionTypes,
  lotNumber,
  organizationId,
  productId,
  includeRecalled = true,
}: HistoryTableWrapperProps): React.ReactElement {
  const router = useRouter();
  const [events, setEvents] = useState<AdminEventSummary[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [organizations, setOrganizations] = useState<
    { id: string; name: string; type: OrganizationType }[]
  >([]);
  const [products, setProducts] = useState<
    { id: string; name: string; manufacturerName: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [csvLoading, setCsvLoading] = useState(false);

  // actionTypes 문자열을 배열로 변환
  const actionTypesArray = actionTypes ? actionTypes.split(',').filter(Boolean) : undefined;

  // 데이터 로드
  useEffect(() => {
    let ignore = false;

    const fetchData = async (): Promise<void> => {
      setLoading(true);

      // 병렬로 데이터 조회
      const [eventResult, orgsResult, productsResult] = await Promise.all([
        getAdminEventSummaryAction({
          page,
          pageSize: 50,
          startDate,
          endDate,
          actionTypes: actionTypesArray,
          lotNumber,
          organizationId,
          productId,
          includeRecalled,
        }),
        getAllOrganizationsForSelectAction(),
        getAllProductsForSelectAction(),
      ]);

      if (!ignore) {
        if (eventResult.success && eventResult.data) {
          setEvents(eventResult.data.items);
          setTotalPages(eventResult.data.meta.totalPages);
          setTotal(eventResult.data.meta.total);
        }
        if (orgsResult.success && orgsResult.data) {
          setOrganizations(orgsResult.data);
        }
        if (productsResult.success && productsResult.data) {
          setProducts(productsResult.data);
        }
        setLoading(false);
      }
    };

    void fetchData();

    return (): void => {
      ignore = true;
    };
  }, [
    page,
    startDate,
    endDate,
    actionTypesArray?.join(','),
    lotNumber,
    organizationId,
    productId,
    includeRecalled,
  ]);

  // 페이지 이동 헬퍼
  const buildPageUrl = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams();
      params.set('page', String(newPage));
      if (startDate) {params.set('startDate', startDate);}
      if (endDate) {params.set('endDate', endDate);}
      if (actionTypes) {params.set('actionTypes', actionTypes);}
      if (lotNumber) {params.set('lotNumber', lotNumber);}
      if (organizationId) {params.set('organizationId', organizationId);}
      if (productId) {params.set('productId', productId);}
      if (!includeRecalled) {params.set('includeRecalled', 'false');}
      return `/admin/history?${params.toString()}`;
    },
    [startDate, endDate, actionTypes, lotNumber, organizationId, productId, includeRecalled]
  );

  const goToPage = useCallback(
    (newPage: number) => {
      router.push(buildPageUrl(newPage));
    },
    [router, buildPageUrl]
  );

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
        // AdminEventSummary를 CSV용 객체로 변환
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
      }
    } catch (error) {
      console.error('CSV download failed:', error);
    } finally {
      setCsvLoading(false);
    }
  }, [startDate, endDate, actionTypesArray, lotNumber, organizationId, productId, includeRecalled]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* 필터 */}
      <AdminEventSummaryFilter organizations={organizations} products={products} />

      {/* 툴바: 총 개수 + CSV 다운로드 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          총 <span className="font-medium text-foreground">{total.toLocaleString()}</span>건
        </div>
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

      {/* 테이블 */}
      <AdminEventSummaryTable events={events} />

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
          >
            다음
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
