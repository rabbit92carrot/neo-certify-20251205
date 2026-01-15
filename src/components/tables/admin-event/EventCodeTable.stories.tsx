'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Loader2,
  Factory,
  Truck,
  Stethoscope,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/utils';

/**
 * EventCodeTable은 이벤트별 고유식별코드 목록을 페이지네이션과 함께 표시합니다.
 * 코드의 현재 상태와 소유자 정보를 확인할 수 있습니다.
 */

type CodeStatus = 'IN_STOCK' | 'USED' | 'DISPOSED';
type OwnerType = 'MANUFACTURER' | 'DISTRIBUTOR' | 'HOSPITAL';

interface MockCode {
  id: string;
  code: string;
  currentStatus: CodeStatus;
  currentOwnerType: OwnerType;
  currentOwnerName: string;
}

interface MockEventCodeTableProps {
  codes?: MockCode[];
  isLoading?: boolean;
  isEmpty?: boolean;
  totalPages?: number;
}

function getStatusBadge(status: CodeStatus) {
  switch (status) {
    case 'IN_STOCK':
      return <Badge variant="secondary" className="text-xs">재고</Badge>;
    case 'USED':
      return <Badge variant="outline" className="text-xs">사용됨</Badge>;
    case 'DISPOSED':
      return <Badge variant="destructive" className="text-xs">폐기</Badge>;
  }
}

function getOwnerIcon(type: OwnerType) {
  switch (type) {
    case 'MANUFACTURER':
      return <Factory className="h-3 w-3" />;
    case 'DISTRIBUTOR':
      return <Truck className="h-3 w-3" />;
    case 'HOSPITAL':
      return <Stethoscope className="h-3 w-3" />;
  }
}

const defaultCodes: MockCode[] = [
  { id: '1', code: 'NC-ABCD1234', currentStatus: 'IN_STOCK', currentOwnerType: 'DISTRIBUTOR', currentOwnerName: '헬스케어 유통' },
  { id: '2', code: 'NC-EFGH5678', currentStatus: 'IN_STOCK', currentOwnerType: 'DISTRIBUTOR', currentOwnerName: '헬스케어 유통' },
  { id: '3', code: 'NC-IJKL9012', currentStatus: 'USED', currentOwnerType: 'HOSPITAL', currentOwnerName: '강남뷰티클리닉' },
  { id: '4', code: 'NC-MNOP3456', currentStatus: 'IN_STOCK', currentOwnerType: 'HOSPITAL', currentOwnerName: '강남뷰티클리닉' },
  { id: '5', code: 'NC-QRST7890', currentStatus: 'DISPOSED', currentOwnerType: 'HOSPITAL', currentOwnerName: '청담스킨클리닉' },
];

function MockEventCodeTable({
  codes = defaultCodes,
  isLoading = false,
  isEmpty = false,
  totalPages = 1,
}: MockEventCodeTableProps) {
  const [page, setPage] = useState(1);

  // 로딩 상태
  if (isLoading && codes.length === 0) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">코드 로딩 중...</span>
      </div>
    );
  }

  // 빈 상태
  if (isEmpty || codes.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        고유식별코드가 없습니다.
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">
          고유식별코드 ({formatNumber(codes.length)}개)
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <span className="text-xs text-muted-foreground px-1">
              {page}/{totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* 코드 테이블 */}
      <div className="relative rounded border bg-white overflow-hidden">
        <div className="max-h-[200px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-xs table-fixed min-w-[280px]">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="h-8 py-1 px-2 text-left font-medium text-muted-foreground w-[35%]">
                  코드
                </th>
                <th className="h-8 py-1 px-2 text-left font-medium text-muted-foreground w-[20%]">
                  상태
                </th>
                <th className="h-8 py-1 px-2 text-left font-medium text-muted-foreground w-[45%]">
                  현재 소유
                </th>
              </tr>
            </thead>
            <tbody>
              {codes.map((code) => (
                <tr key={code.id} className="border-t hover:bg-gray-50/50">
                  <td className="py-1.5 px-2 font-mono truncate">{code.code}</td>
                  <td className="py-1.5 px-2">{getStatusBadge(code.currentStatus)}</td>
                  <td className="py-1.5 px-2">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="flex-shrink-0">
                        {getOwnerIcon(code.currentOwnerType)}
                      </span>
                      <span className="truncate">{code.currentOwnerName}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 로딩 오버레이 */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

const meta = {
  title: 'Tables/AdminEvent/EventCodeTable',
  component: MockEventCodeTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MockEventCodeTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    codes: defaultCodes,
  },
};

export const Loading: Story = {
  args: {
    codes: [],
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    isEmpty: true,
  },
};

export const WithPagination: Story = {
  args: {
    codes: defaultCodes,
    totalPages: 5,
  },
};

export const AllInStock: Story = {
  args: {
    codes: defaultCodes.map((c) => ({ ...c, currentStatus: 'IN_STOCK' as const })),
  },
};

export const AllUsed: Story = {
  args: {
    codes: defaultCodes.map((c) => ({ ...c, currentStatus: 'USED' as const })),
  },
};

export const MixedStatus: Story = {
  args: {
    codes: [
      { id: '1', code: 'NC-ABCD1234', currentStatus: 'IN_STOCK', currentOwnerType: 'DISTRIBUTOR', currentOwnerName: '헬스케어 유통' },
      { id: '2', code: 'NC-EFGH5678', currentStatus: 'IN_STOCK', currentOwnerType: 'HOSPITAL', currentOwnerName: '강남뷰티클리닉' },
      { id: '3', code: 'NC-IJKL9012', currentStatus: 'USED', currentOwnerType: 'HOSPITAL', currentOwnerName: '강남뷰티클리닉' },
      { id: '4', code: 'NC-MNOP3456', currentStatus: 'DISPOSED', currentOwnerType: 'HOSPITAL', currentOwnerName: '청담스킨클리닉' },
      { id: '5', code: 'NC-QRST7890', currentStatus: 'IN_STOCK', currentOwnerType: 'MANUFACTURER', currentOwnerName: '메디케어 제조' },
    ],
  },
};
