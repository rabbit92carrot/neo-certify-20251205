'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Factory,
  Truck,
  Stethoscope,
  User,
  Package,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn, formatNumber } from '@/lib/utils';

/**
 * EventRow는 데스크톱 테이블에서 이벤트를 행 형태로 표시하는 컴포넌트입니다.
 * 클릭하여 Lot별 상세 정보를 확장할 수 있습니다.
 */

type ActionType = 'PRODUCED' | 'SHIPPED' | 'RECEIVED' | 'TREATED' | 'RECALLED' | 'DISPOSED';
type OwnerType = 'MANUFACTURER' | 'DISTRIBUTOR' | 'HOSPITAL' | 'PATIENT';

interface MockOwner {
  name: string;
  type: OwnerType;
}

interface MockLotSummary {
  lotId: string;
  lotNumber: string;
  productName: string;
  modelName?: string;
  quantity: number;
}

interface MockEvent {
  eventTime: string;
  actionType: ActionType;
  actionTypeLabel: string;
  totalQuantity: number;
  isRecall: boolean;
  recallReason?: string;
  fromOwner?: MockOwner;
  toOwner?: MockOwner;
  lotSummaries: MockLotSummary[];
}

interface MockEventRowProps {
  event?: MockEvent;
}

function getActionTypeBadgeVariant(
  actionType: ActionType
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (actionType) {
    case 'PRODUCED':
      return 'default';
    case 'SHIPPED':
    case 'RECEIVED':
      return 'secondary';
    case 'TREATED':
      return 'outline';
    case 'RECALLED':
    case 'DISPOSED':
      return 'destructive';
    default:
      return 'outline';
  }
}

function getActionTypeIcon(actionType: ActionType) {
  switch (actionType) {
    case 'PRODUCED':
      return <Factory className="h-4 w-4" />;
    case 'SHIPPED':
    case 'RECEIVED':
      return <Truck className="h-4 w-4" />;
    case 'TREATED':
      return <Stethoscope className="h-4 w-4" />;
    case 'RECALLED':
      return <AlertTriangle className="h-4 w-4" />;
    case 'DISPOSED':
      return <Package className="h-4 w-4" />;
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
    case 'PATIENT':
      return <User className="h-3 w-3" />;
  }
}

const defaultEvent: MockEvent = {
  eventTime: new Date().toISOString(),
  actionType: 'SHIPPED',
  actionTypeLabel: '출고',
  totalQuantity: 100,
  isRecall: false,
  fromOwner: { name: '메디케어 제조', type: 'MANUFACTURER' },
  toOwner: { name: '헬스케어 유통', type: 'DISTRIBUTOR' },
  lotSummaries: [
    { lotId: 'lot-1', lotNumber: 'LOT-2024-001', productName: 'PDO Thread Type A', modelName: 'PDO-A-100', quantity: 50 },
    { lotId: 'lot-2', lotNumber: 'LOT-2024-002', productName: 'PDO Thread Type B', modelName: 'PDO-B-200', quantity: 50 },
  ],
};

