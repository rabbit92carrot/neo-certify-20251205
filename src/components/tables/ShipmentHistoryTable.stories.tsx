'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  ChevronDown,
  ChevronRight,
  Package,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/shared/EmptyState';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * ShipmentHistoryTable은 출고/입고 이력을 카드 형태로 표시합니다.
 */

interface MockShipmentBatch {
  id: string;
  shipment_date: string;
  totalQuantity: number;
  is_recalled: boolean;
  recall_reason?: string;
  recall_date?: string;
  fromOrganization: { name: string; type: string };
  toOrganization: { name: string; type: string };
  itemSummary: { productId: string; productName: string; quantity: number }[];
}

const mockShipments: MockShipmentBatch[] = [
  {
    id: 'ship-001',
    shipment_date: '2024-12-15T10:30:00Z',
    totalQuantity: 100,
    is_recalled: false,
    fromOrganization: { name: '네오메디컬', type: 'MANUFACTURER' },
    toOrganization: { name: '메디컬유통', type: 'DISTRIBUTOR' },
    itemSummary: [
      { productId: 'prod-001', productName: 'PDO Thread Type A', quantity: 50 },
      { productId: 'prod-002', productName: 'PDO Thread Type B', quantity: 50 },
    ],
  },
  {
    id: 'ship-002',
    shipment_date: '2024-12-14T14:00:00Z',
    totalQuantity: 30,
    is_recalled: true,
    recall_reason: '주문 오류',
    recall_date: '2024-12-14T16:00:00Z',
    fromOrganization: { name: '메디컬유통', type: 'DISTRIBUTOR' },
    toOrganization: { name: '강남피부과의원', type: 'HOSPITAL' },
    itemSummary: [
      { productId: 'prod-001', productName: 'PDO Thread Type A', quantity: 30 },
    ],
  },
  {
    id: 'ship-003',
    shipment_date: '2024-12-13T09:00:00Z',
    totalQuantity: 50,
    is_recalled: false,
    fromOrganization: { name: '네오메디컬', type: 'MANUFACTURER' },
    toOrganization: { name: '강남피부과의원', type: 'HOSPITAL' },
    itemSummary: [
      { productId: 'prod-003', productName: 'PDO Thread Premium', quantity: 50 },
    ],
  },
];

const RETURN_REASON_OPTIONS = [
  { value: 'ORDER_ERROR', label: '주문 오류' },
  { value: 'QUALITY_ISSUE', label: '품질 문제' },
  { value: 'WRONG_DELIVERY', label: '오배송' },
  { value: 'OTHER', label: '기타' },
];

function ShipmentBatchCard({
  batch,
  type,
  onReturn,
}: {
  batch: MockShipmentBatch;
  type: 'sent' | 'received';
  onReturn?: (batchId: string, reason: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnReasonType, setReturnReasonType] = useState('');
  const [returnReasonText, setReturnReasonText] = useState('');

  const canReturn = !batch.is_recalled && type === 'received' && onReturn;

  const handleReturn = () => {
    if (!returnReasonType) {
      toast.error('반품 사유를 선택해주세요.');
      return;
    }

    const finalReason = returnReasonType === 'OTHER' ? returnReasonText : returnReasonType;
    onReturn?.(batch.id, finalReason);
    toast.success('반품이 완료되었습니다.');
    setShowReturnDialog(false);
    setReturnReasonType('');
    setReturnReasonText('');
  };

  const targetOrg = type === 'sent' ? batch.toOrganization : batch.fromOrganization;

  return (
    <>
      <Card className={cn(batch.is_recalled && 'border-red-200 bg-red-50')}>
        <CardHeader
          className="cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
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
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{targetOrg.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {targetOrg.type === 'DISTRIBUTOR' ? '유통사' : targetOrg.type === 'HOSPITAL' ? '병원' : targetOrg.type}
                  </Badge>
                  {batch.is_recalled && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      반품됨
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(new Date(batch.shipment_date), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                  {' · '}
                  {batch.itemSummary.length}종 / {batch.totalQuantity}개
                </p>
              </div>
            </div>

            {canReturn && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReturnDialog(true);
                }}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                반품
              </Button>
            )}
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            <div className="border-t pt-4 space-y-3">
              <div className="grid gap-2">
                {batch.itemSummary.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{item.productName}</span>
                    </div>
                    <Badge variant="secondary">{item.quantity}개</Badge>
                  </div>
                ))}
              </div>

              {batch.is_recalled && batch.recall_reason && (
                <div className="p-3 bg-red-100 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>반품 사유:</strong> {batch.recall_reason}
                  </p>
                  {batch.recall_date && (
                    <p className="text-xs text-red-600 mt-1">
                      반품일: {format(new Date(batch.recall_date), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>반품 요청</DialogTitle>
            <DialogDescription>
              이 출고를 발송 조직에게 반품하시겠습니까?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>반품 사유 (필수)</Label>
              <Select value={returnReasonType} onValueChange={setReturnReasonType}>
                <SelectTrigger>
                  <SelectValue placeholder="반품 사유를 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  {RETURN_REASON_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {returnReasonType === 'OTHER' && (
              <div className="space-y-2">
                <Label>기타 사유 (필수)</Label>
                <Textarea
                  value={returnReasonText}
                  onChange={(e) => setReturnReasonText(e.target.value)}
                  placeholder="기타 사유를 입력해주세요..."
                  rows={3}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReturnDialog(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleReturn}>
              반품하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MockShipmentHistoryTable({
  shipments = mockShipments,
  type = 'sent',
}: {
  shipments?: MockShipmentBatch[];
  type?: 'sent' | 'received';
}) {
  const handleReturn = (batchId: string, reason: string) => {
    console.log('Return:', batchId, reason);
  };

  if (shipments.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title={type === 'sent' ? '출고 이력이 없습니다' : '입고 이력이 없습니다'}
        description={
          type === 'sent'
            ? '아직 출고한 내역이 없습니다.'
            : '아직 입고된 내역이 없습니다.'
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {shipments.map((batch) => (
        <ShipmentBatchCard
          key={batch.id}
          batch={batch}
          type={type}
          onReturn={type === 'received' ? handleReturn : undefined}
        />
      ))}
    </div>
  );
}

const meta = {
  title: 'Tables/History/ShipmentHistoryTable',
  component: MockShipmentHistoryTable,
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
} satisfies Meta<typeof MockShipmentHistoryTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SentHistory: Story = {
  args: {
    type: 'sent',
  },
};

export const ReceivedHistory: Story = {
  args: {
    type: 'received',
  },
};

export const Empty: Story = {
  args: {
    shipments: [],
    type: 'sent',
  },
};

export const WithRecalledItems: Story = {
  args: {
    shipments: mockShipments.filter((s) => s.is_recalled),
    type: 'sent',
  },
};
