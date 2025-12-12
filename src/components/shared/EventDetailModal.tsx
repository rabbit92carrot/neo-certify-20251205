'use client';

/**
 * 이벤트 상세 모달 컴포넌트
 * 이벤트 요약 + 샘플 코드 10개 표시
 */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Package,
  AlertTriangle,
  Factory,
  Truck,
  Building2,
  Stethoscope,
  User,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { cn, formatNumber } from '@/lib/utils';
import { VIRTUAL_CODE_STATUS_LABELS } from '@/constants/product';
import type {
  AdminEventSummary,
  AdminEventSampleCode,
  VirtualCodeStatus,
  HistoryActionType,
} from '@/types/api.types';
import { getEventSampleCodesAction } from '@/app/(dashboard)/admin/actions';

interface EventDetailModalProps {
  event: AdminEventSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 상태별 배지 스타일
 */
function getStatusBadgeVariant(
  status: VirtualCodeStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'IN_STOCK':
      return 'default';
    case 'USED':
      return 'secondary';
    case 'DISPOSED':
      return 'destructive';
    default:
      return 'outline';
  }
}

/**
 * 이벤트 타입별 아이콘
 */
function getActionTypeIcon(actionType: HistoryActionType): React.ReactNode {
  switch (actionType) {
    case 'PRODUCED':
      return <Factory className="h-5 w-5" />;
    case 'SHIPPED':
    case 'RECEIVED':
      return <Truck className="h-5 w-5" />;
    case 'TREATED':
      return <Stethoscope className="h-5 w-5" />;
    case 'RECALLED':
      return <AlertTriangle className="h-5 w-5" />;
    case 'DISPOSED':
      return <Package className="h-5 w-5" />;
    default:
      return <Package className="h-5 w-5" />;
  }
}

/**
 * 조직/환자 타입별 아이콘
 */
function getOwnerIcon(type: 'ORGANIZATION' | 'PATIENT' | string): React.ReactNode {
  if (type === 'PATIENT') {
    return <User className="h-4 w-4" />;
  }
  return <Building2 className="h-4 w-4" />;
}

export function EventDetailModal({
  event,
  open,
  onOpenChange,
}: EventDetailModalProps): React.ReactElement {
  const [sampleCodes, setSampleCodes] = useState<AdminEventSampleCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 이벤트가 변경되면 샘플 코드 로드
  useEffect(() => {
    if (!event || !open) {
      setSampleCodes([]);
      setError(null);
      return;
    }

    const loadSampleCodes = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getEventSampleCodesAction(event.sampleCodeIds);
        if (result.success && result.data) {
          setSampleCodes(result.data);
        } else {
          setError(result.error?.message || '샘플 코드를 불러오는데 실패했습니다.');
        }
      } catch {
        setError('샘플 코드를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSampleCodes();
  }, [event, open]);

  if (!event) {return <></>;}

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getActionTypeIcon(event.actionType)}
            <span>{event.actionTypeLabel} 상세</span>
            {event.isRecall && (
              <Badge variant="destructive" className="ml-2">
                회수
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {format(new Date(event.eventTime), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
          </DialogDescription>
        </DialogHeader>

        {/* 요약 정보 */}
        <div className={cn('rounded-lg p-4', event.isRecall ? 'bg-red-50' : 'bg-gray-50')}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* 총 수량 */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">총 수량</div>
              <div className="text-xl font-bold">{formatNumber(event.totalQuantity)}개</div>
            </div>

            {/* Lot 수 */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">Lot 수</div>
              <div className="text-xl font-bold">{event.lotSummaries.length}개</div>
            </div>

            {/* 제품 수 */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">제품 종류</div>
              <div className="text-xl font-bold">
                {new Set(event.lotSummaries.map((l) => l.productId)).size}종
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* 출발/도착 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">출발</div>
              {event.fromOwner ? (
                <div className="flex items-center gap-2">
                  {getOwnerIcon(event.fromOwner.type)}
                  <span className="font-medium">{event.fromOwner.name}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">도착</div>
              {event.toOwner ? (
                <div className="flex items-center gap-2">
                  {getOwnerIcon(event.toOwner.type)}
                  <span className="font-medium">{event.toOwner.name}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
          </div>

          {/* 회수 사유 */}
          {event.isRecall && event.recallReason && (
            <>
              <Separator className="my-4" />
              <div>
                <div className="text-xs text-muted-foreground mb-1">회수 사유</div>
                <div className="text-red-700">{event.recallReason}</div>
              </div>
            </>
          )}
        </div>

        {/* Lot별 상세 */}
        <div>
          <h4 className="text-sm font-medium mb-2">Lot별 상세</h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lot 번호</TableHead>
                  <TableHead>제품명</TableHead>
                  <TableHead className="text-right">수량</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {event.lotSummaries.map((lot) => (
                  <TableRow key={lot.lotId}>
                    <TableCell>
                      <code className="text-xs font-mono">{lot.lotNumber}</code>
                    </TableCell>
                    <TableCell>{lot.productName}</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(lot.quantity)}개
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* 샘플 코드 */}
        <div>
          <h4 className="text-sm font-medium mb-2">
            샘플 코드 (최대 10개)
          </h4>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">로딩 중...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : sampleCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              샘플 코드가 없습니다.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>식별코드</TableHead>
                    <TableHead>현재 상태</TableHead>
                    <TableHead>현재 소유자</TableHead>
                    <TableHead>제품명</TableHead>
                    <TableHead>Lot</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleCodes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell>
                        <code className="text-xs font-mono">{code.code}</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(code.currentStatus)}>
                          {VIRTUAL_CODE_STATUS_LABELS[code.currentStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{code.currentOwnerName}</TableCell>
                      <TableCell className="text-sm">{code.productName}</TableCell>
                      <TableCell>
                        <code className="text-xs">{code.lotNumber}</code>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {sampleCodes.length > 0 && sampleCodes.length < event.totalQuantity && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              전체 {formatNumber(event.totalQuantity)}개 중 {sampleCodes.length}개 표시
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
