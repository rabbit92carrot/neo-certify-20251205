'use client';

/**
 * 거래이력 테이블 컴포넌트
 * 모든 역할에서 공유하는 거래 이력 테이블
 *
 * 기능:
 * - 제품 행 클릭 시 확장하여 고유식별코드(NC-XXXXXXXX) 목록 표시
 * - 코드 클릭 시 클립보드 복사
 * - 반응형 그리드 및 페이지네이션
 * - 출고 반품 기능 (수신자 주도, 시간 제한 없음)
 */

import { useState, useTransition } from 'react';
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
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { CodeListDisplay } from '@/components/shared/CodeListDisplay';
import { cn } from '@/lib/utils';
import type { TransactionHistorySummary } from '@/services/history.service';
import type { HistoryActionType } from '@/types/api.types';
import type { ProductAliasMap } from '@/components/shared/HistoryPageWrapper';
import type { ApiResponse } from '@/types/api.types';

interface TransactionHistoryTableProps {
  /** 거래이력 목록 */
  histories: TransactionHistorySummary[];
  /** 현재 조직 ID (방향 표시용) */
  currentOrgId: string;
  /** 제품 별칭 맵 (병원용 - 별칭 및 모델명 표시) */
  productAliasMap?: ProductAliasMap;
  /** 반품 액션 (입고 이력에서만 사용 - 수신자가 발송자에게 반품) */
  onReturn?: (shipmentBatchId: string, reason: string) => Promise<ApiResponse<void>>;
  /** 반품 버튼 표시 여부 */
  showReturnButton?: boolean;
}

/**
 * 액션 타입별 아이콘
 */
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
      return <RotateCcw className="h-4 w-4" />;
    case 'DISPOSED':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
}

/**
 * 액션 타입별 배지 스타일
 */
function getActionBadgeVariant(
  actionType: HistoryActionType,
  isRecall: boolean
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (isRecall) {return 'destructive';}

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
      return 'destructive';
    case 'DISPOSED':
      return 'destructive';
    default:
      return 'outline';
  }
}

/**
 * 제품 아이템 행 (확장 가능)
 * - 클릭하면 확장되어 코드 목록 표시
 */
function ProductItemRow({
  item,
  aliasInfo,
}: {
  item: {
    productId: string;
    productName: string;
    modelName?: string;
    quantity: number;
    codes: string[];
  };
  aliasInfo?: { alias: string | null; modelName: string };
}): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasCodes = item.codes && item.codes.length > 0;

  // 별칭이 있으면 별칭 사용, 없으면 제품명 사용
  const displayName = aliasInfo?.alias ?? item.productName;
  // aliasInfo의 modelName 우선, 없으면 item의 modelName 사용
  const modelName = aliasInfo?.modelName ?? item.modelName;

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      {/* 제품 헤더 (클릭하여 확장) */}
      <button
        onClick={() => hasCodes && setIsExpanded(!isExpanded)}
        disabled={!hasCodes}
        className={cn(
          'w-full flex items-center justify-between p-3',
          'transition-colors',
          hasCodes && 'hover:bg-gray-50 cursor-pointer',
          !hasCodes && 'cursor-default',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset',
          isExpanded && 'bg-gray-50'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {hasCodes && (
            <span className="text-gray-400">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </span>
          )}
          <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <div className="min-w-0 text-left">
            <span className="text-sm font-medium">{displayName}</span>
            {modelName && (
              <div className="text-xs text-muted-foreground truncate">
                {modelName}
              </div>
            )}
          </div>
        </div>
        <Badge variant="secondary" className="flex-shrink-0">
          {item.quantity}개
        </Badge>
      </button>

      {/* 확장 영역: 코드 목록 */}
      {isExpanded && hasCodes && (
        <div className="border-t px-3 py-2 bg-gray-50/50">
          <CodeListDisplay codes={item.codes} pageSize={20} />
        </div>
      )}
    </div>
  );
}

/**
 * 거래이력 카드
 */
