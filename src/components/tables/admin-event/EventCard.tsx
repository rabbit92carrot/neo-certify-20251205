'use client';

/**
 * 모바일용 이벤트 카드 컴포넌트
 * 모바일에서 테이블 대신 카드 형태로 이벤트를 표시
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronDown, ChevronRight, AlertTriangle, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, formatNumber } from '@/lib/utils';
import { getActionTypeBadgeVariant, getOwnerIcon } from './utils';
import { LotSummaryRow } from './LotSummaryRow';
import type { AdminEventSummary } from '@/types/api.types';

interface EventCardProps {
  event: AdminEventSummary;
}

export function EventCard({ event }: EventCardProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden',
        event.isRecall && 'border-red-200 bg-red-50/50'
      )}
    >
      {/* 카드 헤더 - 클릭하여 확장 */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* 첫 번째 줄: 일시 + 이벤트 타입 + 수량 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {format(new Date(event.eventTime), 'MM.dd HH:mm', { locale: ko })}
            </span>
            <Badge
              variant={getActionTypeBadgeVariant(event.actionType)}
              className="text-xs"
            >
              {event.actionTypeLabel}
            </Badge>
            {event.isRecall && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {formatNumber(event.totalQuantity)}개
          </Badge>
        </div>

        {/* 두 번째 줄: 출발 → 도착 */}
        <div className="flex items-center gap-2 text-sm">
          {event.fromOwner ? (
            <div className="flex items-center gap-1 min-w-0">
              {getOwnerIcon(event.fromOwner.type)}
              <span className="truncate">{event.fromOwner.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
          <ChevronRight className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
          {event.toOwner ? (
            <div className="flex items-center gap-1 min-w-0">
              {getOwnerIcon(event.toOwner.type)}
              <span className="truncate">{event.toOwner.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>

        {/* 세 번째 줄: Lot 번호 요약 + 확장 버튼 */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Package className="h-3 w-3" />
            <span>Lot {event.lotSummaries.length}개</span>
          </div>
          <Button variant="ghost" size="sm" className="h-6 px-2">
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="text-xs ml-1">상세</span>
          </Button>
        </div>
      </div>

      {/* 확장 영역 - Lot별 상세 */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-3 border-t bg-gray-50/50">
          <div className="text-xs font-medium text-muted-foreground pt-3">
            Lot별 상세 - 클릭하여 고유식별코드 확인
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
      )}
    </div>
  );
}
