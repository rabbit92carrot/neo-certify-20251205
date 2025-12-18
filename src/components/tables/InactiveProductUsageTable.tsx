'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Pagination } from '@/components/shared/Pagination';
import type { InactiveProductUsageLog, PaginatedResponse } from '@/types/api.types';
import { DEACTIVATION_REASON_LABELS } from '@/types/api.types';
import { CheckCircle, AlertTriangle, AlertOctagon, Package, Syringe } from 'lucide-react';

interface InactiveProductUsageTableProps {
  data: PaginatedResponse<InactiveProductUsageLog> | null;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onAcknowledge?: (logId: string) => void;
  showAcknowledgeButton?: boolean;
}

export function InactiveProductUsageTable({
  data,
  isLoading,
  onPageChange,
  onAcknowledge,
  showAcknowledgeButton = true,
}: InactiveProductUsageTableProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAcknowledge = async (logId: string) => {
    if (!onAcknowledge) {return;}
    setProcessingId(logId);
    await onAcknowledge(logId);
    setProcessingId(null);
  };

  // 비활성화 사유에 따른 배지 색상
  const getReasonBadgeVariant = (reason: string) => {
    switch (reason) {
      case 'SAFETY_ISSUE':
        return 'destructive';
      case 'QUALITY_ISSUE':
        return 'default';
      case 'DISCONTINUED':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // 비활성화 사유에 따른 아이콘
  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'SAFETY_ISSUE':
        return <AlertOctagon className="h-4 w-4" />;
      case 'QUALITY_ISSUE':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <CheckCircle className="h-12 w-12 mb-4" />
        <p>비활성 제품 사용 기록이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">사용 유형</TableHead>
              <TableHead>제품명</TableHead>
              <TableHead>비활성화 사유</TableHead>
              <TableHead>사용 조직</TableHead>
              <TableHead className="text-right">수량</TableHead>
              <TableHead className="w-[160px]">일시</TableHead>
              <TableHead className="w-[100px]">상태</TableHead>
              {showAcknowledgeButton && <TableHead className="w-[100px]">작업</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  {showAcknowledgeButton && <TableCell><Skeleton className="h-8 w-16" /></TableCell>}
                </TableRow>
              ))
            ) : (
              data.items.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {log.usageType === 'SHIPMENT' ? (
                        <Package className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Syringe className="h-4 w-4 text-green-500" />
                      )}
                      <span>{log.usageType === 'SHIPMENT' ? '출고' : '시술'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{log.productName}</TableCell>
                  <TableCell>
                    <Badge variant={getReasonBadgeVariant(log.deactivationReason)}>
                      <span className="flex items-center gap-1">
                        {getReasonIcon(log.deactivationReason)}
                        {DEACTIVATION_REASON_LABELS[log.deactivationReason]}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>{log.organizationName}</TableCell>
                  <TableCell className="text-right">{log.quantity}개</TableCell>
                  <TableCell>
                    {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                  </TableCell>
                  <TableCell>
                    {log.acknowledgedAt ? (
                      <Badge variant="outline" className="text-green-600">
                        확인됨
                      </Badge>
                    ) : (
                      <Badge variant="destructive">미확인</Badge>
                    )}
                  </TableCell>
                  {showAcknowledgeButton && (
                    <TableCell>
                      {!log.acknowledgedAt && onAcknowledge && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcknowledge(log.id)}
                          disabled={processingId === log.id}
                        >
                          {processingId === log.id ? '처리중...' : '확인'}
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 */}
      {data.meta.totalPages > 1 && (
        <Pagination
          currentPage={data.meta.page}
          totalPages={data.meta.totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
