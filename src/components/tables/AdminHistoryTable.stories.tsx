'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  ChevronDown,
  ChevronRight,
  Package,
  AlertTriangle,
  Factory,
  Truck,
  Stethoscope,
  Building2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
 * AdminHistoryTable - 관리자용 전체 이력 테이블
 */

type VirtualCodeStatus = 'IN_STOCK' | 'USED' | 'DISPOSED';
type HistoryActionType = 'PRODUCED' | 'SHIPPED' | 'RECEIVED' | 'TREATED' | 'RECALLED' | 'RETURN_SENT' | 'RETURN_RECEIVED' | 'DISPOSED';
type OrganizationType = 'MANUFACTURER' | 'DISTRIBUTOR' | 'HOSPITAL';

interface MockHistoryDetail {
  id: string;
  actionType: HistoryActionType;
  fromOwner: string;
  toOwner: string;
  createdAt: string;
  isRecall: boolean;
  recallReason?: string;
}

interface MockHistoryItem {
  id: string;
  virtualCode: string;
  productionDate: string;
  currentStatus: VirtualCodeStatus;
  currentOwner: { name: string; type: OrganizationType } | null;
  originalProducer: { name: string };
  productName: string;
  lotNumber: string;
  historyCount: number;
  isRecalled: boolean;
  histories: MockHistoryDetail[];
}

const VIRTUAL_CODE_STATUS_LABELS: Record<VirtualCodeStatus, string> = {
  IN_STOCK: '재고',
  USED: '사용됨',
  DISPOSED: '폐기',
};

const ACTION_TYPE_LABELS: Record<HistoryActionType, string> = {
  PRODUCED: '생산',
  SHIPPED: '출고',
  RECEIVED: '입고',
  TREATED: '시술',
  RECALLED: '회수',
  RETURN_SENT: '반품 출고',
  RETURN_RECEIVED: '반품 입고',
  DISPOSED: '폐기',
};

const mockHistories: MockHistoryItem[] = [
  {
    id: 'code-001',
    virtualCode: 'NC-A1B2C3D4',
    productionDate: '2024-12-01',
    currentStatus: 'IN_STOCK',
    currentOwner: { name: '메디컬유통', type: 'DISTRIBUTOR' },
    originalProducer: { name: '네오메디컬' },
    productName: 'PDO Thread Type A',
    lotNumber: 'ND00001241201',
    historyCount: 2,
    isRecalled: false,
    histories: [
      { id: 'h-001', actionType: 'PRODUCED', fromOwner: '네오메디컬', toOwner: '네오메디컬', createdAt: '2024-12-01T09:00:00Z', isRecall: false },
      { id: 'h-002', actionType: 'SHIPPED', fromOwner: '네오메디컬', toOwner: '메디컬유통', createdAt: '2024-12-05T10:00:00Z', isRecall: false },
    ],
  },
  {
    id: 'code-002',
    virtualCode: 'NC-E5F6G7H8',
    productionDate: '2024-12-01',
    currentStatus: 'USED',
    currentOwner: { name: '환자 (010-****-5678)', type: 'HOSPITAL' },
    originalProducer: { name: '네오메디컬' },
    productName: 'PDO Thread Premium',
    lotNumber: 'ND00003241201',
    historyCount: 4,
    isRecalled: true,
    histories: [
      { id: 'h-003', actionType: 'PRODUCED', fromOwner: '네오메디컬', toOwner: '네오메디컬', createdAt: '2024-12-01T09:00:00Z', isRecall: false },
      { id: 'h-004', actionType: 'SHIPPED', fromOwner: '네오메디컬', toOwner: '강남피부과', createdAt: '2024-12-05T10:00:00Z', isRecall: false },
      { id: 'h-005', actionType: 'TREATED', fromOwner: '강남피부과', toOwner: '환자', createdAt: '2024-12-10T14:00:00Z', isRecall: false },
      { id: 'h-006', actionType: 'RECALLED', fromOwner: '환자', toOwner: '강남피부과', createdAt: '2024-12-10T16:00:00Z', isRecall: true, recallReason: '시술 오류' },
    ],
  },
];

