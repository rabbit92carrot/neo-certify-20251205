'use client';

/**
 * 거래이력 테이블 컴포넌트
 * 모든 역할에서 공유하는 거래 이력 테이블
 */

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
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';
import type { TransactionHistorySummary } from '@/services/history.service';
import type { HistoryActionType } from '@/types/api.types';

interface TransactionHistoryTableProps {
  /** 거래이력 목록 */
  histories: TransactionHistorySummary[];
  /** 현재 조직 ID (방향 표시용) */
  currentOrgId: string;
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
      return 'destructive';
    case 'DISPOSED':
      return 'destructive';
    default:
      return 'outline';
  }
}

/**
 * 거래이력 카드
 */
function TransactionHistoryCard({
  history,
  currentOrgId,
}: {
  history: TransactionHistorySummary;
  currentOrgId: string;
}): React.ReactElement {
  // 내가 보낸 것인지, 받은 것인지
  const isOutgoing = history.fromOwner?.id === currentOrgId;

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
                    회수
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(history.createdAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
              </p>
            </div>
          </div>

          {/* 수량 */}
          <div className="text-right">
            <p className="font-semibold text-lg">{history.totalQuantity}개</p>
            <p className="text-xs text-muted-foreground">{history.items.length}종</p>
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

        {/* 제품 목록 */}
        <div className="grid gap-2">
          {history.items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{item.productName}</span>
              </div>
              <Badge variant="secondary">{item.quantity}개</Badge>
            </div>
          ))}
        </div>

        {/* 회수 사유 */}
        {history.isRecall && history.recallReason && (
          <div className="mt-3 p-2 bg-red-100 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>회수 사유:</strong> {history.recallReason}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 거래이력 테이블
 */
export function TransactionHistoryTable({
  histories,
  currentOrgId,
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
        />
      ))}
    </div>
  );
}