function TransactionHistoryCard({
  history,
  currentOrgId,
  productAliasMap,
  onReturn,
  showReturnButton,
}: {
  history: TransactionHistorySummary;
  currentOrgId: string;
  productAliasMap?: ProductAliasMap;
  onReturn?: (shipmentBatchId: string, reason: string) => Promise<ApiResponse<void>>;
  showReturnButton?: boolean;
}): React.ReactElement {
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [isPending, startTransition] = useTransition();

  // 내가 보낸 것인지, 받은 것인지
  const isOutgoing = history.fromOwner?.id === currentOrgId;
  // 내가 받은 것인지 (수신자)
  const isIncoming = history.toOwner?.id === currentOrgId;

  // 코드가 있는 아이템이 있는지 확인
  const hasAnyCodes = history.items.some((item) => item.codes && item.codes.length > 0);

  // 반품 가능 여부 확인 (RECEIVED 이벤트, 미반품, 내가 받은 것, 시간 제한 없음)
  const canReturn = (): boolean => {
    if (!showReturnButton || !onReturn) return false;
    if (history.isRecall) return false; // 이미 반품됨
    if (history.actionType !== 'RECEIVED') return false; // RECEIVED 이벤트만
    if (!isIncoming) return false; // 내가 받은 것만
    if (!history.shipmentBatchId) return false; // 배치 ID 필요
    // 24시간 제한 제거 - 수신자는 언제든 반품 가능
    return true;
  };

  const handleReturn = (): void => {
    if (!returnReason.trim()) {
      toast.error('반품 사유를 입력해주세요.');
      return;
    }

    if (!history.shipmentBatchId) {
      toast.error('반품할 수 없는 입고 건입니다.');
      return;
    }

    startTransition(async () => {
      const result = await onReturn!(history.shipmentBatchId!, returnReason);
      if (result.success) {
        toast.success('반품이 완료되었습니다.');
        setShowReturnDialog(false);
        setReturnReason('');
      } else {
        toast.error(result.error?.message ?? '반품에 실패했습니다.');
      }
    });
  };

  // 방향 라벨
  const getDirectionLabel = (): string => {
    switch (history.actionType) {
      case 'PRODUCED':
        return '생산';
      case 'SHIPPED':
        return isOutgoing ? '출고' : '입고';
      case 'RECEIVED':
        return '입고';
      case 'TREATED':
        return '시술';
      case 'RECALLED':
        return isOutgoing ? '회수 복귀' : '회수됨';
      case 'RETURNED':
        return isIncoming ? '반품 복귀' : '반품됨';
      case 'DISPOSED':
        return '폐기';
      default:
        return history.actionTypeLabel;
    }
  };

  return (
    <Card className={cn(history.isRecall && 'border-red-200 bg-red-50')}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 액션 아이콘 */}
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
                  {getDirectionLabel()}
                </Badge>
                {history.isRecall && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {history.actionType === 'RETURNED' ? '반품' : '회수'}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(history.createdAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
              </p>
            </div>
          </div>

          {/* 수량 및 반품 버튼 */}
          <div className="flex items-center gap-3">
            {canReturn() && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setShowReturnDialog(true)}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                반품
              </Button>
            )}
            <div className="text-right">
              <p className="font-semibold text-lg">{history.totalQuantity}개</p>
              <p className="text-xs text-muted-foreground">{history.items.length}종</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* 거래 당사자 표시 */}
        {(history.fromOwner || history.toOwner) && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg text-sm">
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

        {/* 제품 목록 - 클릭하여 코드 확장 */}
        <div className="space-y-2">
          {hasAnyCodes && (
            <p className="text-xs text-muted-foreground mb-1">
              제품을 클릭하여 고유식별코드를 확인하세요
            </p>
          )}
          {history.items.map((item) => (
            <ProductItemRow
              key={item.productId}
              item={item}
              aliasInfo={productAliasMap?.[item.productId]}
            />
          ))}
        </div>

        {/* 회수/반품 사유 */}
        {history.isRecall && history.recallReason && (
          <div className="mt-3 p-2 bg-red-100 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>{history.actionType === 'RETURNED' ? '반품' : '회수'} 사유:</strong> {history.recallReason}
            </p>
          </div>
        )}
      </CardContent>

      {/* 반품 다이얼로그 */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>입고 반품</DialogTitle>
            <DialogDescription>
              이 입고를 반품하시겠습니까? 반품 사유를 입력해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>발송 조직:</strong> {history.fromOwner?.name ?? '알 수 없음'}
              </p>
              <p className="text-sm text-yellow-800">
                <strong>수량:</strong> {history.totalQuantity}개 ({history.items.length}종)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="return-reason">반품 사유 (필수)</Label>
              <Textarea
                id="return-reason"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="반품 사유를 입력해주세요..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReturnDialog(false);
                setReturnReason('');
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleReturn}
              disabled={isPending || !returnReason.trim()}
            >
              {isPending ? '처리 중...' : '반품하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/**
 * 거래이력 테이블
 */
export function TransactionHistoryTable({
  histories,
  currentOrgId,
  productAliasMap,
  onReturn,
  showReturnButton,
}: TransactionHistoryTableProps): React.ReactElement {
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
          productAliasMap={productAliasMap}
          onReturn={onReturn}
          showReturnButton={showReturnButton}
        />
      ))}
    </div>
  );
}
