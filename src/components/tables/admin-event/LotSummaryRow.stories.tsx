'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/utils';

/**
 * LotSummaryRow는 이벤트 상세 내에서 Lot 정보를 표시하는 확장 가능한 행입니다.
 * 클릭하면 해당 Lot의 고유식별코드 목록을 표시합니다.
 */

interface MockLot {
  lotId: string;
  lotNumber: string;
  productName: string;
  modelName?: string;
  quantity: number;
  codeIds?: string[];
}

interface MockLotSummaryRowProps {
  lot?: MockLot;
  showCodes?: boolean;
}

const defaultLot: MockLot = {
  lotId: 'lot-001',
  lotNumber: 'LOT-2024-001',
  productName: 'PDO Thread Type A',
  modelName: 'PDO-A-100',
  quantity: 50,
  codeIds: ['code-1', 'code-2', 'code-3', 'code-4', 'code-5'],
};

function MockLotSummaryRow({ lot = defaultLot, showCodes = false }: MockLotSummaryRowProps) {
  const [isExpanded, setIsExpanded] = useState(showCodes);

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      {/* Lot 헤더 */}
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

      {/* 확장 영역 - 고유식별코드 */}
      {isExpanded && lot.codeIds && lot.codeIds.length > 0 && (
        <div className="px-4 pb-4 border-t">
          <div className="mt-2">
            <span className="text-xs font-medium text-muted-foreground">
              고유식별코드 ({formatNumber(lot.codeIds.length)}개)
            </span>
            <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-muted-foreground">
              실제 구현에서는 EventCodeTable 컴포넌트가 표시됩니다.
              <br />
              코드 ID: {lot.codeIds.slice(0, 3).join(', ')}
              {lot.codeIds.length > 3 && ` 외 ${lot.codeIds.length - 3}개`}
            </div>
          </div>
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

const meta = {
  title: 'Tables/AdminEvent/LotSummaryRow',
  component: MockLotSummaryRow,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-lg">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MockLotSummaryRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    lot: defaultLot,
  },
};

export const Expanded: Story = {
  args: {
    lot: defaultLot,
    showCodes: true,
  },
};

export const WithoutModel: Story = {
  args: {
    lot: {
      ...defaultLot,
      modelName: undefined,
    },
  },
};

export const LargeLot: Story = {
  args: {
    lot: {
      lotId: 'lot-002',
      lotNumber: 'LOT-2024-LARGE-002',
      productName: 'PDO Thread Premium Extra Long',
      modelName: 'PDO-PREMIUM-500',
      quantity: 1000,
      codeIds: Array.from({ length: 1000 }, (_, i) => `code-${i + 1}`),
    },
  },
};

export const NoCodes: Story = {
  args: {
    lot: {
      ...defaultLot,
      codeIds: [],
    },
    showCodes: true,
  },
};

export const LongLotNumber: Story = {
  args: {
    lot: {
      lotId: 'lot-003',
      lotNumber: 'LOT-2024-MANUFACTURER-PRODUCT-TYPE-A-BATCH-001',
      productName: 'PDO Thread Type A Premium Edition Special',
      modelName: 'PDO-A-100-PREMIUM-SPECIAL-EDITION',
      quantity: 250,
      codeIds: ['code-1', 'code-2', 'code-3'],
    },
  },
};

export const MultipleLots: Story = {
  render: () => (
    <div className="space-y-3">
      <MockLotSummaryRow
        lot={{
          lotId: 'lot-001',
          lotNumber: 'LOT-2024-001',
          productName: 'PDO Thread Type A',
          modelName: 'PDO-A-100',
          quantity: 50,
          codeIds: ['code-1', 'code-2', 'code-3'],
        }}
      />
      <MockLotSummaryRow
        lot={{
          lotId: 'lot-002',
          lotNumber: 'LOT-2024-002',
          productName: 'PDO Thread Type B',
          modelName: 'PDO-B-200',
          quantity: 75,
          codeIds: ['code-4', 'code-5', 'code-6', 'code-7'],
        }}
      />
      <MockLotSummaryRow
        lot={{
          lotId: 'lot-003',
          lotNumber: 'LOT-2024-003',
          productName: 'PDO Thread Premium',
          modelName: 'PDO-P-500',
          quantity: 25,
          codeIds: ['code-8', 'code-9'],
        }}
      />
    </div>
  ),
};
