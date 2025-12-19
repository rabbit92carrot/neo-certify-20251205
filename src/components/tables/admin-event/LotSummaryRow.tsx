'use client';

/**
 * Lot 요약 행 (확장 가능 - 고유식별코드 포함)
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/utils';
import { EventCodeTable } from './EventCodeTable';
import type { AdminEventLotSummary } from '@/types/api.types';

interface LotSummaryRowProps {
  lot: AdminEventLotSummary;
}

export function LotSummaryRow({ lot }: LotSummaryRowProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      {/* Lot 헤더 (클릭하여 확장) */}
      <div
        className="flex items-start justify-between p-3 gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0 mt-0.5">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          {/* 모바일: 세로 배치 / 데스크톱: 가로 배치 */}
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <code className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded w-fit break-all">
              {lot.lotNumber}
            </code>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="text-sm font-medium truncate">{lot.productName}</span>
              <span className="text-xs text-muted-foreground truncate">
                {lot.modelName || '-'}
              </span>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-xs flex-shrink-0">
          {formatNumber(lot.quantity)}개
        </Badge>
      </div>

      {/* 확장 영역 - 고유식별코드 테이블 */}
      {isExpanded && lot.codeIds && lot.codeIds.length > 0 && (
        <div className="px-4 pb-4 border-t">
          <EventCodeTable codeIds={lot.codeIds} />
        </div>
      )}
      {isExpanded && (!lot.codeIds || lot.codeIds.length === 0) && (
        <div className="px-4 pb-4 border-t">
          <div className="text-center py-4 text-sm text-muted-foreground">
            고유식별코드 정보가 없습니다.
          </div>
        </div>
      )}
    </div>
  );
}
