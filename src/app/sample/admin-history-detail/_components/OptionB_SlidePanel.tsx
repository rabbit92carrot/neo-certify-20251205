'use client';

/**
 * Option B: 슬라이드 패널 패턴
 * 좌측에 Lot 목록, 우측에 선택된 Lot의 상세 정보 표시
 */

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { VirtualCodeTable } from './VirtualCodeTable';
import {
  MOCK_LOT_SUMMARIES,
  getPaginatedCodes,
  type MockLotSummary,
} from '../_data/mock-data';

export function OptionB_SlidePanel(): React.ReactElement {
  const [selectedLot, setSelectedLot] = useState<MockLotSummary | null>(
    MOCK_LOT_SUMMARIES[0] ?? null
  );
  const [page, setPage] = useState(1);

  const { codes, totalPages, total } = selectedLot
    ? getPaginatedCodes(selectedLot.lotId, page, 20)
    : { codes: [], totalPages: 0, total: 0 };

  const handleLotSelect = (lot: MockLotSummary) => {
    setSelectedLot(lot);
    setPage(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Option B: 슬라이드 패널</CardTitle>
        <p className="text-sm text-muted-foreground">
          좌측에서 Lot을 선택하면 우측 패널에 상세 정보가 표시됩니다.
          세로 길이를 제어하기 용이합니다.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-4 min-h-[400px]">
          {/* 좌측: Lot 목록 */}
          <div className="col-span-2 border rounded-lg">
            <div className="p-3 border-b bg-gray-50">
              <h4 className="text-sm font-medium">Lot별 상세 ({MOCK_LOT_SUMMARIES.length}개)</h4>
            </div>
            <ScrollArea className="h-[350px]">
              <div className="p-2 space-y-1">
                {MOCK_LOT_SUMMARIES.map((lot) => (
                  <div
                    key={lot.lotId}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                      selectedLot?.lotId === lot.lotId
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleLotSelect(lot)}
                  >
                    <div className="flex-1 min-w-0">
                      <code className="text-xs font-mono block truncate">
                        {lot.lotNumber}
                      </code>
                      <span className="text-xs text-muted-foreground truncate block">
                        {lot.productName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {lot.quantity}
                      </Badge>
                      {selectedLot?.lotId === lot.lotId && (
                        <ChevronRight className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* 우측: 상세 정보 */}
          <div className="col-span-3 border rounded-lg">
            {selectedLot ? (
              <>
                <div className="p-3 border-b bg-gray-50">
                  <h4 className="text-sm font-medium">{selectedLot.lotNumber} 상세</h4>
                </div>
                <div className="p-4 space-y-4">
                  {/* 제품 정보 */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">제품명</span>
                      <p className="font-medium">{selectedLot.productName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">모델번호</span>
                      <p className="font-mono text-xs">{selectedLot.modelName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">수량</span>
                      <p className="font-medium">{selectedLot.quantity}개</p>
                    </div>
                  </div>

                  <Separator />

                  {/* 가상 코드 테이블 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium">고유식별코드</h5>
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
                      maxHeight="200px"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                좌측에서 Lot을 선택하세요
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
