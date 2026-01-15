'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Package,
  Factory,
  Truck,
  Stethoscope,
  User,
  Building2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/EmptyState';
import type { HistoryActionType, OrganizationType } from '@/types/api.types';
import { ORGANIZATION_TYPE_LABELS } from '@/constants/organization';

/**
 * AdminEventSummaryTable은 Server Actions에 의존합니다.
 * Storybook에서는 Mock 컴포넌트로 UI를 시뮬레이션합니다.
 */

const ACTION_TYPE_LABELS: Record<HistoryActionType, string> = {
  PRODUCED: '생산',
  SHIPPED: '출고',
  RECEIVED: '입고',
  TREATED: '시술',
  RECALLED: '회수',
  RETURN_SENT: '반품 출고',
  RETURN_RECEIVED: '반품 입고',
  DISPOSED: '폐기',
  RETURNED: '반품',
};

interface MockLotSummary {
  lotNumber: string;
  quantity: number;
  codeIds: string[];
}

interface MockOrganization {
  id: string;
  name: string;
  type: OrganizationType;
}

interface MockTarget {
  id: string;
  name: string;
  type: OrganizationType | 'PATIENT';
}

interface MockEventSummary {
  id: string;
  actionType: HistoryActionType;
  totalQuantity: number;
  eventDate: string;
  fromOrganization: MockOrganization;
  toTarget: MockTarget | null;
  lots: MockLotSummary[];
  isRecall: boolean;
}

const mockEvents: MockEventSummary[] = [
  {
    id: 'event-001',
    actionType: 'SHIPPED',
    totalQuantity: 100,
    eventDate: '2024-12-10T09:30:00Z',
    fromOrganization: { id: 'org-001', name: '(주)네오디쎄', type: 'MANUFACTURER' },
    toTarget: { id: 'org-002', name: '메디플러스 유통', type: 'DISTRIBUTOR' },
    lots: [
      { lotNumber: 'ND24120901', quantity: 60, codeIds: ['code-1', 'code-2'] },
      { lotNumber: 'ND24120902', quantity: 40, codeIds: ['code-3'] },
    ],
    isRecall: false,
  },
  {
    id: 'event-002',
    actionType: 'RECEIVED',
    totalQuantity: 100,
    eventDate: '2024-12-10T10:00:00Z',
    fromOrganization: { id: 'org-001', name: '(주)네오디쎄', type: 'MANUFACTURER' },
    toTarget: { id: 'org-002', name: '메디플러스 유통', type: 'DISTRIBUTOR' },
    lots: [
      { lotNumber: 'ND24120901', quantity: 60, codeIds: ['code-1', 'code-2'] },
      { lotNumber: 'ND24120902', quantity: 40, codeIds: ['code-3'] },
    ],
    isRecall: false,
  },
  {
    id: 'event-003',
    actionType: 'TREATED',
    totalQuantity: 5,
    eventDate: '2024-12-09T14:20:00Z',
    fromOrganization: { id: 'org-003', name: '강남뷰티클리닉', type: 'HOSPITAL' },
    toTarget: { id: 'patient-001', name: '김**', type: 'PATIENT' },
    lots: [{ lotNumber: 'ND24120901', quantity: 5, codeIds: ['code-4', 'code-5'] }],
    isRecall: false,
  },
  {
    id: 'event-004',
    actionType: 'RECALLED',
    totalQuantity: 20,
    eventDate: '2024-12-09T16:00:00Z',
    fromOrganization: { id: 'org-002', name: '메디플러스 유통', type: 'DISTRIBUTOR' },
    toTarget: { id: 'org-003', name: '강남뷰티클리닉', type: 'HOSPITAL' },
    lots: [{ lotNumber: 'ND24120901', quantity: 20, codeIds: ['code-6', 'code-7', 'code-8'] }],
    isRecall: true,
  },
  {
    id: 'event-005',
    actionType: 'DISPOSED',
    totalQuantity: 10,
    eventDate: '2024-12-08T11:15:00Z',
    fromOrganization: { id: 'org-003', name: '강남뷰티클리닉', type: 'HOSPITAL' },
    toTarget: null,
    lots: [{ lotNumber: 'ND24120902', quantity: 10, codeIds: ['code-9', 'code-10'] }],
    isRecall: false,
  },
];

function getOwnerIcon(type: OrganizationType | 'PATIENT'): React.ReactNode {
  switch (type) {
    case 'MANUFACTURER':
      return <Factory className="h-3.5 w-3.5" />;
    case 'DISTRIBUTOR':
      return <Truck className="h-3.5 w-3.5" />;
    case 'HOSPITAL':
      return <Stethoscope className="h-3.5 w-3.5" />;
    case 'PATIENT':
      return <User className="h-3.5 w-3.5" />;
    default:
      return <Building2 className="h-3.5 w-3.5" />;
  }
}

