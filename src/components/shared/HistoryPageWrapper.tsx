'use client';

/**
 * 거래 이력 페이지 래퍼 컴포넌트
 * 제조사/유통사/병원 공통 페이지네이션 이력 조회
 *
 * 성능 최적화:
 * - 커서 기반 페이지네이션 (OFFSET 대비 10-50배 성능 향상)
 * - count 쿼리 제거 (hasMore 플래그로 대체)
 * - 기본 3일 날짜 범위로 초기 로드 최적화
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { format, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Search,
  X,
  Filter,
} from 'lucide-react';
import { TransactionHistoryTable } from '@/components/tables/TransactionHistoryTable';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { TransactionHistorySummary, CursorPaginatedHistory } from '@/services/history.service';
import type { ApiResponse, HistoryActionType } from '@/types/api.types';

interface ActionTypeOption {
  value: string;
  label: string;
}

/**
 * 제품 별칭 맵 타입 (병원용)
 */
export type ProductAliasMap = Record<string, { alias: string | null; modelName: string }>;

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
  /** 조직별 액션 타입 옵션 */
  actionTypeOptions: ActionTypeOption[];
  /** 제품 별칭 맵 (병원용 - 별칭 및 모델명 표시) */
  productAliasMap?: ProductAliasMap;
  /** 반품 액션 (입고 이력에서만 사용 - 수신자가 발송자에게 반품) */
  onReturn?: (shipmentBatchId: string, reason: string) => Promise<ApiResponse<void>>;
  /** 반품 버튼 표시 여부 */
  showReturnButton?: boolean;
  /** 기본 액션 타입 필터 */
  defaultActionType?: string;
}

// 페이지별 커서 캐시 타입
interface PageCursor {
  time?: string;
  key?: string;
}

// 페이지 사이즈 상수
const PAGE_SIZE = 20;

