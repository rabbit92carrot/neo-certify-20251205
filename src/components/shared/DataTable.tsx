'use client';

/**
 * 데이터 테이블 컴포넌트
 * 무한 스크롤을 지원하는 테이블 컴포넌트입니다.
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { EmptyState } from './EmptyState';
import { LoadingSpinner } from './LoadingSpinner';
import { cn } from '@/lib/utils';

/**
 * 컬럼 정의 타입
 */
export interface ColumnDef<T> {
  /** 컬럼 ID */
  id: string;
  /** 헤더 제목 */
  header: string;
  /** 셀 렌더링 함수 */
  cell: (row: T) => React.ReactNode;
  /** 헤더 클래스 */
  headerClassName?: string;
  /** 셀 클래스 */
  cellClassName?: string;
}

interface DataTableProps<T> {
  /** 컬럼 정의 */
  columns: ColumnDef<T>[];
  /** 데이터 배열 */
  data: T[];
  /** 행 키 추출 함수 */
  getRowKey: (row: T) => string;
  /** 초기 로딩 상태 */
  isLoading?: boolean;
  /** 더 로드할 데이터가 있는지 */
  hasMore?: boolean;
  /** 다음 페이지 로드 함수 */
  onLoadMore?: () => void;
  /** 빈 상태 메시지 */
  emptyMessage?: string;
  /** 빈 상태 설명 */
  emptyDescription?: string;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 데이터 테이블 컴포넌트
 */
export function DataTable<T>({
  columns,
  data,
  getRowKey,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  emptyMessage = '데이터가 없습니다',
  emptyDescription,
  className,
}: DataTableProps<T>): React.ReactElement {
  const { observerRef, isLoadingMore } = useInfiniteScroll({
    isLoading,
    hasMore,
    onLoadMore,
  });

  // 초기 로딩
  if (isLoading && data.length === 0) {
    return (
      <div className={cn('rounded-md border', className)}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.id} className={column.headerClassName}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column) => (
                  <TableCell key={column.id} className={column.cellClassName}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // 빈 상태
  if (!isLoading && data.length === 0) {
    return (
      <div className={cn('rounded-md border', className)}>
        <EmptyState title={emptyMessage} description={emptyDescription} className="py-16" />
      </div>
    );
  }

  return (
    <div className={cn('rounded-md border', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id} className={column.headerClassName}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={getRowKey(row)}>
              {columns.map((column) => (
                <TableCell key={column.id} className={column.cellClassName}>
                  {column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* 무한 스크롤 트리거 */}
      <div ref={observerRef} className="h-px" />

      {/* 추가 로딩 표시 */}
      {isLoadingMore && (
        <div className="py-4 border-t">
          <LoadingSpinner size="sm" text="더 불러오는 중..." />
        </div>
      )}
    </div>
  );
}
