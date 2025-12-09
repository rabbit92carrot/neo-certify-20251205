'use client';

/**
 * 출고 이력 테이블 컴포넌트
 * 출고 뭉치를 접기/펼치기 UI로 표시합니다.
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
import { cn } from '@/lib/utils';
import type { ShipmentBatchSummary } from '@/services/shipment.service';

interface ShipmentHistoryTableProps {
  /** 출고 뭉치 목록 */
  shipments: ShipmentBatchSummary[];
  /** 발송 이력인지 수신 이력인지 */
  type: 'sent' | 'received';
  /** 회수 액션 (발송 이력에서만 사용) */
  onRecall?: (shipmentBatchId: string, reason: string) => Promise<{ success: boolean; error?: { message: string } }>;
}

/**
 * 출고 뭉치 카드
 */
function ShipmentBatchCard({
  batch,
  type,
  onRecall,
}: {
  batch: ShipmentBatchSummary;
  type: 'sent' | 'received';
  onRecall?: (shipmentBatchId: string, reason: string) => Promise<{ success: boolean; error?: { message: string } }>;
}): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRecallDialog, setShowRecallDialog] = useState(false);
  const [recallReason, setRecallReason] = useState('');
  const [isPending, startTransition] = useTransition();

  // 회수 가능 여부 확인 (24시간 이내, 미회수)
  const canRecall = (): boolean => {
    if (batch.is_recalled || type !== 'sent' || !onRecall) {return false;}
    const shipmentDate = new Date(batch.shipment_date);
    const now = new Date();
    const hoursDiff = (now.getTime() - shipmentDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  };

  const handleRecall = () => {
    if (!recallReason.trim()) {
      toast.error('회수 사유를 입력해주세요.');
      return;
    }

    startTransition(async () => {
      const result = await onRecall!(batch.id, recallReason);
      if (result.success) {
        toast.success('출고가 회수되었습니다.');
        setShowRecallDialog(false);
        setRecallReason('');
      } else {
        toast.error(result.error?.message || '회수에 실패했습니다.');
      }
    });
  };

  const targetOrg = type === 'sent' ? batch.toOrganization : batch.fromOrganization;
  const targetLabel = type === 'sent' ? '수신' : '발송';

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
                      회수됨
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

            <div className="flex items-center gap-2">
              {canRecall() && (
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
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            <div className="border-t pt-4 space-y-3">
              {/* 제품별 요약 */}
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

              {/* 회수 사유 (회수된 경우) */}
              {batch.is_recalled && batch.recall_reason && (
                <div className="p-3 bg-red-100 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>회수 사유:</strong> {batch.recall_reason}
                  </p>
                  {batch.recall_date && (
                    <p className="text-xs text-red-600 mt-1">
                      회수일: {format(new Date(batch.recall_date), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                    </p>
                  )}
                </div>
              )}

              {/* 메타 정보 */}
              <div className="text-xs text-muted-foreground">
                {targetLabel} 조직: {targetOrg.name}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 회수 다이얼로그 */}
      <Dialog open={showRecallDialog} onOpenChange={setShowRecallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>출고 회수</DialogTitle>
            <DialogDescription>
              이 출고를 회수하시겠습니까? 회수 사유를 입력해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>대상:</strong> {batch.toOrganization.name}
              </p>
              <p className="text-sm text-yellow-800">
                <strong>수량:</strong> {batch.totalQuantity}개 ({batch.itemSummary.length}종)
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
 * 출고 이력 테이블
 */
export function ShipmentHistoryTable({
  shipments,
  type,
  onRecall,
}: ShipmentHistoryTableProps): React.ReactElement {
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
          onRecall={onRecall}
        />
      ))}
    </div>
  );
}
