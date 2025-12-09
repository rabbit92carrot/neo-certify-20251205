'use client';

/**
 * 재고 테이블 컴포넌트
 * 제품별 재고와 Lot별 상세 정보를 표시합니다.
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  ChevronDown,
  ChevronRight,
  Package,
  Boxes,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';
import type { ProductInventoryDetail, InventorySummary } from '@/types/api.types';

interface InventoryTableProps {
  /** 제품별 재고 요약 */
  summaries: InventorySummary[];
  /** 상세 정보 조회 함수 */
  getDetail: (productId: string) => Promise<ProductInventoryDetail | null>;
}

/**
 * 제품별 재고 카드
 */
function ProductInventoryCard({
  summary,
  getDetail,
}: {
  summary: InventorySummary;
  getDetail: (productId: string) => Promise<ProductInventoryDetail | null>;
}): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);
  const [detail, setDetail] = useState<ProductInventoryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleExpand = async () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    if (!detail) {
      setIsLoading(true);
      const result = await getDetail(summary.productId);
      setDetail(result);
      setIsLoading(false);
    }

    setIsExpanded(true);
  };

  // 유효기한 경고 표시 (30일 이내)
  const isExpiryNear = (expiryDate: string): boolean => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysDiff = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 30;
  };

  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-gray-50"
        onClick={handleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-6 w-6">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-gray-400" />
              <span className="font-medium">{summary.productName}</span>
            </div>
          </div>

          <Badge
            variant={summary.totalQuantity > 0 ? 'default' : 'secondary'}
            className="text-sm"
          >
            {summary.totalQuantity}개
          </Badge>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="border-t pt-4">
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">
                로딩 중...
              </div>
            ) : detail && detail.byLot.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lot 번호</TableHead>
                    <TableHead>제조일자</TableHead>
                    <TableHead>유효기한</TableHead>
                    <TableHead className="text-right">수량</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.byLot.map((lot) => (
                    <TableRow key={lot.lotId}>
                      <TableCell className="font-mono text-sm">
                        {lot.lotNumber}
                      </TableCell>
                      <TableCell>
                        {format(new Date(lot.manufactureDate), 'yyyy-MM-dd', { locale: ko })}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            isExpiryNear(lot.expiryDate) && 'text-orange-600 font-medium'
                          )}
                        >
                          {format(new Date(lot.expiryDate), 'yyyy-MM-dd', { locale: ko })}
                          {isExpiryNear(lot.expiryDate) && (
                            <Badge variant="outline" className="ml-2 text-orange-600 border-orange-300">
                              임박
                            </Badge>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {lot.quantity}개
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-4 text-muted-foreground">
                Lot별 상세 정보가 없습니다.
              </p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

/**
 * 재고 테이블
 */
export function InventoryTable({
  summaries,
  getDetail,
}: InventoryTableProps): React.ReactElement {
  if (summaries.length === 0) {
    return (
      <EmptyState
        icon={Boxes}
        title="재고가 없습니다"
        description="현재 보유 중인 재고가 없습니다."
      />
    );
  }

  const totalQuantity = summaries.reduce((sum, s) => sum + s.totalQuantity, 0);

  return (
    <div className="space-y-4">
      {/* 요약 */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Boxes className="h-5 w-5 text-gray-400" />
          <span className="font-medium">전체 재고</span>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{totalQuantity.toLocaleString()}개</p>
          <p className="text-sm text-muted-foreground">{summaries.length}종</p>
        </div>
      </div>

      {/* 제품별 카드 */}
      <div className="space-y-3">
        {summaries.map((summary) => (
          <ProductInventoryCard
            key={summary.productId}
            summary={summary}
            getDetail={getDetail}
          />
        ))}
      </div>
    </div>
  );
}
