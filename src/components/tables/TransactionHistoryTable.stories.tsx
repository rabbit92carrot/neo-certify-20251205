'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Package,
  ArrowRight,
  AlertTriangle,
  Factory,
  Truck,
  Building2,
  Stethoscope,
  RotateCcw,
  User,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * TransactionHistoryTable - 모든 역할에서 공유하는 거래 이력 테이블
 */

type HistoryActionType = 'PRODUCED' | 'SHIPPED' | 'RECEIVED' | 'TREATED' | 'RECALLED' | 'RETURN_SENT' | 'RETURN_RECEIVED' | 'DISPOSED';

interface MockTransactionHistory {
  id: string;
  actionType: HistoryActionType;
  actionTypeLabel: string;
  createdAt: string;
  totalQuantity: number;
  isRecall: boolean;
  recallReason?: string;
  fromOwner?: { id: string; name: string; type: string };
  toOwner?: { id: string; name: string; type: string };
  items: {
    productId: string;
    productName: string;
    modelName?: string;
    quantity: number;
    codes: string[];
  }[];
}

const mockHistories: MockTransactionHistory[] = [
  {
    id: 'tx-001',
    actionType: 'RECEIVED',
    actionTypeLabel: '입고',
    createdAt: '2024-12-15T10:00:00Z',
    totalQuantity: 50,
    isRecall: false,
    fromOwner: { id: 'org-001', name: '네오메디컬', type: 'MANUFACTURER' },
    toOwner: { id: 'org-002', name: '메디컬유통', type: 'DISTRIBUTOR' },
    items: [
      { productId: 'prod-001', productName: 'PDO Thread Type A', modelName: 'PDO-A-100', quantity: 30, codes: ['NC-A1B2C3D4', 'NC-E5F6G7H8', 'NC-I9J0K1L2'] },
      { productId: 'prod-002', productName: 'PDO Thread Type B', modelName: 'PDO-B-200', quantity: 20, codes: ['NC-M3N4O5P6', 'NC-Q7R8S9T0'] },
    ],
  },
  {
    id: 'tx-002',
    actionType: 'SHIPPED',
    actionTypeLabel: '출고',
    createdAt: '2024-12-14T14:00:00Z',
    totalQuantity: 30,
    isRecall: false,
    fromOwner: { id: 'org-002', name: '메디컬유통', type: 'DISTRIBUTOR' },
    toOwner: { id: 'org-003', name: '강남피부과의원', type: 'HOSPITAL' },
    items: [
      { productId: 'prod-001', productName: 'PDO Thread Type A', modelName: 'PDO-A-100', quantity: 30, codes: [] },
    ],
  },
  {
    id: 'tx-003',
    actionType: 'TREATED',
    actionTypeLabel: '시술',
    createdAt: '2024-12-13T16:00:00Z',
    totalQuantity: 5,
    isRecall: false,
    fromOwner: { id: 'org-003', name: '강남피부과의원', type: 'HOSPITAL' },
    toOwner: { id: 'patient-001', name: '010-****-5678', type: 'PATIENT' },
    items: [
      { productId: 'prod-003', productName: 'PDO Thread Premium', modelName: 'PDO-P-500', quantity: 5, codes: ['NC-U1V2W3X4'] },
    ],
  },
  {
    id: 'tx-004',
    actionType: 'RETURN_RECEIVED',
    actionTypeLabel: '반품 입고',
    createdAt: '2024-12-12T11:00:00Z',
    totalQuantity: 10,
    isRecall: true,
    recallReason: '주문 오류',
    fromOwner: { id: 'org-003', name: '강남피부과의원', type: 'HOSPITAL' },
    toOwner: { id: 'org-002', name: '메디컬유통', type: 'DISTRIBUTOR' },
    items: [
      { productId: 'prod-001', productName: 'PDO Thread Type A', modelName: 'PDO-A-100', quantity: 10, codes: [] },
    ],
  },
];

