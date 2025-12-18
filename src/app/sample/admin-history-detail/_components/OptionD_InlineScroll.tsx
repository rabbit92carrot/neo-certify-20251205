'use client';

/**
 * Option D: 인라인 + 스크롤 패턴
 * Lot 확장 시 최대 높이가 제한된 스크롤 영역에 코드 표시
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { VirtualCodeTable } from './VirtualCodeTable';
import {
  MOCK_LOT_SUMMARIES,
  getPaginatedCodes,
  type MockLotSummary,
} from '../_data/mock-data';

interface LotScrollItemProps {
  lot: MockLotSummary;
}

function LotScrollItem({ lot }: LotScrollItemProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { codes, totalPages, total } = getPaginatedCodes(lot.lotId, page, 20);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <div className="flex items-center gap-4">
              <code className="text-sm font-mono bg-gray-200 px-2 py-0.5 rounded">
                {lot.lotNumber}
              </code>
              <span className="text-sm font-medium">{lot.productName}</span>
              <span className="text-xs text-muted-foreground">
                {lot.modelName}
              </span>
            </div>
          </div>
          <Badge variant="outline">{lot.quantity}개</Badge>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="ml-9 mt-2 p-4 border rounded-lg bg-white">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">
              고유식별코드 (최대 200px 스크롤)
            </h4>
            <Badge variant="secondary" className="text-xs">
              {page}/{totalPages} 페이지
            </Badge>
          </div>
          {/* 최대 높이 200px로 제한하여 스크롤 */}
          <VirtualCodeTable
            codes={codes}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            compact
            maxHeight="200px"
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function OptionD_InlineScroll(): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Option D: 인라인 + 스크롤</CardTitle>
        <p className="text-sm text-muted-foreground">
          확장된 영역 내에서 최대 높이(200px)를 제한하여 스크롤합니다.
          세로 길이가 제한되지만 이중 스크롤이 발생할 수 있습니다.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {MOCK_LOT_SUMMARIES.map((lot) => (
            <LotScrollItem key={lot.lotId} lot={lot} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
