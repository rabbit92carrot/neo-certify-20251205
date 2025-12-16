'use client';

/**
 * Option A: 중첩 아코디언 패턴
 * Lot 행을 클릭하면 하위에 가상코드 테이블이 펼쳐지는 방식
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

interface LotAccordionItemProps {
  lot: MockLotSummary;
}

function LotAccordionItem({ lot }: LotAccordionItemProps): React.ReactElement {
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
              고유식별코드 목록
            </h4>
            <Badge variant="secondary" className="text-xs">
              {page}/{totalPages} 페이지
            </Badge>
          </div>
          <VirtualCodeTable
            codes={codes}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            compact
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function OptionA_NestedAccordion(): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Option A: 중첩 아코디언</CardTitle>
        <p className="text-sm text-muted-foreground">
          각 Lot 행을 클릭하면 아래로 고유식별코드 테이블이 펼쳐집니다.
          현재 구조와 가장 유사한 패턴입니다.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {MOCK_LOT_SUMMARIES.map((lot) => (
            <LotAccordionItem key={lot.lotId} lot={lot} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
