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
  Stethoscope,
  User,
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
import { EmptyState } from '@/components/shared/EmptyState';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

/**
 * TreatmentHistoryTable은 시술 이력을 카드 형태로 표시합니다.
 */

interface MockTreatmentRecord {
  id: string;
  treatment_date: string;
  patient_phone: string;
  totalQuantity: number;
  isRecallable: boolean;
  created_at: string;
  itemSummary: {
    productId: string;
    productName: string;
    modelName?: string;
    alias?: string;
    quantity: number;
  }[];
}

const mockTreatments: MockTreatmentRecord[] = [
  {
    id: 'treat-001',
    treatment_date: '2024-12-15',
    patient_phone: '01012345678',
    totalQuantity: 5,
    isRecallable: true,
    created_at: '2024-12-15T14:30:00Z',
    itemSummary: [
      { productId: 'prod-001', productName: 'PDO Thread Type A', modelName: 'PDO-A-100', alias: '타입A', quantity: 3 },
      { productId: 'prod-002', productName: 'PDO Thread Type B', modelName: 'PDO-B-200', quantity: 2 },
    ],
  },
  {
    id: 'treat-002',
    treatment_date: '2024-12-14',
    patient_phone: '01098765432',
    totalQuantity: 3,
    isRecallable: false,
    created_at: '2024-12-14T10:00:00Z',
    itemSummary: [
      { productId: 'prod-003', productName: 'PDO Thread Premium', modelName: 'PDO-P-500', alias: '프리미엄', quantity: 3 },
    ],
  },
  {
    id: 'treat-003',
    treatment_date: '2024-12-13',
    patient_phone: '01055556666',
    totalQuantity: 10,
    isRecallable: false,
    created_at: '2024-12-13T16:00:00Z',
    itemSummary: [
      { productId: 'prod-001', productName: 'PDO Thread Type A', modelName: 'PDO-A-100', quantity: 10 },
    ],
  },
];

function maskPhoneNumber(phone: string): string {
  if (phone.length === 11) {
    return `${phone.slice(0, 3)}-****-${phone.slice(7)}`;
  }
  if (phone.length === 10) {
    return `${phone.slice(0, 3)}-***-${phone.slice(6)}`;
  }
  return phone;
}

function TreatmentRecordCard({
  treatment,
  onRecall,
}: {
  treatment: MockTreatmentRecord;
  onRecall?: (treatmentId: string, reason: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRecallDialog, setShowRecallDialog] = useState(false);
  const [recallReason, setRecallReason] = useState('');

  const handleRecall = () => {
    if (!recallReason.trim()) {
      toast.error('회수 사유를 입력해주세요.');
      return;
    }

    onRecall?.(treatment.id, recallReason);
    toast.success('시술이 회수되었습니다.');
    setShowRecallDialog(false);
    setRecallReason('');
  };

  return (
    <>
      <Card>
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
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{maskPhoneNumber(treatment.patient_phone)}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(new Date(treatment.treatment_date), 'yyyy년 M월 d일', { locale: ko })}
                  {' · '}
                  {treatment.itemSummary.length}종 / {treatment.totalQuantity}개
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {treatment.isRecallable && onRecall && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRecallDialog(true);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  회수
                </Button>
              )}
              {!treatment.isRecallable && (
                <Badge variant="secondary" className="text-xs">
                  회수 불가
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            <div className="border-t pt-4 space-y-3">
              <div className="grid gap-2">
                {treatment.itemSummary.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="font-medium">
                          {item.alias || item.productName}
                        </span>
                        {item.modelName && (
                          <div className="text-xs text-muted-foreground truncate">
                            {item.modelName}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="flex-shrink-0">{item.quantity}개</Badge>
                  </div>
                ))}
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>환자: {maskPhoneNumber(treatment.patient_phone)}</p>
                <p>시술일: {format(new Date(treatment.treatment_date), 'yyyy년 M월 d일', { locale: ko })}</p>
                <p>등록일: {format(new Date(treatment.created_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Dialog open={showRecallDialog} onOpenChange={setShowRecallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>시술 회수</DialogTitle>
            <DialogDescription>
              이 시술을 회수하시겠습니까? 환자에게 회수 알림이 발송됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>환자:</strong> {maskPhoneNumber(treatment.patient_phone)}
              </p>
              <p className="text-sm text-yellow-800">
                <strong>시술일:</strong> {format(new Date(treatment.treatment_date), 'yyyy년 M월 d일', { locale: ko })}
              </p>
            </div>

            <div className="space-y-2">
              <Label>회수 사유 (필수)</Label>
              <Textarea
                value={recallReason}
                onChange={(e) => setRecallReason(e.target.value)}
                placeholder="회수 사유를 입력해주세요..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecallDialog(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleRecall} disabled={!recallReason.trim()}>
              회수하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MockTreatmentHistoryTable({ treatments = mockTreatments }: { treatments?: MockTreatmentRecord[] }) {
  const handleRecall = (treatmentId: string, reason: string) => {
    console.log('Recall:', treatmentId, reason);
  };

  if (treatments.length === 0) {
    return (
      <EmptyState
        icon={Stethoscope}
        title="시술 이력이 없습니다"
        description="아직 등록된 시술 내역이 없습니다."
      />
    );
  }

  return (
    <div className="space-y-4">
      {treatments.map((treatment) => (
        <TreatmentRecordCard
          key={treatment.id}
          treatment={treatment}
          onRecall={handleRecall}
        />
      ))}
    </div>
  );
}

const meta = {
  title: 'Tables/History/TreatmentHistoryTable',
  component: MockTreatmentHistoryTable,
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
} satisfies Meta<typeof MockTreatmentHistoryTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    treatments: [],
  },
};

export const AllRecallable: Story = {
  args: {
    treatments: mockTreatments.map((t) => ({ ...t, isRecallable: true })),
  },
};

export const NoneRecallable: Story = {
  args: {
    treatments: mockTreatments.map((t) => ({ ...t, isRecallable: false })),
  },
};