function getActionIcon(actionType: HistoryActionType): React.ReactNode {
  switch (actionType) {
    case 'PRODUCED':
      return <Factory className="h-4 w-4" />;
    case 'SHIPPED':
      return <Truck className="h-4 w-4" />;
    case 'RECEIVED':
      return <Building2 className="h-4 w-4" />;
    case 'TREATED':
      return <Stethoscope className="h-4 w-4" />;
    case 'RECALLED':
    case 'RETURN_SENT':
    case 'RETURN_RECEIVED':
      return <RotateCcw className="h-4 w-4" />;
    case 'DISPOSED':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
}

function getActionBadgeVariant(
  actionType: HistoryActionType,
  isRecall: boolean
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (isRecall) return 'destructive';

  switch (actionType) {
    case 'PRODUCED':
      return 'default';
    case 'SHIPPED':
      return 'secondary';
    case 'RECEIVED':
      return 'outline';
    case 'TREATED':
      return 'default';
    case 'RECALLED':
    case 'RETURN_SENT':
    case 'RETURN_RECEIVED':
      return 'destructive';
    case 'DISPOSED':
      return 'destructive';
    default:
      return 'outline';
  }
}

function ProductItemRow({ item }: { item: MockTransactionHistory['items'][0] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasCodes = item.codes && item.codes.length > 0;

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      <button
        onClick={() => hasCodes && setIsExpanded(!isExpanded)}
        disabled={!hasCodes}
        className={cn(
          'w-full flex items-center justify-between p-3',
          'transition-colors',
          hasCodes && 'hover:bg-gray-50 cursor-pointer',
          !hasCodes && 'cursor-default',
          isExpanded && 'bg-gray-50'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {hasCodes && (
            <span className="text-gray-400">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </span>
          )}
          <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <div className="min-w-0 text-left">
            <span className="text-sm font-medium">{item.productName}</span>
            {item.modelName && (
              <div className="text-xs text-muted-foreground truncate">
                {item.modelName}
              </div>
            )}
          </div>
        </div>
        <Badge variant="secondary" className="flex-shrink-0">
          {item.quantity}개
        </Badge>
      </button>

      {isExpanded && hasCodes && (
        <div className="border-t px-3 py-2 bg-gray-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {item.codes.map((code) => (
              <button
                key={code}
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  toast.success('코드가 복사되었습니다.');
                }}
                className="p-2 text-xs font-mono bg-white border rounded hover:bg-gray-100 truncate"
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TransactionHistoryCard({
  history,
  currentOrgId,
}: {
  history: MockTransactionHistory;
  currentOrgId: string;
}) {
  const isOutgoing = history.fromOwner?.id === currentOrgId;

  return (
    <Card className={cn(history.isRecall && 'border-red-200 bg-red-50')}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'p-2 rounded-full',
                history.isRecall
                  ? 'bg-red-100 text-red-600'
                  : history.actionType === 'PRODUCED'
                  ? 'bg-blue-100 text-blue-600'
                  : history.actionType === 'SHIPPED'
                  ? 'bg-green-100 text-green-600'
                  : history.actionType === 'RECEIVED'
                  ? 'bg-purple-100 text-purple-600'
                  : history.actionType === 'TREATED'
                  ? 'bg-orange-100 text-orange-600'
                  : 'bg-gray-100 text-gray-600'
              )}
            >
              {getActionIcon(history.actionType)}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Badge variant={getActionBadgeVariant(history.actionType, history.isRecall)}>
                  {history.actionTypeLabel}
                </Badge>
                {history.isRecall && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {(history.actionType === 'RETURN_SENT' || history.actionType === 'RETURN_RECEIVED') ? '반품' : '회수'}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(history.createdAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="font-semibold text-lg">{history.totalQuantity}개</p>
            <p className="text-xs text-muted-foreground">{history.items.length}종</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {(history.fromOwner || history.toOwner) && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg text-sm flex-wrap">
            {history.fromOwner && (
              <div className="flex items-center gap-1">
                {history.fromOwner.type === 'PATIENT' ? (
                  <User className="h-3 w-3 text-gray-400" />
                ) : (
                  <Building2 className="h-3 w-3 text-gray-400" />
                )}
                <span
                  className={cn(
                    history.fromOwner.id === currentOrgId
                      ? 'font-medium text-blue-600'
                      : 'text-gray-600'
                  )}
                >
                  {history.fromOwner.id === currentOrgId ? '내 조직' : history.fromOwner.name}
                </span>
              </div>
            )}
            {history.fromOwner && history.toOwner && (
              <ArrowRight className="h-4 w-4 text-gray-400" />
            )}
            {history.toOwner && (
              <div className="flex items-center gap-1">
                {history.toOwner.type === 'PATIENT' ? (
                  <User className="h-3 w-3 text-gray-400" />
                ) : (
                  <Building2 className="h-3 w-3 text-gray-400" />
                )}
                <span
                  className={cn(
                    history.toOwner.id === currentOrgId
                      ? 'font-medium text-blue-600'
                      : 'text-gray-600'
                  )}
                >
                  {history.toOwner.id === currentOrgId ? '내 조직' : history.toOwner.name}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          {history.items.map((item) => (
            <ProductItemRow key={item.productId} item={item} />
          ))}
        </div>

        {history.isRecall && history.recallReason && (
          <div className="mt-3 p-2 bg-red-100 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>{(history.actionType === 'RETURN_SENT' || history.actionType === 'RETURN_RECEIVED') ? '반품' : '회수'} 사유:</strong> {history.recallReason}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MockTransactionHistoryTable({
  histories = mockHistories,
  currentOrgId = 'org-002',
}: {
  histories?: MockTransactionHistory[];
  currentOrgId?: string;
}) {
  if (histories.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="거래 이력이 없습니다"
        description="아직 거래 이력이 없습니다."
      />
    );
  }

  return (
    <div className="space-y-4">
      {histories.map((history) => (
        <TransactionHistoryCard
          key={history.id}
          history={history}
          currentOrgId={currentOrgId}
        />
      ))}
    </div>
  );
}

const meta = {
  title: 'Tables/Shared/TransactionHistoryTable',
  component: MockTransactionHistoryTable,
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
} satisfies Meta<typeof MockTransactionHistoryTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    histories: [],
  },
};

export const WithReturns: Story = {
  args: {
    histories: mockHistories.filter((h) => h.isRecall),
  },
};
