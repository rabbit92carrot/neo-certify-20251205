'use client';

/**
 * 검색 및 정렬 기능이 포함된 제품 목록 테이블
 * debounced 검색과 정렬 옵션을 제공합니다.
 */

import { useState, useCallback, useTransition } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductsTable } from './ProductsTable';
import { SearchInput } from '@/components/shared/SearchInput';
import type { Product, PaginationMeta, PaginatedResponse, ApiResponse } from '@/types/api.types';

type SortBy = 'model_name' | 'name' | 'created_at';
type SortOrder = 'asc' | 'desc';

interface ProductsTableWithSearchProps {
  /** 초기 제품 목록 */
  initialProducts: Product[];
  /** 초기 페이지네이션 메타 */
  initialMeta: PaginationMeta;
  /** 검색 서버 액션 */
  searchProductsAction: (
    search: string,
    sortBy: SortBy,
    sortOrder: SortOrder,
    page: number
  ) => Promise<ApiResponse<PaginatedResponse<Product>>>;
}

const SORT_OPTIONS = [
  { value: 'model_name', label: '모델명' },
  { value: 'name', label: '제품명' },
  { value: 'created_at', label: '등록일' },
] as const;

/**
 * 검색 및 정렬 기능이 포함된 제품 목록 테이블
 */
export function ProductsTableWithSearch({
  initialProducts,
  initialMeta,
  searchProductsAction,
}: ProductsTableWithSearchProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();

  // 상태
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [meta, setMeta] = useState<PaginationMeta>(initialMeta);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('model_name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // 검색 실행
  const executeSearch = useCallback(
    async (newSearch: string, newSortBy: SortBy, newSortOrder: SortOrder, page: number) => {
      startTransition(async () => {
        const result = await searchProductsAction(newSearch, newSortBy, newSortOrder, page);
        if (result.success && result.data) {
          setProducts(result.data.items);
          setMeta(result.data.meta);
        }
      });
    },
    [searchProductsAction]
  );

  // 검색어 변경 핸들러 (debounced)
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      setCurrentPage(1);
      executeSearch(value, sortBy, sortOrder, 1);
    },
    [executeSearch, sortBy, sortOrder]
  );

  // 정렬 기준 변경 핸들러
  const handleSortByChange = useCallback(
    (value: string) => {
      const newSortBy = value as SortBy;
      setSortBy(newSortBy);
      setCurrentPage(1);
      executeSearch(search, newSortBy, sortOrder, 1);
    },
    [executeSearch, search, sortOrder]
  );

  // 정렬 방향 토글
  const handleSortOrderToggle = useCallback(() => {
    const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newSortOrder);
    setCurrentPage(1);
    executeSearch(search, sortBy, newSortOrder, 1);
  }, [executeSearch, search, sortBy, sortOrder]);

  // 페이지 변경
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      executeSearch(search, sortBy, sortOrder, page);
    },
    [executeSearch, search, sortBy, sortOrder]
  );

  return (
    <div className="space-y-4">
      {/* 검색 및 정렬 영역 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* 검색 */}
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="제품명, 모델명, UDI-DI로 검색..."
          className="w-full sm:w-80"
        />

        {/* 정렬 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">정렬:</span>
          <Select value={sortBy} onValueChange={handleSortByChange}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={handleSortOrderToggle}
            title={sortOrder === 'asc' ? '오름차순' : '내림차순'}
          >
            <ArrowUpDown
              className={`h-4 w-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`}
            />
          </Button>
        </div>
      </div>

      {/* 결과 카운트 */}
      <div className="text-sm text-muted-foreground">
        {isPending ? (
          '검색 중...'
        ) : (
          <>
            총 <span className="font-medium">{meta.total}</span>개 제품
            {search && <span className="ml-1">(&quot;{search}&quot; 검색 결과)</span>}
          </>
        )}
      </div>

      {/* 테이블 */}
      <div className={isPending ? 'opacity-50 pointer-events-none' : ''}>
        <ProductsTable products={products} />
      </div>

      {/* 페이지네이션 */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1 || isPending}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            이전
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!meta.hasMore || isPending}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