function MockEventRow({ event = defaultEvent }: MockEventRowProps) {
  const [isOpen, setIsOpen] = useState(false);

  const lotNumbers = event.lotSummaries.map((l) => l.lotNumber);
  const displayLots = lotNumbers.slice(0, 3);
  const remainingLots = lotNumbers.length - 3;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">일시</TableHead>
          <TableHead className="w-[120px]">이벤트</TableHead>
          <TableHead className="w-[80px]">수량</TableHead>
          <TableHead className="w-[150px]">출발</TableHead>
          <TableHead className="w-[150px]">도착</TableHead>
          <TableHead>Lot 번호</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow className={cn(event.isRecall && 'bg-red-50')}>
          {/* 일시 */}
          <TableCell className="whitespace-nowrap">
            {format(new Date(event.eventTime), 'MM.dd HH:mm', { locale: ko })}
          </TableCell>

          {/* 이벤트 타입 */}
          <TableCell>
            <div className="flex items-center gap-2">
              {getActionTypeIcon(event.actionType)}
              <Badge variant={getActionTypeBadgeVariant(event.actionType)}>
                {event.actionTypeLabel}
              </Badge>
              {event.isRecall && <AlertTriangle className="h-4 w-4 text-red-500" />}
            </div>
          </TableCell>

          {/* 수량 */}
          <TableCell>
            <Badge variant="outline" className="font-mono">
              {formatNumber(event.totalQuantity)}개
            </Badge>
          </TableCell>

          {/* 출발 */}
          <TableCell>
            {event.fromOwner ? (
              <div className="flex items-center gap-1">
                {getOwnerIcon(event.fromOwner.type)}
                <span className="text-sm max-w-[150px] truncate">{event.fromOwner.name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </TableCell>

          {/* 도착 */}
          <TableCell>
            {event.toOwner ? (
              <div className="flex items-center gap-1">
                {getOwnerIcon(event.toOwner.type)}
                <span className="text-sm max-w-[150px] truncate">{event.toOwner.name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </TableCell>

          {/* Lot 번호 */}
          <TableCell>
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto font-normal"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4 mr-1" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-1" />
              )}
              <div className="flex items-center gap-1">
                <code className="text-xs font-mono">{displayLots.join(', ')}</code>
                {remainingLots > 0 && (
                  <Badge variant="secondary" className="text-xs ml-1">
                    +{remainingLots}
                  </Badge>
                )}
              </div>
            </Button>
          </TableCell>
        </TableRow>

        {/* 확장 콘텐츠 */}
        {isOpen && (
          <TableRow>
            <TableCell colSpan={6} className="p-0 max-w-0">
              <div className="px-6 py-4 space-y-3 bg-gray-50/50 overflow-hidden w-full">
                <div className="text-xs font-medium text-muted-foreground">
                  Lot별 상세 ({event.lotSummaries.length}개)
                </div>
                {event.lotSummaries.map((lot) => (
                  <div key={lot.lotId} className="border rounded-lg bg-white p-3">
                    <code className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                      {lot.lotNumber}
                    </code>
                    <div className="mt-2 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">{lot.productName}</p>
                        <p className="text-xs text-muted-foreground">{lot.modelName || '-'}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {formatNumber(lot.quantity)}개
                      </Badge>
                    </div>
                  </div>
                ))}
                {event.isRecall && event.recallReason && (
                  <div className="p-3 rounded-lg bg-red-100 text-sm text-red-800">
                    <span className="font-medium">회수 사유:</span> {event.recallReason}
                  </div>
                )}
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

const meta = {
  title: 'Tables/AdminEvent/EventRow',
  component: MockEventRow,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MockEventRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    event: defaultEvent,
  },
};

export const Shipment: Story = {
  args: {
    event: {
      ...defaultEvent,
      actionType: 'SHIPPED',
      actionTypeLabel: '출고',
    },
  },
};

export const Treatment: Story = {
  args: {
    event: {
      eventTime: new Date().toISOString(),
      actionType: 'TREATED',
      actionTypeLabel: '시술',
      totalQuantity: 5,
      isRecall: false,
      fromOwner: { name: '강남뷰티클리닉', type: 'HOSPITAL' },
      toOwner: { name: '김OO', type: 'PATIENT' },
      lotSummaries: [
        { lotId: 'lot-1', lotNumber: 'LOT-2024-001', productName: 'PDO Thread Type A', modelName: 'PDO-A-100', quantity: 5 },
      ],
    },
  },
};

export const Recall: Story = {
  args: {
    event: {
      ...defaultEvent,
      actionType: 'RECALLED',
      actionTypeLabel: '회수',
      isRecall: true,
      recallReason: '수량 오류로 인한 회수',
    },
  },
};

export const ManyLots: Story = {
  args: {
    event: {
      ...defaultEvent,
      totalQuantity: 250,
      lotSummaries: [
        { lotId: 'lot-1', lotNumber: 'LOT-2024-001', productName: 'PDO Thread Type A', modelName: 'PDO-A-100', quantity: 50 },
        { lotId: 'lot-2', lotNumber: 'LOT-2024-002', productName: 'PDO Thread Type B', modelName: 'PDO-B-200', quantity: 50 },
        { lotId: 'lot-3', lotNumber: 'LOT-2024-003', productName: 'PDO Thread Type C', modelName: 'PDO-C-300', quantity: 50 },
        { lotId: 'lot-4', lotNumber: 'LOT-2024-004', productName: 'PDO Thread Premium', modelName: 'PDO-P-500', quantity: 50 },
        { lotId: 'lot-5', lotNumber: 'LOT-2024-005', productName: 'PDO Thread Extra', modelName: 'PDO-E-100', quantity: 50 },
      ],
    },
  },
};

export const Production: Story = {
  args: {
    event: {
      eventTime: new Date().toISOString(),
      actionType: 'PRODUCED',
      actionTypeLabel: '생산',
      totalQuantity: 1000,
      isRecall: false,
      fromOwner: undefined,
      toOwner: { name: '메디케어 제조', type: 'MANUFACTURER' },
      lotSummaries: [
        { lotId: 'lot-1', lotNumber: 'LOT-2024-NEW', productName: 'PDO Thread Type A', modelName: 'PDO-A-100', quantity: 1000 },
      ],
    },
  },
};
