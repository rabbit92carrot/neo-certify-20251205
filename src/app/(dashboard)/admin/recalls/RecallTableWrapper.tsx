'use client';

/**
 * 회수 이력 테이블 래퍼 컴포넌트
 * 전통적 페이지네이션 + 필터
 *
 * 성능 최적화:
 * - 커서 기반 페이지네이션 내부 사용 (OFFSET 대비 10-50배 성능 향상)
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { format, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Calendar,
  Search,
  X,
  Filter,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { RecallHistoryTable } from '@/components/tables/RecallHistoryTable';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { getRecallHistoryCursorAction } from '../actions';
import { cn } from '@/lib/utils';
import type { RecallHistoryItem } from '@/types/api.types';

interface RecallTableWrapperProps {
  startDate?: string;
  endDate?: string;
  type?: 'shipment' | 'treatment' | 'all';
}

// 페이지별 커서 캐시 타입
interface PageCursor {
  time?: string;
  key?: string;
}

// 페이지 사이즈 상수
const PAGE_SIZE = 10;

export function RecallTableWrapper({
  startDate: initialStartDate,
  endDate: initialEndDate,
  type: initialType = 'all',
}: RecallTableWrapperProps): React.ReactElement {
  // 필터 상태 (기본값: 3일 전~오늘)
  const [startDate, setStartDate] = useState<Date | undefined>(
    initialStartDate ? new Date(initialStartDate) : subDays(new Date(), 3)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialEndDate ? new Date(initialEndDate) : new Date()
  );
  const [type, setType] = useState<'shipment' | 'treatment' | 'all'>(initialType);

  // 필터 변경 여부 추적 (조회 버튼 클릭 후 데이터 로드)
  const [appliedFilters, setAppliedFilters] = useState({
    startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
    endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
    type,
  });

  // 회수 데이터 상태
  const [recalls, setRecalls] = useState<RecallHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    appliedFilters.type,
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
        const cursor = page === 1 ? {} : pageCursorsRef.current.get(page) || {};

        const result = await getRecallHistoryCursorAction({
          startDate: appliedFilters.startDate,
          endDate: appliedFilters.endDate,
          type: appliedFilters.type,
          limit: PAGE_SIZE,
          cursorTime: cursor.time,
          cursorKey: cursor.key,
        });

        if (result.success && result.data) {
          setRecalls(result.data.items);
          setHasNextPage(result.data.meta.hasMore);
          setCurrentPage(page);

          // 다음 페이지 커서 저장
          const lastItem = result.data.items.at(-1);
          if (lastItem && result.data.meta.hasMore) {
            pageCursorsRef.current.set(page + 1, {
              time: lastItem.recallDate,
              key: lastItem.id,
            });
          }
        } else {
          setError(result.error?.message || '데이터를 불러오는데 실패했습니다.');
        }
      } catch {
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    },
    [appliedFilters]
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
      startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
      type,
    });
  };

  // 필터 초기화 (기본값: 3일 전~오늘로 리셋)
  const resetFilters = (): void => {
    const defaultStartDate = subDays(new Date(), 3);
    const defaultEndDate = new Date();
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    setType('all');
    setAppliedFilters({
      startDate: format(defaultStartDate, 'yyyy-MM-dd'),
      endDate: format(defaultEndDate, 'yyyy-MM-dd'),
      type: 'all',
    });
  };

  // 새로고침
  const handleRefresh = useCallback(() => {
    pageCursorsRef.current.clear();
    void loadPage(1);
  }, [loadPage]);

  const activeFilterCount = [startDate, endDate, type !== 'all'].filter(Boolean).length;

  // 회수 유형 옵션
  const recallTypeOptions: ComboboxOption[] = useMemo(
    () => [
      { value: 'all', label: '전체' },
      { value: 'shipment', label: '출고 회수' },
      { value: 'treatment', label: '시술 회수' },
    ],
    []
  );

  // 초기 로딩 상태
  if (isLoading && recalls.length === 0 && currentPage === 1) {
    return <LoadingSpinner />;
  }

  // 에러 상태
  if (error && recalls.length === 0) {
    return (
      <div className="space-y-6">
        {/* 필터 */}
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
              <Button variant="ghost" size="sm" onClick={resetFilters}>
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
                    onSelect={setStartDate}
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
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* 유형 */}
            <div className="space-y-2">
              <Label className="text-xs">회수 유형</Label>
              <Combobox
                options={recallTypeOptions}
                value={type}
                onValueChange={(v) => setType(v as typeof type)}
                placeholder="전체"
                searchPlaceholder="유형 검색..."
              />
            </div>

            <div className="flex items-end">
              <Button onClick={applyFilters} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                조회
              </Button>
            </div>
          </div>
        </div>

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
            <Button variant="ghost" size="sm" onClick={resetFilters}>
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
                  onSelect={setStartDate}
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
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 유형 */}
          <div className="space-y-2">
            <Label className="text-xs">회수 유형</Label>
            <Combobox
              options={recallTypeOptions}
              value={type}
              onValueChange={(v) => setType(v as typeof type)}
              placeholder="전체"
              searchPlaceholder="유형 검색..."
            />
          </div>

          <div className="flex items-end">
            <Button onClick={applyFilters} className="w-full">
              <Search className="h-4 w-4 mr-2" />
              조회
            </Button>
          </div>
        </div>
      </div>

      {/* 툴바: 건수 + 새로고침 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {recalls.length > 0 && (
            <>
              <span className="font-medium text-foreground">{recalls.length.toLocaleString()}</span>
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
        </div>
      </div>

      {/* 테이블 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <RecallHistoryTable recalls={recalls} />
      )}

      {/* 페이지네이션 */}
      {recalls.length > 0 && (
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
