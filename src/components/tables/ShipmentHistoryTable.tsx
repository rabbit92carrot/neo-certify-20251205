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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';
import { RETURN_REASONS, RETURN_REASON_OPTIONS, type ReturnReasonType } from '@/constants/messages';
import type { ShipmentBatchSummary } from '@/services/shipment.service';

interface ShipmentHistoryTableProps {
  /** 출고 뭉치 목록 */
  shipments: ShipmentBatchSummary[];
  /** 발송 이력인지 수신 이력인지 */
  type: 'sent' | 'received';
  /** 반품 액션 (수신 이력에서만 사용 - 수신자가 발송자에게 반품) */
  onReturn?: (shipmentBatchId: string, reason: string) => Promise<{ success: boolean; error?: { message: string } }>;
}

/**
 * 출고 뭉치 카드
 */
function ShipmentBatchCard({
  batch,
  type,
  onReturn,
}: {
  batch: ShipmentBatchSummary;
  type: 'sent' | 'received';
  onReturn?: (shipmentBatchId: string, reason: string) => Promise<{ success: boolean; error?: { message: string } }>;
}): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnReasonType, setReturnReasonType] = useState<ReturnReasonType | ''>('');
  const [returnReasonText, setReturnReasonText] = useState('');
  const [isPending, startTransition] = useTransition();

  // 반품 가능 여부 확인 (수신자만, 미반품)
  // 24시간 제한 제거 - 수신자는 언제든 반품 가능
  const canReturn = (): boolean => {
    if (batch.is_recalled || type !== 'received' || !onReturn) {return false;}
    return true;
  };

  const handleReturn = () => {
    if (!returnReasonType) {
      toast.error('반품 사유를 선택해주세요.');
      return;
    }

    // "기타" 선택 시 텍스트 입력 필수
    if (returnReasonType === 'OTHER' && !returnReasonText.trim()) {
      toast.error('기타 사유를 입력해주세요.');
      return;
    }

    // 최종 사유 생성: 드롭다운 선택값 또는 기타 입력값
    const finalReason = returnReasonType === 'OTHER'
      ? returnReasonText.trim()
      : RETURN_REASONS[returnReasonType];

    startTransition(async () => {
      const result = await onReturn!(batch.id, finalReason);
      if (result.success) {
        toast.success('반품이 완료되었습니다.');
        setShowReturnDialog(false);
        setReturnReasonType('');
        setReturnReasonText('');
      } else {
        toast.error(result.error?.message || '반품에 실패했습니다.');
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

            <div className="flex items-center gap-2">
              {canReturn() && (
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

              {/* 반품 사유 (반품된 경우) */}
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

              {/* 메타 정보 */}
              <div className="text-xs text-muted-foreground">
                {targetLabel} 조직: {targetOrg.name}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 반품 다이얼로그 */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>반품 요청</DialogTitle>
            <DialogDescription>
              이 출고를 발송 조직에게 반품하시겠습니까? 반품 사유를 선택해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>발송 조직:</strong> {batch.fromOrganization.name}
              </p>
              <p className="text-sm text-yellow-800">
                <strong>수량:</strong> {batch.totalQuantity}개 ({batch.itemSummary.length}종)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="return-reason-type">반품 사유 (필수)</Label>
              <Select
                value={returnReasonType}
                onValueChange={(value) => setReturnReasonType(value as ReturnReasonType)}
              >
                <SelectTrigger id="return-reason-type">
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

            {/* "기타" 선택 시 텍스트 입력 */}
            {returnReasonType === 'OTHER' && (
              <div className="space-y-2">
                <Label htmlFor="return-reason-text">기타 사유 (필수)</Label>
                <Textarea
                  id="return-reason-text"
                  value={returnReasonText}
                  onChange={(e) => setReturnReasonText(e.target.value)}
                  placeholder="기타 사유를 입력해주세요..."
                  rows={3}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReturnDialog(false);
                setReturnReasonType('');
                setReturnReasonText('');
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleReturn}
              disabled={
                isPending ||
                !returnReasonType ||
                (returnReasonType === 'OTHER' && !returnReasonText.trim())
              }
            >
              {isPending ? '처리 중...' : '반품하기'}
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
  onReturn,
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
          onReturn={onReturn}
        />
      ))}
    </div>
  );
}