function getStatusBadgeVariant(status: VirtualCodeStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'IN_STOCK':
      return 'default';
    case 'USED':
      return 'secondary';
    case 'DISPOSED':
      return 'destructive';
    default:
      return 'outline';
  }
}

function getOwnerIcon(type: OrganizationType): React.ReactNode {
  switch (type) {
    case 'MANUFACTURER':
      return <Factory className="h-3 w-3 text-muted-foreground" />;
    case 'DISTRIBUTOR':
      return <Truck className="h-3 w-3 text-muted-foreground" />;
    case 'HOSPITAL':
      return <Stethoscope className="h-3 w-3 text-muted-foreground" />;
    default:
      return <Building2 className="h-3 w-3 text-muted-foreground" />;
  }
}

function HistoryDetailRow({ detail }: { detail: MockHistoryDetail }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-2 rounded text-sm',
        detail.isRecall ? 'bg-red-50 text-red-800' : 'bg-gray-50'
      )}
    >
      <div className="flex items-center gap-3">
        <Badge variant={detail.isRecall ? 'destructive' : 'outline'} className="text-xs">
          {ACTION_TYPE_LABELS[detail.actionType]}
        </Badge>
        <span className="text-muted-foreground">
          {detail.fromOwner} → {detail.toOwner}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {detail.isRecall && detail.recallReason && (
          <span className="text-xs text-red-600 max-w-[200px] truncate">
            사유: {detail.recallReason}
          </span>
        )}
        <span className="text-xs text-muted-foreground">
          {format(new Date(detail.createdAt), 'MM.dd HH:mm', { locale: ko })}
        </span>
      </div>
    </div>
  );
}

function HistoryRow({ item }: { item: MockHistoryItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <TableRow className={cn(item.isRecalled && 'bg-red-50')}>
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-auto"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4 mr-2" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-2" />
            )}
            <code className="text-xs font-mono">{item.virtualCode}</code>
          </Button>
        </TableCell>
        <TableCell className="text-muted-foreground">
          {format(new Date(item.productionDate), 'yyyy.MM.dd', { locale: ko })}
        </TableCell>
        <TableCell>
          <Badge variant={getStatusBadgeVariant(item.currentStatus)}>
            {VIRTUAL_CODE_STATUS_LABELS[item.currentStatus]}
          </Badge>
        </TableCell>
        <TableCell>
          {item.currentOwner ? (
            <div className="flex items-center gap-1">
              {getOwnerIcon(item.currentOwner.type)}
              <span className="text-sm">{item.currentOwner.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Factory className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{item.originalProducer.name}</span>
          </div>
        </TableCell>
        <TableCell>{item.productName}</TableCell>
        <TableCell>
          <code className="text-xs">{item.lotNumber}</code>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {item.historyCount}건
            </Badge>
            {item.isRecalled && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                회수
              </Badge>
            )}
          </div>
        </TableCell>
      </TableRow>
      {isOpen && (
        <TableRow>
          <TableCell colSpan={8} className="p-0">
            <div className="px-6 py-3 space-y-2 bg-gray-50/50">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                이동 이력 ({item.histories.length}건)
              </div>
              {item.histories.map((detail) => (
                <HistoryDetailRow key={detail.id} detail={detail} />
              ))}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function MockAdminHistoryTable({ histories = mockHistories }: { histories?: MockHistoryItem[] }) {
  if (histories.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="이력이 없습니다"
        description="조회 조건에 맞는 이력이 없습니다."
      />
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>식별코드</TableHead>
            <TableHead>생산일자</TableHead>
            <TableHead>현재 상태</TableHead>
            <TableHead>현재 소유자</TableHead>
            <TableHead>최초 생산자</TableHead>
            <TableHead>제품명</TableHead>
            <TableHead>Lot 번호</TableHead>
            <TableHead>이동 이력</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {histories.map((item) => (
            <HistoryRow key={item.id} item={item} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

const meta = {
  title: 'Tables/Admin/AdminHistoryTable',
  component: MockAdminHistoryTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MockAdminHistoryTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    histories: [],
  },
};

export const WithRecalledItems: Story = {
  args: {
    histories: mockHistories.filter((h) => h.isRecalled),
  },
};
