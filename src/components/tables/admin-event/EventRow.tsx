'use client';

/**
 * 이벤트 행 (데스크톱 테이블용)
 * 테이블 구조에 맞게 상태 기반 토글 사용
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn, formatNumber } from '@/lib/utils';
import { getActionTypeBadgeVariant, getOwnerIcon, getActionTypeIcon } from './utils';
import { LotSummaryRow } from './LotSummaryRow';
import type { AdminEventSummary } from '@/types/api.types';

interface EventRowProps {
  event: AdminEventSummary;
}

export function EventRow({ event }: EventRowProps): React.ReactElement {
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
            {event.isRecall && <AlertTriangle className="h-4 w-4 text-red-500" />}
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
              <span className="text-sm max-w-[150px] truncate">{event.fromOwner.name}</span>
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
              <span className="text-sm max-w-[150px] truncate">{event.toOwner.name}</span>
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
      </TableRow>

      {/* 확장 콘텐츠 - Lot별 상세 (고유식별코드 포함) */}
      {isOpen && (
        <TableRow>
          <TableCell colSpan={6} className="p-0 max-w-0">
            <div className="px-6 py-4 space-y-3 bg-gray-50/50 overflow-hidden w-full">
              <div className="text-xs font-medium text-muted-foreground">
                Lot별 상세 ({event.lotSummaries.length}개) - 클릭하여 고유식별코드 확인
              </div>
              {event.lotSummaries.map((lot) => (
                <LotSummaryRow key={lot.lotId} lot={lot} />
              ))}
              {event.isRecall && event.recallReason && (
                <div className="p-3 rounded-lg bg-red-100 text-sm text-red-800">
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
