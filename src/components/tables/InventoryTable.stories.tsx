'use client';

import type { Meta, StoryObj } from '@storybook/react';
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

/**
 * InventoryTable - 재고 현황을 표시하는 컴포넌트
 */

interface MockInventorySummary {
  productId: string;
  productName: string;
  modelName: string;
  udiDi: string;
  totalQuantity: number;
  alias?: string | null;
}

interface MockLotDetail {
  lotId: string;
  lotNumber: string;
  manufactureDate: string;
  expiryDate: string;
  quantity: number;
}

interface MockProductDetail {
  productId: string;
  byLot: MockLotDetail[];
}

const mockSummaries: MockInventorySummary[] = [
  {
    productId: 'prod-001',
    productName: 'PDO Thread Type A',
    modelName: 'PDO-A-100',
    udiDi: '00123456789012A',
    totalQuantity: 150,
  },
  {
    productId: 'prod-002',
    productName: 'PDO Thread Type B',
    modelName: 'PDO-B-200',
    udiDi: '00123456789012B',
    totalQuantity: 80,
    alias: '타입B',
  },
  {
    productId: 'prod-003',
    productName: 'PDO Thread Premium',
    modelName: 'PDO-P-500',
    udiDi: '00123456789012C',
    totalQuantity: 30,
    alias: '프리미엄',
  },
];

const mockDetails: Record<string, MockProductDetail> = {
  'prod-001': {
    productId: 'prod-001',
    byLot: [
      { lotId: 'lot-001', lotNumber: 'ND00001241201', manufactureDate: '2024-12-01', expiryDate: '2026-12-01', quantity: 100 },
      { lotId: 'lot-002', lotNumber: 'ND00001241215', manufactureDate: '2024-12-15', expiryDate: '2026-12-15', quantity: 50 },
    ],
  },
  'prod-002': {
    productId: 'prod-002',
    byLot: [
      { lotId: 'lot-003', lotNumber: 'ND00002241201', manufactureDate: '2024-12-01', expiryDate: '2025-02-01', quantity: 80 },
    ],
  },
  'prod-003': {
    productId: 'prod-003',
    byLot: [
      { lotId: 'lot-004', lotNumber: 'ND00003241201', manufactureDate: '2024-12-01', expiryDate: '2026-06-01', quantity: 30 },
    ],
  },
};

function ProductInventoryCard({
  summary,
  getDetail,
}: {
  summary: MockInventorySummary;
  getDetail: (productId: string) => Promise<MockProductDetail | null>;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [detail, setDetail] = useState<MockProductDetail | null>(null);
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
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <Package className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <span className="font-medium">
                  {summary.alias || summary.productName}
                </span>
                {summary.modelName && (
                  <div className="text-xs text-muted-foreground truncate">{summary.modelName}</div>
                )}
                {summary.udiDi && (
                  <div className="text-xs text-muted-foreground truncate">UDI: {summary.udiDi}</div>
                )}
              </div>
            </div>
          </div>

          <Badge
            variant={summary.totalQuantity > 0 ? 'default' : 'secondary'}
            className="text-sm flex-shrink-0"
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

function MockInventoryTable({ summaries = mockSummaries }: { summaries?: MockInventorySummary[] }) {
  const getDetail = async (productId: string): Promise<MockProductDetail | null> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockDetails[productId] || null;
  };

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

const meta = {
  title: 'Tables/Shared/InventoryTable',
  component: MockInventoryTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MockInventoryTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    summaries: [],
  },
};

export const SingleProduct: Story = {
  args: {
    summaries: [mockSummaries[0]],
  },
};

export const WithAlias: Story = {
  args: {
    summaries: mockSummaries.filter((s) => s.alias),
  },
};
