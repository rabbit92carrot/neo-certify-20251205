'use client';

/**
 * 데이터 테이블 컴포넌트
 * 무한 스크롤을 지원하는 테이블 컴포넌트입니다.
 * React.memo를 활용하여 불필요한 리렌더링을 방지합니다.
 */

import React, { memo, useMemo } from 'react';
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
 * 메모이제이션된 테이블 셀 컴포넌트
 * 셀 렌더러의 결과가 동일하면 리렌더링을 건너뜁니다.
 */
interface MemoizedCellProps {
  cellContent: React.ReactNode;
  cellClassName?: string;
}

const MemoizedCell = memo(function MemoizedCell({ cellContent, cellClassName }: MemoizedCellProps) {
  return (
    <TableCell className={cellClassName}>
      {cellContent}
    </TableCell>
  );
});

/**
 * 메모이제이션된 테이블 행 컴포넌트
 * 행 데이터가 변경되지 않으면 리렌더링을 건너뜁니다.
 */
interface MemoizedRowProps<T> {
  row: T;
  columns: ColumnDef<T>[];
}

function MemoizedRowComponent<T>({ row, columns }: MemoizedRowProps<T>) {
  return (
    <TableRow>
      {columns.map((column) => (
        <MemoizedCell
          key={column.id}
          cellContent={column.cell(row)}
          cellClassName={column.cellClassName}
        />
      ))}
    </TableRow>
  );
}

/**
 * 스켈레톤 로딩 행 컴포넌트
 */
interface SkeletonRowProps {
  columnCount: number;
  cellClassNames: (string | undefined)[];
}

const SkeletonRow = memo(function SkeletonRow({ columnCount, cellClassNames }: SkeletonRowProps) {
  return (
    <TableRow>
      {Array.from({ length: columnCount }).map((_, index) => (
        <TableCell key={index} className={cellClassNames[index]}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );
});

/**
 * 테이블 헤더 컴포넌트
 */
interface TableHeaderProps {
  headers: Array<{ id: string; header: string; headerClassName?: string }>;
}

const TableHeaderComponent = memo(function TableHeaderComponent({ headers }: TableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        {headers.map((column) => (
          <TableHead key={column.id} className={column.headerClassName}>
            {column.header}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
});

/**
 * 데이터 테이블 컴포넌트
 *
 * @example
 * ```tsx
 * const columns = useMemo(() => [
 *   { id: 'name', header: '이름', cell: (row) => row.name },
 *   { id: 'email', header: '이메일', cell: (row) => row.email },
 * ], []);
 *
 * <DataTable
 *   columns={columns}
 *   data={data}
 *   getRowKey={(row) => row.id}
 * />
 * ```
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

  // 헤더 정보 메모이제이션
  const headers = useMemo(() =>
    columns.map(col => ({
      id: col.id,
      header: col.header,
      headerClassName: col.headerClassName
    })),
    [columns]
  );

  // 셀 클래스 이름 배열 메모이제이션
  const cellClassNames = useMemo(() =>
    columns.map(col => col.cellClassName),
    [columns]
  );

  // 스켈레톤 행 인덱스 배열 메모이제이션
  const skeletonRows = useMemo(() => Array.from({ length: 5 }, (_, i) => i), []);

  // 초기 로딩
  if (isLoading && data.length === 0) {
    return (
      <div className={cn('rounded-md border', className)}>
        <Table>
          <TableHeaderComponent headers={headers} />
          <TableBody>
            {skeletonRows.map((rowIndex) => (
              <SkeletonRow
                key={rowIndex}
                columnCount={columns.length}
                cellClassNames={cellClassNames}
              />
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
        <TableHeaderComponent headers={headers} />
        <TableBody>
          {data.map((row) => {
            const rowKey = getRowKey(row);
            return (
              <MemoizedRowComponent
                key={rowKey}
                row={row}
                columns={columns}
              />
            );
          })}
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

/**
 * 메모이제이션된 DataTable
 * 부모 컴포넌트의 리렌더링으로 인한 불필요한 렌더링을 방지합니다.
 *
 * 주의: 이 컴포넌트를 사용할 때 columns와 getRowKey는
 * 부모 컴포넌트에서 useMemo/useCallback으로 메모이제이션해야 합니다.
 */
export const MemoizedDataTable = memo(DataTable) as typeof DataTable;
