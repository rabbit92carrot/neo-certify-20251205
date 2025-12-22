'use client';

/**
 * 시술 이력 테이블 컴포넌트
 * 시술 기록을 접기/펼치기 UI로 표시합니다.
 */

import { useState, useTransition } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  ChevronDown,
  ChevronRight,
  Package,
  RotateCcw,
  AlertTriangle,
  Stethoscope,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
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
import type { TreatmentRecordSummary } from '@/services/treatment.service';

interface TreatmentHistoryTableProps {
  /** 시술 기록 목록 */
  treatments: TreatmentRecordSummary[];
  /** 회수 액션 */
  onRecall?: (treatmentId: string, reason: string) => Promise<{ success: boolean; error?: { message: string } }>;
}

/**
 * 전화번호 마스킹 (010-****-5678)
 */
function maskPhoneNumber(phone: string): string {
  if (phone.length === 11) {
    return `${phone.slice(0, 3)}-****-${phone.slice(7)}`;
  }
  if (phone.length === 10) {
    return `${phone.slice(0, 3)}-***-${phone.slice(6)}`;
  }
  return phone;
}

/**
 * 시술 기록 카드
 */
function TreatmentRecordCard({
  treatment,
  onRecall,
}: {
  treatment: TreatmentRecordSummary;
  onRecall?: (treatmentId: string, reason: string) => Promise<{ success: boolean; error?: { message: string } }>;
}): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRecallDialog, setShowRecallDialog] = useState(false);
  const [recallReason, setRecallReason] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleRecall = () => {
    if (!recallReason.trim()) {
      toast.error('회수 사유를 입력해주세요.');
      return;
    }

    startTransition(async () => {
      const result = await onRecall!(treatment.id, recallReason);
      if (result.success) {
        toast.success('시술이 회수되었습니다.');
        setShowRecallDialog(false);
        setRecallReason('');
      } else {
        toast.error(result.error?.message || '회수에 실패했습니다.');
      }
    });
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
              {/* 제품별 요약 */}
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

              {/* 메타 정보 */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>환자: {maskPhoneNumber(treatment.patient_phone)}</p>
                <p>시술일: {format(new Date(treatment.treatment_date), 'yyyy년 M월 d일', { locale: ko })}</p>
                <p>등록일: {format(new Date(treatment.created_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 회수 다이얼로그 */}
      <Dialog open={showRecallDialog} onOpenChange={setShowRecallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>시술 회수</DialogTitle>
            <DialogDescription>
              이 시술을 회수하시겠습니까? 회수 사유를 입력해주세요.
              환자에게 회수 알림이 발송됩니다.
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
              <p className="text-sm text-yellow-800">
                <strong>수량:</strong> {treatment.totalQuantity}개 ({treatment.itemSummary.length}종)
              </p>
            </div>

            <div className="p-3 bg-red-50 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
              <p className="text-sm text-red-700">
                회수 시 환자에게 회수 알림이 발송됩니다.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recall-reason">회수 사유 (필수)</Label>
              <Textarea
                id="recall-reason"
                value={recallReason}
                onChange={(e) => setRecallReason(e.target.value)}
                placeholder="회수 사유를 입력해주세요..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRecallDialog(false);
                setRecallReason('');
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleRecall}
              disabled={isPending || !recallReason.trim()}
            >
              {isPending ? '처리 중...' : '회수하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * 시술 이력 테이블
 */
export function TreatmentHistoryTable({
  treatments,
  onRecall,
}: TreatmentHistoryTableProps): React.ReactElement {
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
          onRecall={onRecall}
        />
      ))}
    </div>
  );
}
