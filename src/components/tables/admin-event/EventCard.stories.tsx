'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Package,
  Factory,
  Truck,
  Stethoscope,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, formatNumber } from '@/lib/utils';

/**
 * EventCard는 모바일 환경에서 이벤트를 카드 형태로 표시하는 컴포넌트입니다.
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

interface MockEventCardProps {
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

function MockEventCard({ event = defaultEvent }: MockEventCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden',
        event.isRecall && 'border-red-200 bg-red-50/50'
      )}
    >
      {/* 카드 헤더 */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* 첫 번째 줄 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {format(new Date(event.eventTime), 'MM.dd HH:mm', { locale: ko })}
            </span>
            <Badge
              variant={getActionTypeBadgeVariant(event.actionType)}
              className="text-xs"
            >
              {event.actionTypeLabel}
            </Badge>
            {event.isRecall && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {formatNumber(event.totalQuantity)}개
          </Badge>
        </div>

        {/* 두 번째 줄: 출발 → 도착 */}
        <div className="flex items-center gap-2 text-sm">
          {event.fromOwner ? (
            <div className="flex items-center gap-1 min-w-0">
              {getOwnerIcon(event.fromOwner.type)}
              <span className="truncate">{event.fromOwner.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
          <ChevronRight className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
          {event.toOwner ? (
            <div className="flex items-center gap-1 min-w-0">
              {getOwnerIcon(event.toOwner.type)}
              <span className="truncate">{event.toOwner.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>

        {/* 세 번째 줄: Lot 요약 */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Package className="h-3 w-3" />
            <span>Lot {event.lotSummaries.length}개</span>
          </div>
          <Button variant="ghost" size="sm" className="h-6 px-2">
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="text-xs ml-1">상세</span>
          </Button>
        </div>
      </div>

      {/* 확장 영역 */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-3 border-t bg-gray-50/50">
          <div className="text-xs font-medium text-muted-foreground pt-3">
            Lot별 상세
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
      )}
    </div>
  );
}

const meta = {
  title: 'Tables/AdminEvent/EventCard',
  component: MockEventCard,
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
} satisfies Meta<typeof MockEventCard>;

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

export const Disposed: Story = {
  args: {
    event: {
      eventTime: new Date().toISOString(),
      actionType: 'DISPOSED',
      actionTypeLabel: '폐기',
      totalQuantity: 10,
      isRecall: false,
      fromOwner: { name: '강남뷰티클리닉', type: 'HOSPITAL' },
      toOwner: undefined,
      lotSummaries: [
        { lotId: 'lot-1', lotNumber: 'LOT-2024-001', productName: 'PDO Thread Type A', modelName: 'PDO-A-100', quantity: 10 },
      ],
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
