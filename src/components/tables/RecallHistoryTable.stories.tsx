'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  RotateCcw,
  Package,
  Truck,
  Stethoscope,
  ArrowRight,
  User,
  Factory,
  Building2,
  ChevronDown,
  ChevronUp,
  Eye,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import type { OrganizationType } from '@/types/api.types';
import { ORGANIZATION_TYPE_LABELS } from '@/constants/organization';

/**
 * RecallHistoryTable은 Server Actions에 의존합니다.
 * Storybook에서는 Mock 컴포넌트로 UI를 시뮬레이션합니다.
 */

interface MockRecallItem {
  productName: string;
  quantity: number;
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

interface MockRecallHistoryItem {
  id: string;
  type: 'shipment' | 'treatment';
  quantity: number;
  recallDate: string;
  recallReason: string;
  fromOrganization: MockOrganization;
  toTarget: MockTarget | null;
  items: MockRecallItem[];
  codeIds: string[];
}

const mockRecalls: MockRecallHistoryItem[] = [
  {
    id: 'recall-001',
    type: 'shipment',
    quantity: 50,
    recallDate: '2024-12-10T09:30:00Z',
    recallReason: '오배송으로 인한 회수',
    fromOrganization: {
      id: 'org-001',
      name: '(주)네오디쎄',
      type: 'MANUFACTURER',
    },
    toTarget: {
      id: 'org-002',
      name: '메디플러스 유통',
      type: 'DISTRIBUTOR',
    },
    items: [
      { productName: 'PDO Thread Type A', quantity: 30 },
      { productName: 'PDO Thread Type B', quantity: 20 },
    ],
    codeIds: ['code-001', 'code-002', 'code-003'],
  },
  {
    id: 'recall-002',
    type: 'treatment',
    quantity: 5,
    recallDate: '2024-12-09T14:20:00Z',
    recallReason: '환자 정보 오입력',
    fromOrganization: {
      id: 'org-003',
      name: '강남뷰티클리닉',
      type: 'HOSPITAL',
    },
    toTarget: {
      id: 'patient-001',
      name: '김**',
      type: 'PATIENT',
    },
    items: [{ productName: 'PDO Thread Premium', quantity: 5 }],
    codeIds: ['code-004', 'code-005'],
  },
  {
    id: 'recall-003',
    type: 'shipment',
    quantity: 100,
    recallDate: '2024-12-08T11:15:00Z',
    recallReason: '제품 불량 발견으로 전량 회수',
    fromOrganization: {
      id: 'org-002',
      name: '메디플러스 유통',
      type: 'DISTRIBUTOR',
    },
    toTarget: {
      id: 'org-003',
      name: '강남뷰티클리닉',
      type: 'HOSPITAL',
    },
    items: [
      { productName: 'PDO Thread Type A', quantity: 60 },
      { productName: 'PDO Thread Type B', quantity: 40 },
    ],
    codeIds: ['code-006', 'code-007', 'code-008', 'code-009', 'code-010'],
  },
];

function getOwnerIcon(type: OrganizationType | 'PATIENT'): React.ReactNode {
  switch (type) {
    case 'MANUFACTURER':
      return <Factory className="h-4 w-4" />;
    case 'DISTRIBUTOR':
      return <Truck className="h-4 w-4" />;
    case 'HOSPITAL':
      return <Stethoscope className="h-4 w-4" />;
    case 'PATIENT':
      return <User className="h-4 w-4" />;
    default:
      return <Building2 className="h-4 w-4" />;
  }
}

function getRecallTypeLabel(type: 'shipment' | 'treatment'): string {
  return type === 'shipment' ? '출고 회수' : '시술 회수';
}

interface MockRecallCardProps {
  recall: MockRecallHistoryItem;
  isExpanded: boolean;
  onToggle: () => void;
}

function MockRecallCard({ recall, isExpanded, onToggle }: MockRecallCardProps): React.ReactElement {
  const hasCodeIds = recall.codeIds && recall.codeIds.length > 0;

  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100 text-red-600">
              <RotateCcw className="h-4 w-4" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">{getRecallTypeLabel(recall.type)}</Badge>
                <Badge variant="outline" className="text-xs">
                  {recall.quantity}개
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(recall.recallDate), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
              </p>
            </div>
          </div>

          {hasCodeIds && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggle}
              className="gap-1.5 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">코드 상세</span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* 회수 경로 */}
        <div className="flex items-center gap-2 p-2 bg-white rounded-lg border text-sm flex-wrap">
          <div className="flex items-center gap-2">
            {getOwnerIcon(recall.fromOrganization.type)}
            <span className="font-medium">{recall.fromOrganization.name}</span>
            <Badge variant="outline" className="text-xs">
              {ORGANIZATION_TYPE_LABELS[recall.fromOrganization.type]}
            </Badge>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          {recall.toTarget ? (
            <div className="flex items-center gap-2">
              {getOwnerIcon(recall.toTarget.type)}
              <span className="font-medium">{recall.toTarget.name}</span>
              {recall.toTarget.type !== 'PATIENT' && (
                <Badge variant="outline" className="text-xs">
                  {ORGANIZATION_TYPE_LABELS[recall.toTarget.type as OrganizationType]}
                </Badge>
              )}
              {recall.toTarget.type === 'PATIENT' && (
                <Badge variant="secondary" className="text-xs">
                  환자
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>

        {/* 회수 사유 */}
        <div className="p-2 bg-red-100 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>회수 사유:</strong> {recall.recallReason || '사유 없음'}
          </p>
        </div>

        {/* 제품 목록 */}
        <div className="grid gap-2">
          {recall.items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 bg-white rounded-lg border"
            >
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{item.productName}</span>
              </div>
              <Badge variant="secondary">{item.quantity}개</Badge>
            </div>
          ))}
        </div>

        {/* 코드 상세 (확장 시) */}
        {isExpanded && hasCodeIds && (
          <div className="border-t pt-3 mt-3">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              고유식별코드 ({recall.codeIds.length}개)
            </div>
            <div className="grid gap-1">
              {recall.codeIds.map((code, idx) => (
                <div key={idx} className="p-2 bg-white rounded border text-xs font-mono">
                  NC-{code.toUpperCase().padStart(8, '0')}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MockRecallHistoryTable({ recalls }: { recalls: MockRecallHistoryItem[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (recalls.length === 0) {
    return (
      <EmptyState
        icon={RotateCcw}
        title="회수 이력이 없습니다"
        description="조회 조건에 맞는 회수 이력이 없습니다."
      />
    );
  }

  return (
    <div className="space-y-4">
      {recalls.map((recall) => (
        <MockRecallCard
          key={recall.id}
          recall={recall}
          isExpanded={expandedId === recall.id}
          onToggle={() => setExpandedId(expandedId === recall.id ? null : recall.id)}
        />
      ))}
    </div>
  );
}

const meta = {
  title: 'Tables/Admin/RecallHistoryTable',
  component: MockRecallHistoryTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MockRecallHistoryTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    recalls: mockRecalls,
  },
};

export const ShipmentRecallsOnly: Story = {
  args: {
    recalls: mockRecalls.filter((r) => r.type === 'shipment'),
  },
};

export const TreatmentRecallsOnly: Story = {
  args: {
    recalls: mockRecalls.filter((r) => r.type === 'treatment'),
  },
};

export const Empty: Story = {
  args: {
    recalls: [],
  },
};