function getActionBadgeVariant(actionType: HistoryActionType): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (actionType) {
    case 'RECALLED':
      return 'destructive';
    case 'DISPOSED':
      return 'secondary';
    case 'TREATED':
      return 'default';
    default:
      return 'outline';
  }
}

interface MockEventRowProps {
  event: MockEventSummary;
  isExpanded: boolean;
  onToggle: () => void;
}

function MockEventRow({ event, isExpanded, onToggle }: MockEventRowProps) {
  return (
    <>
      <TableRow className={event.isRecall ? 'bg-red-50' : ''}>
        <TableCell className="text-sm text-muted-foreground">
          {format(new Date(event.eventDate), 'MM.dd HH:mm', { locale: ko })}
        </TableCell>
        <TableCell>
          <Badge variant={getActionBadgeVariant(event.actionType)}>
            {ACTION_TYPE_LABELS[event.actionType]}
          </Badge>
        </TableCell>
        <TableCell className="font-medium">{event.totalQuantity}개</TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5">
            {getOwnerIcon(event.fromOrganization.type)}
            <span className="text-sm truncate max-w-[120px]">{event.fromOrganization.name}</span>
          </div>
        </TableCell>
        <TableCell>
          {event.toTarget ? (
            <div className="flex items-center gap-1.5">
              {getOwnerIcon(event.toTarget.type)}
              <span className="text-sm truncate max-w-[120px]">{event.toTarget.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-7 gap-1 text-xs"
          >
            {event.lots.length}개 Lot
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={6} className="bg-gray-50/50 p-3">
            <div className="space-y-2">
              {event.lots.map((lot, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                  <code className="font-mono text-xs">{lot.lotNumber}</code>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{lot.quantity}개</Badge>
                    <Badge variant="secondary" className="text-xs">
                      코드 {lot.codeIds.length}개
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function MockEventCard({ event, isExpanded, onToggle }: MockEventRowProps) {
  return (
    <Card className={event.isRecall ? 'border-red-200 bg-red-50/50' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={getActionBadgeVariant(event.actionType)}>
              {ACTION_TYPE_LABELS[event.actionType]}
            </Badge>
            <Badge variant="outline">{event.totalQuantity}개</Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            {format(new Date(event.eventDate), 'MM.dd HH:mm', { locale: ko })}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1">
            {getOwnerIcon(event.fromOrganization.type)}
            <span>{event.fromOrganization.name}</span>
          </div>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          {event.toTarget ? (
            <div className="flex items-center gap-1">
              {getOwnerIcon(event.toTarget.type)}
              <span>{event.toTarget.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full justify-between"
        >
          <span>{event.lots.length}개 Lot 상세</span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {isExpanded && (
          <div className="space-y-2 pt-2 border-t">
            {event.lots.map((lot, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                <code className="font-mono text-xs">{lot.lotNumber}</code>
                <Badge variant="outline">{lot.quantity}개</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MockAdminEventSummaryTable({ events }: { events: MockEventSummary[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (events.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="이벤트가 없습니다"
        description="조회 조건에 맞는 이벤트가 없습니다."
      />
    );
  }

  return (
    <>
      {/* 데스크톱: 테이블 뷰 */}
      <div className="hidden md:block rounded-md border overflow-x-auto">
        <Table className="min-w-[700px] table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">일시</TableHead>
              <TableHead className="w-[120px]">이벤트</TableHead>
              <TableHead className="w-[80px]">수량</TableHead>
              <TableHead className="w-[18%]">출발</TableHead>
              <TableHead className="w-[18%]">도착</TableHead>
              <TableHead className="w-auto">Lot 번호</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <MockEventRow
                key={event.id}
                event={event}
                isExpanded={expandedId === event.id}
                onToggle={() => setExpandedId(expandedId === event.id ? null : event.id)}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 모바일: 카드 뷰 */}
      <div className="block md:hidden space-y-3">
        {events.map((event) => (
          <MockEventCard
            key={event.id}
            event={event}
            isExpanded={expandedId === event.id}
            onToggle={() => setExpandedId(expandedId === event.id ? null : event.id)}
          />
        ))}
      </div>
    </>
  );
}

const meta = {
  title: 'Tables/Admin/AdminEventSummaryTable',
  component: MockAdminEventSummaryTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MockAdminEventSummaryTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    events: mockEvents,
  },
};

export const WithRecalls: Story = {
  args: {
    events: mockEvents.filter((e) => e.isRecall || e.actionType === 'RECALLED'),
  },
};

export const ShipmentsOnly: Story = {
  args: {
    events: mockEvents.filter((e) => e.actionType === 'SHIPPED' || e.actionType === 'RECEIVED'),
  },
};

export const Empty: Story = {
  args: {
    events: [],
  },
};
