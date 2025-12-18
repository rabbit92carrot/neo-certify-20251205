'use client';

/**
 * 가상 코드 테이블 컴포넌트 (공통)
 * 페이지네이션 포함
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MockVirtualCode } from '../_data/mock-data';

interface VirtualCodeTableProps {
  codes: MockVirtualCode[];
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  compact?: boolean;
  maxHeight?: string;
}

function getStatusBadgeVariant(
  status: 'IN_STOCK' | 'USED' | 'DISPOSED'
): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'IN_STOCK':
      return 'default';
    case 'USED':
      return 'secondary';
    case 'DISPOSED':
      return 'destructive';
  }
}

const STATUS_LABELS = {
  IN_STOCK: '재고',
  USED: '사용됨',
  DISPOSED: '폐기',
};

export function VirtualCodeTable({
  codes,
  page,
  totalPages,
  total,
  onPageChange,
  compact = false,
  maxHeight,
}: VirtualCodeTableProps): React.ReactElement {
  const tableContent = (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className={compact ? 'text-xs' : ''}>식별코드</TableHead>
          <TableHead className={compact ? 'text-xs' : ''}>상태</TableHead>
          <TableHead className={compact ? 'text-xs' : ''}>현재 소유자</TableHead>
          {!compact && <TableHead>제품명</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {codes.map((code) => (
          <TableRow key={code.id}>
            <TableCell>
              <code className={`font-mono ${compact ? 'text-xs' : 'text-sm'}`}>
                {code.code}
              </code>
            </TableCell>
            <TableCell>
              <Badge
                variant={getStatusBadgeVariant(code.currentStatus)}
                className={compact ? 'text-xs px-1.5 py-0' : ''}
              >
                {STATUS_LABELS[code.currentStatus]}
              </Badge>
            </TableCell>
            <TableCell className={compact ? 'text-xs' : 'text-sm'}>
              {code.currentOwnerName}
            </TableCell>
            {!compact && (
              <TableCell className="text-sm">{code.productName}</TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-2">
      {maxHeight ? (
        <div
          className="rounded-md border overflow-auto"
          style={{ maxHeight }}
        >
          {tableContent}
        </div>
      ) : (
        <div className="rounded-md border">{tableContent}</div>
      )}

      {/* 페이지네이션 */}
      <div className="flex items-center justify-between px-2">
        <span className="text-xs text-muted-foreground">
          전체 {total}개 중 {(page - 1) * 20 + 1}-{Math.min(page * 20, total)}개
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="h-7 w-7 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm px-2">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