export function HistoryPageWrapper({
  currentOrgId,
  fetchHistoryCursor,
  initialData = [],
  actionTypeOptions,
  productAliasMap,
  onReturn,
  showReturnButton,
  defaultActionType = 'all',
}: HistoryPageWrapperProps): React.ReactElement {
  // 필터 상태 (기본값: 3일 전~오늘)
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 3));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [actionType, setActionType] = useState<string>(defaultActionType);

  // 필터 변경 여부 추적 (조회 버튼 클릭 후 데이터 로드)
  const [appliedFilters, setAppliedFilters] = useState({
    startDate: format(subDays(new Date(), 3), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    actionType: defaultActionType,
  });

  // 이벤트 데이터 상태
  const [histories, setHistories] = useState<TransactionHistorySummary[]>(initialData);
  const [isLoading, setIsLoading] = useState(initialData.length === 0);
  const [error, setError] = useState<string | null>(null);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

  // 페이지별 커서 캐시 (이전 페이지로 돌아갈 때 사용)
  const pageCursorsRef = useRef<Map<number, PageCursor>>(new Map());

  // 필터 조건 키 (변경 감지용)
  const filterKey = [
    appliedFilters.startDate,
    appliedFilters.endDate,
    appliedFilters.actionType,
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

        // 액션 타입 배열 구성
        const actionTypes =
          appliedFilters.actionType === 'all'
            ? undefined
            : ([appliedFilters.actionType] as HistoryActionType[]);

        const result = await fetchHistoryCursor({
          startDate: appliedFilters.startDate,
          endDate: appliedFilters.endDate,
          actionTypes,
          limit: PAGE_SIZE,
          cursorTime: cursor.time,
          cursorKey: cursor.key,
        });

        if (result.success && result.data) {
          setHistories(result.data.items);
          setHasNextPage(result.data.meta.hasMore);
          setCurrentPage(page);

          // 다음 페이지 커서 저장
          const lastItem = result.data.items.at(-1);
          if (lastItem && result.data.meta.hasMore) {
            pageCursorsRef.current.set(page + 1, {
              time: lastItem.createdAt,
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
    [appliedFilters, fetchHistoryCursor]
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

  const applyFilters = (): void => {
    setAppliedFilters({
      startDate: startDate ? format(startDate, 'yyyy-MM-dd') : format(subDays(new Date(), 3), 'yyyy-MM-dd'),
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      actionType,
    });
  };

  // 필터 초기화 (기본값: 3일 전~오늘로 리셋)
  const resetFilters = (): void => {
    const defaultStartDate = subDays(new Date(), 3);
    const defaultEndDate = new Date();
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    setActionType(defaultActionType);
    setAppliedFilters({
      startDate: format(defaultStartDate, 'yyyy-MM-dd'),
      endDate: format(defaultEndDate, 'yyyy-MM-dd'),
      actionType: defaultActionType,
    });
  };

  // 새로고침
  const handleRefresh = useCallback(() => {
    pageCursorsRef.current.clear();
    void loadPage(1);
  }, [loadPage]);

  const activeFilterCount = [startDate, endDate, actionType !== 'all'].filter(Boolean).length;

  // 액션 타입 옵션 (전체 옵션 추가)
  const actionTypeComboboxOptions: ComboboxOption[] = useMemo(
    () => [
      { value: 'all', label: '전체' },
      ...actionTypeOptions.map((opt) => ({
        value: opt.value,
        label: opt.label,
      })),
    ],
    [actionTypeOptions]
  );

  // 초기 로딩 상태
  if (isLoading && histories.length === 0 && currentPage === 1) {
    return <LoadingSpinner />;
  }

  // 에러 상태
  if (error && histories.length === 0) {
    return (
      <div className="space-y-6">
        {/* 필터 */}
        <FilterSection
          startDate={startDate}
          endDate={endDate}
          actionType={actionType}
          actionTypeOptions={actionTypeComboboxOptions}
          activeFilterCount={activeFilterCount}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onActionTypeChange={setActionType}
          onApply={applyFilters}
          onReset={resetFilters}
        />

        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 필터 */}
      <FilterSection
        startDate={startDate}
        endDate={endDate}
        actionType={actionType}
        actionTypeOptions={actionTypeComboboxOptions}
        activeFilterCount={activeFilterCount}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onActionTypeChange={setActionType}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      {/* 툴바: 건수 + 새로고침 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {histories.length > 0 && (
            <>
              <span className="font-medium text-foreground">{histories.length.toLocaleString()}</span>
              건 (페이지 {currentPage})
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
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <TransactionHistoryTable
          histories={histories}
          currentOrgId={currentOrgId}
          productAliasMap={productAliasMap}
          onReturn={onReturn}
          showReturnButton={showReturnButton}
        />
      )}

      {/* 페이지네이션 */}
      {histories.length > 0 && (
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
      )}
    </div>
  );
}

/**
 * 필터 섹션 컴포넌트
 */
interface FilterSectionProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  actionType: string;
  actionTypeOptions: ComboboxOption[];
  activeFilterCount: number;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onActionTypeChange: (type: string) => void;
  onApply: () => void;
  onReset: () => void;
}

function FilterSection({
  startDate,
  endDate,
  actionType,
  actionTypeOptions,
  activeFilterCount,
  onStartDateChange,
  onEndDateChange,
  onActionTypeChange,
  onApply,
  onReset,
}: FilterSectionProps): React.ReactElement {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">필터</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="h-4 w-4 mr-1" />
            초기화
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 시작일 */}
        <div className="space-y-2">
          <Label className="text-xs">시작일</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !startDate && 'text-muted-foreground'
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'yyyy.MM.dd', { locale: ko }) : '선택'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={startDate}
                onSelect={onStartDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* 종료일 */}
        <div className="space-y-2">
          <Label className="text-xs">종료일</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !endDate && 'text-muted-foreground'
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'yyyy.MM.dd', { locale: ko }) : '선택'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={endDate}
                onSelect={onEndDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* 이벤트 유형 */}
        <div className="space-y-2">
          <Label className="text-xs">이벤트 유형</Label>
          <Combobox
            options={actionTypeOptions}
            value={actionType}
            onValueChange={onActionTypeChange}
            placeholder="전체"
            searchPlaceholder="유형 검색..."
          />
        </div>

        <div className="flex items-end">
          <Button onClick={onApply} className="w-full">
            <Search className="h-4 w-4 mr-2" />
            조회
          </Button>
        </div>
      </div>
    </div>
  );
}
