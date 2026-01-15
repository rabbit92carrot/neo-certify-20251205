'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, AlertOctagon, Package, HelpCircle } from 'lucide-react';

/**
 * ProductDeactivateDialog 컴포넌트
 */

type DeactivationReason = 'SAFETY_ISSUE' | 'QUALITY_ISSUE' | 'DISCONTINUED' | 'OTHER';

const DEACTIVATION_REASON_LABELS: Record<DeactivationReason, string> = {
  SAFETY_ISSUE: '안전 문제',
  QUALITY_ISSUE: '품질 문제',
  DISCONTINUED: '생산 중단',
  OTHER: '기타',
};

function MockProductDeactivateDialog({
  productName = 'PDO Thread Type A',
  open,
  onOpenChange,
}: {
  productName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [reason, setReason] = useState<DeactivationReason | ''>('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getReasonIcon = (reasonType: DeactivationReason) => {
    switch (reasonType) {
      case 'SAFETY_ISSUE':
        return <AlertOctagon className="h-4 w-4 text-red-500" />;
      case 'QUALITY_ISSUE':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'DISCONTINUED':
        return <Package className="h-4 w-4 text-gray-500" />;
      case 'OTHER':
        return <HelpCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getReasonDescription = (reasonType: DeactivationReason) => {
    switch (reasonType) {
      case 'SAFETY_ISSUE':
        return '안전 문제로 인한 리콜 대상 제품입니다. 해당 제품이 사용될 경우 관리자와 제조사에 알림이 전송됩니다.';
      case 'QUALITY_ISSUE':
        return '품질 문제가 발견된 제품입니다. 해당 제품이 사용될 경우 관리자와 제조사에 알림이 전송됩니다.';
      case 'DISCONTINUED':
        return '생산이 중단된 제품입니다. 신규 생산 등록이 불가능합니다.';
      case 'OTHER':
        return '기타 사유로 비활성화됩니다.';
    }
  };

  const handleSubmit = async () => {
    if (!reason) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert(`비활성화 완료 (Mock): ${productName} - ${DEACTIVATION_REASON_LABELS[reason]}`);
    setReason('');
    setNote('');
    setIsSubmitting(false);
    onOpenChange(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('');
      setNote('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>제품 비활성화</DialogTitle>
          <DialogDescription>
            <span className="font-semibold">{productName}</span> 제품을 비활성화합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">
              비활성화 사유 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={reason}
              onValueChange={(value) => setReason(value as DeactivationReason)}
            >
              <SelectTrigger id="reason">
                <SelectValue placeholder="사유를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(DEACTIVATION_REASON_LABELS) as [DeactivationReason, string][]).map(
                  ([key, label]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        {getReasonIcon(key)}
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>

            {reason && (
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                {getReasonDescription(reason)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">상세 사유 (선택)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="추가적인 비활성화 사유를 입력하세요..."
              rows={3}
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
            <strong>주의:</strong> 비활성화된 제품은 생산 등록 목록에서 표시되지 않습니다.
            기존 재고는 계속 사용 가능하며, 사용 시 관리자에게 알림이 전송됩니다.
            필요 시 다시 활성화할 수 있습니다.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting || !reason}
          >
            {isSubmitting ? '처리 중...' : '비활성화'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const meta = {
  title: 'Forms/Manufacturer/ProductDeactivateDialog',
  component: MockProductDeactivateDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MockProductDeactivateDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          제품 비활성화
        </Button>
        <MockProductDeactivateDialog open={open} onOpenChange={setOpen} />
      </>
    );
  },
};

export const OpenByDefault: Story = {
  render: () => (
    <MockProductDeactivateDialog
      productName="PDO Thread Type A"
      open={true}
      onOpenChange={() => {}}
    />
  ),
};

export const DifferentProduct: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          PDO Thread Premium 비활성화
        </Button>
        <MockProductDeactivateDialog
          productName="PDO Thread Premium"
          open={open}
          onOpenChange={setOpen}
        />
      </>
    );
  },
};
