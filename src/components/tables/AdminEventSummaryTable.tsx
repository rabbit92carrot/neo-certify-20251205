'use client';

/**
 * 관리자 이벤트 요약 테이블 컴포넌트
 * 이벤트 단위 요약 표시, 행 클릭시 상세 모달
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  ChevronDown,
  ChevronRight,
  Package,
  AlertTriangle,
  Factory,
  Truck,
  Building2,
  Stethoscope,
  User,
  Eye,
} from 'lucide-react';
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
import { EmptyState } from '@/components/shared/EmptyState';
import { cn, formatNumber } from '@/lib/utils';
import type { AdminEventSummary, AdminEventLotSummary, HistoryActionType } from '@/types/api.types';

interface AdminEventSummaryTableProps {
  events: AdminEventSummary[];
  onViewDetail: (event: AdminEventSummary) => void;
}

/**
 * 이벤트 타입별 배지 스타일
 */
function getActionTypeBadgeVariant(
  actionType: HistoryActionType
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (actionType) {
    case 'PRODUCED':
      return 'default';
    case 'SHIPPED':
    case 'RECEIVED':
      return 'secondary';
    case 'TREATED':
      return 'outline';
    case 'RECALLED':
    case 'DISPOSED':
      return 'destructive';
    default:
      return 'outline';
  }
}

/**
 * 조직/환자 타입별 아이콘
 */
function getOwnerIcon(type: 'ORGANIZATION' | 'PATIENT' | string): React.ReactNode {
  if (type === 'PATIENT') {
    return <User className="h-3 w-3" />;
  }
  // 기본적으로 조직 아이콘 사용
  return <Building2 className="h-3 w-3" />;
}

/**
 * 이벤트 타입별 아이콘
 */
function getActionTypeIcon(actionType: HistoryActionType): React.ReactNode {
  switch (actionType) {
    case 'PRODUCED':
      return <Factory className="h-4 w-4" />;
    case 'SHIPPED':
    case 'RECEIVED':
      return <Truck className="h-4 w-4" />;
    case 'TREATED':
      return <Stethoscope className="h-4 w-4" />;
    case 'RECALLED':
      return <AlertTriangle className="h-4 w-4" />;
    case 'DISPOSED':
      return <Package className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
}

/**
 * Lot 요약 행
 */
function LotSummaryRow({ lot }: { lot: AdminEventLotSummary }): React.ReactElement {
  return (
    <div className="flex items-center justify-between p-2 rounded bg-gray-50 text-sm">
      <div className="flex items-center gap-3">
        <code className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
          {lot.lotNumber}
        </code>
        <span className="text-muted-foreground">{lot.productName}</span>
      </div>
      <Badge variant="outline" className="text-xs">
        {formatNumber(lot.quantity)}개
      </Badge>
    </div>
  );
}

/**
 * 이벤트 행 (확장 가능)
 * 테이블 구조에 맞게 Collapsible 대신 상태 기반 토글 사용
 */
function EventRow({
  event,
  onViewDetail,
}: {
  event: AdminEventSummary;
  onViewDetail: (event: AdminEventSummary) => void;
}): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  // Lot 번호 요약 (최대 3개까지 표시)
  const lotNumbers = event.lotSummaries.map((l) => l.lotNumber);
  const displayLots = lotNumbers.slice(0, 3);
  const remainingLots = lotNumbers.length - 3;

  return (
    <>
      <TableRow className={cn(event.isRecall && 'bg-red-50')}>
        {/* 일시 */}
        <TableCell className="whitespace-nowrap">
          {format(new Date(event.eventTime), 'MM.dd HH:mm', { locale: ko })}
        </TableCell>

        {/* 이벤트 타입 */}
        <TableCell>
          <div className="flex items-center gap-2">
            {getActionTypeIcon(event.actionType)}
            <Badge variant={getActionTypeBadgeVariant(event.actionType)}>
              {event.actionTypeLabel}
            </Badge>
            {event.isRecall && (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </div>
        </TableCell>

        {/* 수량 */}
        <TableCell>
          <Badge variant="outline" className="font-mono">
            {formatNumber(event.totalQuantity)}개
          </Badge>
        </TableCell>

        {/* 출발 */}
        <TableCell>
          {event.fromOwner ? (
            <div className="flex items-center gap-1">
              {getOwnerIcon(event.fromOwner.type)}
              <span className="text-sm max-w-[150px] truncate">
                {event.fromOwner.name}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>

        {/* 도착 */}
        <TableCell>
          {event.toOwner ? (
            <div className="flex items-center gap-1">
              {getOwnerIcon(event.toOwner.type)}
              <span className="text-sm max-w-[150px] truncate">
                {event.toOwner.name}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>

        {/* Lot 번호 */}
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-auto font-normal"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4 mr-1" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-1" />
            )}
            <div className="flex items-center gap-1">
              <code className="text-xs font-mono">{displayLots.join(', ')}</code>
              {remainingLots > 0 && (
                <Badge variant="secondary" className="text-xs ml-1">
                  +{remainingLots}
                </Badge>
              )}
            </div>
          </Button>
        </TableCell>

        {/* 상세보기 */}
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetail(event)}
            className="h-8"
          >
            <Eye className="h-4 w-4 mr-1" />
            상세
          </Button>
        </TableCell>
      </TableRow>

      {/* 확장 콘텐츠 - Lot별 상세 */}
      {isOpen && (
        <TableRow>
          <TableCell colSpan={7} className="p-0">
            <div className="px-6 py-3 space-y-2 bg-gray-50/50">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Lot별 상세 ({event.lotSummaries.length}개)
              </div>
              {event.lotSummaries.map((lot) => (
                <LotSummaryRow key={lot.lotId} lot={lot} />
              ))}
              {event.isRecall && event.recallReason && (
                <div className="p-2 rounded bg-red-100 text-sm text-red-800">
                  <span className="font-medium">회수 사유:</span> {event.recallReason}
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

/**
 * 관리자 이벤트 요약 테이블
 */
export function AdminEventSummaryTable({
  events,
  onViewDetail,
}: AdminEventSummaryTableProps): React.ReactElement {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="이벤트가 없습니다"
        description="조회 조건에 맞는 이벤트가 없습니다."
      />
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">일시</TableHead>
            <TableHead className="w-[140px]">이벤트</TableHead>
            <TableHead className="w-[100px]">수량</TableHead>
            <TableHead>출발</TableHead>
            <TableHead>도착</TableHead>
            <TableHead>Lot 번호</TableHead>
            <TableHead className="w-[80px]">상세</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <EventRow key={event.id} event={event} onViewDetail={onViewDetail} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
