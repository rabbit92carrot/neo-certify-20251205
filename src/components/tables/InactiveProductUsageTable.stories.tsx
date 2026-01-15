'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/shared/Pagination';
import { CheckCircle, AlertTriangle, AlertOctagon, Package, Syringe } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

/**
 * InactiveProductUsageTable은 Server Actions에 의존합니다.
 * Storybook에서는 Mock 컴포넌트로 UI를 시뮬레이션합니다.
 */

type UsageType = 'SHIPMENT' | 'TREATMENT';
type DeactivationReason = 'SAFETY_ISSUE' | 'QUALITY_ISSUE' | 'DISCONTINUED' | 'OTHER';

const DEACTIVATION_REASON_LABELS: Record<DeactivationReason, string> = {
  SAFETY_ISSUE: '안전 문제',
  QUALITY_ISSUE: '품질 문제',
  DISCONTINUED: '단종',
  OTHER: '기타',
};

interface MockUsageLog {
  id: string;
  usageType: UsageType;
  productName: string;
  deactivationReason: DeactivationReason;
  organizationName: string;
  quantity: number;
  createdAt: string;
  acknowledgedAt: string | null;
}

const mockLogs: MockUsageLog[] = [
  {
    id: 'log-001',
    usageType: 'SHIPMENT',
    productName: 'PDO Thread Type A',
    deactivationReason: 'SAFETY_ISSUE',
    organizationName: '(주)네오디쎄',
    quantity: 50,
    createdAt: '2024-12-10T09:30:00Z',
    acknowledgedAt: null,
  },
  {
    id: 'log-002',
    usageType: 'TREATMENT',
    productName: 'PDO Thread Type B',
    deactivationReason: 'QUALITY_ISSUE',
    organizationName: '강남뷰티클리닉',
    quantity: 5,
    createdAt: '2024-12-09T14:20:00Z',
    acknowledgedAt: null,
  },
  {
    id: 'log-003',
    usageType: 'SHIPMENT',
    productName: 'PDO Thread Premium',
    deactivationReason: 'DISCONTINUED',
    organizationName: '메디플러스 유통',
    quantity: 100,
    createdAt: '2024-12-08T11:15:00Z',
    acknowledgedAt: '2024-12-08T15:30:00Z',
  },
  {
    id: 'log-004',
    usageType: 'TREATMENT',
    productName: 'PDO Thread Type A',
    deactivationReason: 'SAFETY_ISSUE',
    organizationName: '청담스킨클리닉',
    quantity: 3,
    createdAt: '2024-12-07T16:45:00Z',
    acknowledgedAt: null,
  },
  {
    id: 'log-005',
    usageType: 'SHIPMENT',
    productName: 'PDO Thread Type C',
    deactivationReason: 'OTHER',
    organizationName: '(주)네오디쎄',
    quantity: 20,
    createdAt: '2024-12-06T10:00:00Z',
    acknowledgedAt: '2024-12-06T12:00:00Z',
  },
];

function getReasonBadgeVariant(reason: DeactivationReason): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (reason) {
    case 'SAFETY_ISSUE':
      return 'destructive';
    case 'QUALITY_ISSUE':
      return 'default';
    case 'DISCONTINUED':
      return 'secondary';
    default:
      return 'outline';
  }
}

function getReasonIcon(reason: DeactivationReason) {
  switch (reason) {
    case 'SAFETY_ISSUE':
      return <AlertOctagon className="h-4 w-4" />;
    case 'QUALITY_ISSUE':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return null;
  }
}

interface MockInactiveProductUsageTableProps {
  logs?: MockUsageLog[];
  showAcknowledgeButton?: boolean;
  showPagination?: boolean;
}

function MockInactiveProductUsageTable({
  logs = mockLogs,
  showAcknowledgeButton = true,
  showPagination = true,
}: MockInactiveProductUsageTableProps) {
  const [items, setItems] = useState(logs);
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAcknowledge = async (logId: string) => {
    setProcessingId(logId);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setItems(items.map((item) =>
      item.id === logId ? { ...item, acknowledgedAt: new Date().toISOString() } : item
    ));
    setProcessingId(null);
    toast.success('확인 처리되었습니다.');
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <CheckCircle className="h-12 w-12 mb-4" />
        <p>비활성 제품 사용 기록이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">사용 유형</TableHead>
              <TableHead>제품명</TableHead>
              <TableHead>비활성화 사유</TableHead>
              <TableHead>사용 조직</TableHead>
              <TableHead className="text-right">수량</TableHead>
              <TableHead className="w-[160px]">일시</TableHead>
              <TableHead className="w-[100px]">상태</TableHead>
              {showAcknowledgeButton && <TableHead className="w-[100px]">작업</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {log.usageType === 'SHIPMENT' ? (
                      <Package className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Syringe className="h-4 w-4 text-green-500" />
                    )}
                    <span>{log.usageType === 'SHIPMENT' ? '출고' : '시술'}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{log.productName}</TableCell>
                <TableCell>
                  <Badge variant={getReasonBadgeVariant(log.deactivationReason)}>
                    <span className="flex items-center gap-1">
                      {getReasonIcon(log.deactivationReason)}
                      {DEACTIVATION_REASON_LABELS[log.deactivationReason]}
                    </span>
                  </Badge>
                </TableCell>
                <TableCell>{log.organizationName}</TableCell>
                <TableCell className="text-right">{log.quantity}개</TableCell>
                <TableCell>
                  {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                </TableCell>
                <TableCell>
                  {log.acknowledgedAt ? (
                    <Badge variant="outline" className="text-green-600">
                      확인됨
                    </Badge>
                  ) : (
                    <Badge variant="destructive">미확인</Badge>
                  )}
                </TableCell>
                {showAcknowledgeButton && (
                  <TableCell>
                    {!log.acknowledgedAt && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcknowledge(log.id)}
                        disabled={processingId === log.id}
                      >
                        {processingId === log.id ? '처리중...' : '확인'}
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {showPagination && (
        <Pagination
          currentPage={currentPage}
          totalPages={3}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

const meta = {
  title: 'Tables/Admin/InactiveProductUsageTable',
  component: MockInactiveProductUsageTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
} satisfies Meta<typeof MockInactiveProductUsageTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    logs: mockLogs,
  },
};

export const AllUnacknowledged: Story = {
  args: {
    logs: mockLogs.map((l) => ({ ...l, acknowledgedAt: null })),
  },
};

export const AllAcknowledged: Story = {
  args: {
    logs: mockLogs.map((l) => ({ ...l, acknowledgedAt: '2024-12-10T12:00:00Z' })),
  },
};

export const ShipmentsOnly: Story = {
  args: {
    logs: mockLogs.filter((l) => l.usageType === 'SHIPMENT'),
  },
};

export const TreatmentsOnly: Story = {
  args: {
    logs: mockLogs.filter((l) => l.usageType === 'TREATMENT'),
  },
};

export const SafetyIssuesOnly: Story = {
  args: {
    logs: mockLogs.filter((l) => l.deactivationReason === 'SAFETY_ISSUE'),
  },
};

export const Empty: Story = {
  args: {
    logs: [],
  },
};

export const NoAcknowledgeButton: Story = {
  args: {
    logs: mockLogs,
    showAcknowledgeButton: false,
  },
};
