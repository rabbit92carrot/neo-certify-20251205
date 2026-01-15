'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Package,
  AlertTriangle,
  Factory,
  Truck,
  Building2,
  Stethoscope,
  User,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * EventDetailModal 컴포넌트는 Server Actions에 의존합니다.
 * Storybook에서는 Mock 데이터로 UI를 시뮬레이션합니다.
 */

// Mock 이벤트 데이터
interface MockEventData {
  actionType: string;
  actionTypeLabel: string;
  eventTime: string;
  totalQuantity: number;
  isRecall: boolean;
  recallReason?: string;
  fromOwner?: { name: string; type: string };
  toOwner?: { name: string; type: string };
  lotSummaries: Array<{
    lotId: string;
    lotNumber: string;
    productName: string;
    productId: string;
    quantity: number;
  }>;
}

interface MockSampleCode {
  id: string;
  code: string;
  currentStatus: 'IN_STOCK' | 'USED' | 'DISPOSED';
  currentOwnerName: string;
  productName: string;
  lotNumber: string;
}

// Mock 컴포넌트
function MockEventDetailModal({
  event,
  sampleCodes,
  open,
  onOpenChange,
}: {
  event: MockEventData | null;
  sampleCodes: MockSampleCode[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!event) return null;

  const getActionTypeIcon = (actionType: string) => {
    switch (actionType) {
      case 'PRODUCED':
        return <Factory className="h-5 w-5" />;
      case 'SHIPPED':
      case 'RECEIVED':
        return <Truck className="h-5 w-5" />;
      case 'TREATED':
        return <Stethoscope className="h-5 w-5" />;
      case 'RECALLED':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const getOwnerIcon = (type: string) => {
    if (type === 'PATIENT') return <User className="h-4 w-4" />;
    return <Building2 className="h-4 w-4" />;
  };

  const getStatusBadgeVariant = (status: string) => {
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
  };

  const statusLabels: Record<string, string> = {
    IN_STOCK: '재고',
    USED: '사용됨',
    DISPOSED: '폐기됨',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getActionTypeIcon(event.actionType)}
            <span>{event.actionTypeLabel} 상세</span>
            {event.isRecall && (
              <Badge variant="destructive" className="ml-2">회수</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {format(new Date(event.eventTime), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
          </DialogDescription>
        </DialogHeader>

        <div className={cn('rounded-lg p-4', event.isRecall ? 'bg-red-50' : 'bg-gray-50')}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">총 수량</div>
              <div className="text-xl font-bold">{event.totalQuantity}개</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Lot 수</div>
              <div className="text-xl font-bold">{event.lotSummaries.length}개</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">제품 종류</div>
              <div className="text-xl font-bold">
                {new Set(event.lotSummaries.map((l) => l.productId)).size}종
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">출발</div>
              {event.fromOwner ? (
                <div className="flex items-center gap-2">
                  {getOwnerIcon(event.fromOwner.type)}
                  <span className="font-medium">{event.fromOwner.name}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">도착</div>
              {event.toOwner ? (
                <div className="flex items-center gap-2">
                  {getOwnerIcon(event.toOwner.type)}
                  <span className="font-medium">{event.toOwner.name}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
          </div>

          {event.isRecall && event.recallReason && (
            <>
              <Separator className="my-4" />
              <div>
                <div className="text-xs text-muted-foreground mb-1">회수 사유</div>
                <div className="text-red-700">{event.recallReason}</div>
              </div>
            </>
          )}
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Lot별 상세</h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lot 번호</TableHead>
                  <TableHead>제품명</TableHead>
                  <TableHead className="text-right">수량</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {event.lotSummaries.map((lot) => (
                  <TableRow key={lot.lotId}>
                    <TableCell>
                      <code className="text-xs font-mono">{lot.lotNumber}</code>
                    </TableCell>
                    <TableCell>{lot.productName}</TableCell>
                    <TableCell className="text-right">{lot.quantity}개</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">샘플 코드 (최대 10개)</h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>식별코드</TableHead>
                  <TableHead>현재 상태</TableHead>
                  <TableHead>현재 소유자</TableHead>
                  <TableHead>제품명</TableHead>
                  <TableHead>Lot</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell>
                      <code className="text-xs font-mono">{code.code}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(code.currentStatus) as 'default' | 'secondary' | 'destructive' | 'outline'}>
                        {statusLabels[code.currentStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{code.currentOwnerName}</TableCell>
                    <TableCell className="text-sm">{code.productName}</TableCell>
                    <TableCell>
                      <code className="text-xs">{code.lotNumber}</code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 샘플 이벤트 데이터
const sampleShipmentEvent: MockEventData = {
  actionType: 'SHIPPED',
  actionTypeLabel: '출고',
  eventTime: '2024-01-15T14:30:00.000Z',
  totalQuantity: 100,
  isRecall: false,
  fromOwner: { name: '네오메디컬', type: 'ORGANIZATION' },
  toOwner: { name: '메디컬 유통', type: 'ORGANIZATION' },
  lotSummaries: [
    { lotId: 'lot-001', lotNumber: 'LOT-2024-001', productName: 'PDO Thread Type A', productId: 'prod-001', quantity: 60 },
    { lotId: 'lot-002', lotNumber: 'LOT-2024-002', productName: 'PDO Thread Type A', productId: 'prod-001', quantity: 40 },
  ],
};

const sampleRecallEvent: MockEventData = {
  actionType: 'RECALLED',
  actionTypeLabel: '회수',
  eventTime: '2024-01-16T10:00:00.000Z',
  totalQuantity: 50,
  isRecall: true,
  recallReason: '배송 오류로 인한 회수',
  fromOwner: { name: '메디컬 유통', type: 'ORGANIZATION' },
  toOwner: { name: '네오메디컬', type: 'ORGANIZATION' },
  lotSummaries: [
    { lotId: 'lot-001', lotNumber: 'LOT-2024-001', productName: 'PDO Thread Type A', productId: 'prod-001', quantity: 50 },
  ],
};

const sampleCodes: MockSampleCode[] = Array.from({ length: 10 }, (_, i) => ({
  id: `code-${i + 1}`,
  code: `NC-${String(i + 1).padStart(8, '0')}`,
  currentStatus: ['IN_STOCK', 'USED', 'DISPOSED'][i % 3] as 'IN_STOCK' | 'USED' | 'DISPOSED',
  currentOwnerName: i % 2 === 0 ? '메디컬 유통' : '서울미래의원',
  productName: 'PDO Thread Type A',
  lotNumber: 'LOT-2024-001',
}));

const meta = {
  title: 'Shared/Modals/EventDetailModal',
  component: MockEventDetailModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MockEventDetailModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Shipment: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>출고 상세 보기</Button>
        <MockEventDetailModal
          event={sampleShipmentEvent}
          sampleCodes={sampleCodes}
          open={open}
          onOpenChange={setOpen}
        />
      </>
    );
  },
};

export const Recall: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="destructive" onClick={() => setOpen(true)}>회수 상세 보기</Button>
        <MockEventDetailModal
          event={sampleRecallEvent}
          sampleCodes={sampleCodes}
          open={open}
          onOpenChange={setOpen}
        />
      </>
    );
  },
};

export const OpenByDefault: Story = {
  render: () => (
    <MockEventDetailModal
      event={sampleShipmentEvent}
      sampleCodes={sampleCodes}
      open={true}
      onOpenChange={() => {}}
    />
  ),
};
