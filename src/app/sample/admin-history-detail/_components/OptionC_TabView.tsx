'use client';

/**
 * Option C: 탭 기반 뷰 패턴
 * 요약 정보 / Lot 상세 / 코드 목록을 탭으로 분리
 */

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { VirtualCodeTable } from './VirtualCodeTable';
import {
  MOCK_LOT_SUMMARIES,
  MOCK_EVENT_SUMMARY,
  getPaginatedCodes,
} from '../_data/mock-data';
import { formatNumber } from '@/lib/utils';

export function OptionC_TabView(): React.ReactElement {
  const [selectedLotId, setSelectedLotId] = useState(MOCK_LOT_SUMMARIES[0]?.lotId ?? '');
  const [page, setPage] = useState(1);

  const selectedLot = MOCK_LOT_SUMMARIES.find((lot) => lot.lotId === selectedLotId);
  const { codes, totalPages, total } = selectedLot
    ? getPaginatedCodes(selectedLot.lotId, page, 20)
    : { codes: [], totalPages: 0, total: 0 };

  const handleLotChange = (lotId: string) => {
    setSelectedLotId(lotId);
    setPage(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Option C: 탭 기반 뷰</CardTitle>
        <p className="text-sm text-muted-foreground">
          요약 정보, Lot 상세, 코드 목록을 탭으로 분리하여 고정 높이를 유지합니다.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">요약 정보</TabsTrigger>
            <TabsTrigger value="lots">Lot 상세</TabsTrigger>
            <TabsTrigger value="codes">코드 목록</TabsTrigger>
          </TabsList>

          {/* 요약 정보 탭 */}
          <TabsContent value="summary" className="mt-4">
            <div className="p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">총 수량</span>
                  <p className="text-2xl font-bold">
                    {formatNumber(MOCK_EVENT_SUMMARY.totalQuantity)}개
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Lot 수</span>
                  <p className="text-2xl font-bold">
                    {MOCK_EVENT_SUMMARY.lotSummaries.length}개
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">제품 종류</span>
                  <p className="text-2xl font-bold">
                    {new Set(MOCK_EVENT_SUMMARY.lotSummaries.map((l) => l.productId)).size}종
                  </p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">출발</span>
                  <p className="font-medium">{MOCK_EVENT_SUMMARY.fromOwner?.name ?? '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">도착</span>
                  <p className="font-medium">{MOCK_EVENT_SUMMARY.toOwner?.name ?? '-'}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Lot 상세 탭 */}
          <TabsContent value="lots" className="mt-4">
            <div className="space-y-2">
              {MOCK_LOT_SUMMARIES.map((lot) => (
                <div
                  key={lot.lotId}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <code className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">
                      {lot.lotNumber}
                    </code>
                    <div>
                      <p className="text-sm font-medium">{lot.productName}</p>
                      <p className="text-xs text-muted-foreground">{lot.modelName}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{lot.quantity}개</Badge>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* 코드 목록 탭 */}
          <TabsContent value="codes" className="mt-4">
            <div className="space-y-4">
              {/* Lot 선택 */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Lot 선택:</span>
                <Select value={selectedLotId} onValueChange={handleLotChange}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Lot을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_LOT_SUMMARIES.map((lot) => (
                      <SelectItem key={lot.lotId} value={lot.lotId}>
                        {lot.lotNumber} - {lot.productName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 선택된 Lot 정보 */}
              {selectedLot && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-sm">
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
                </div>
              )}

              {/* 코드 테이블 */}
              {selectedLot && (
                <VirtualCodeTable
                  codes={codes}
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  onPageChange={setPage}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
