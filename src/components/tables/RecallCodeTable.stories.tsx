'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { VirtualCodeStatus } from '@/types/api.types';

/**
 * RecallCodeTable은 Server Actions에 의존합니다.
 * Storybook에서는 Mock 컴포넌트로 UI를 시뮬레이션합니다.
 */

interface MockCodeItem {
  id: string;
  code: string;
  currentStatus: VirtualCodeStatus;
  currentOwnerType: 'ORGANIZATION' | 'PATIENT';
  currentOwnerName: string;
}

function getStatusBadge(status: VirtualCodeStatus): React.ReactElement {
  switch (status) {
    case 'IN_STOCK':
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
          재고
        </span>
      );
    case 'USED':
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
          사용
        </span>
      );
    case 'DISPOSED':
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
          폐기
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
          {status}
        </span>
      );
  }
}

function getOwnerIcon(type: string): React.ReactElement {
  switch (type) {
    case 'ORGANIZATION':
      return <span className="text-xs">🏢</span>;
    case 'PATIENT':
      return <span className="text-xs">👤</span>;
    default:
      return <span className="text-xs">📦</span>;
  }
}

const mockCodes: MockCodeItem[] = [
  { id: '1', code: 'NC-A1B2C3D4', currentStatus: 'IN_STOCK', currentOwnerType: 'ORGANIZATION', currentOwnerName: '(주)네오디쎄' },
  { id: '2', code: 'NC-E5F6G7H8', currentStatus: 'IN_STOCK', currentOwnerType: 'ORGANIZATION', currentOwnerName: '메디플러스 유통' },
  { id: '3', code: 'NC-I9J0K1L2', currentStatus: 'USED', currentOwnerType: 'PATIENT', currentOwnerName: '김**' },
  { id: '4', code: 'NC-M3N4O5P6', currentStatus: 'IN_STOCK', currentOwnerType: 'ORGANIZATION', currentOwnerName: '강남뷰티클리닉' },
  { id: '5', code: 'NC-Q7R8S9T0', currentStatus: 'DISPOSED', currentOwnerType: 'ORGANIZATION', currentOwnerName: '강남뷰티클리닉' },
  { id: '6', code: 'NC-U1V2W3X4', currentStatus: 'IN_STOCK', currentOwnerType: 'ORGANIZATION', currentOwnerName: '(주)네오디쎄' },
  { id: '7', code: 'NC-Y5Z6A7B8', currentStatus: 'USED', currentOwnerType: 'PATIENT', currentOwnerName: '이**' },
  { id: '8', code: 'NC-C9D0E1F2', currentStatus: 'IN_STOCK', currentOwnerType: 'ORGANIZATION', currentOwnerName: '메디플러스 유통' },
];

interface MockRecallCodeTableProps {
  codes?: MockCodeItem[];
  totalPages?: number;
  isLoading?: boolean;
}

function MockRecallCodeTable({
  codes = mockCodes,
  totalPages = 3,
  isLoading = false,
}: MockRecallCodeTableProps) {
  const [page, setPage] = useState(1);
  const total = codes.length * totalPages;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">코드 로딩 중...</span>
      </div>
    );
  }

  if (codes.length === 0) {
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
          고유식별코드 ({total}개)
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={page <= 1}
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
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

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
      </div>
    </div>
  );
}

const meta = {
  title: 'Tables/Admin/RecallCodeTable',
  component: MockRecallCodeTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MockRecallCodeTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    codes: mockCodes,
    totalPages: 3,
  },
};

export const SinglePage: Story = {
  args: {
    codes: mockCodes.slice(0, 3),
    totalPages: 1,
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    codes: [],
  },
};
