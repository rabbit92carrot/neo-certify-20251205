'use client';

/**
 * 거래이력 카드 컴포넌트 (샘플)
 * - 기존 TransactionHistoryTable 스타일 기반
 * - 제품 클릭 시 코드 목록 확장
 */

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
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CodeListDisplay } from '@/components/shared/CodeListDisplay';
import type { MockTransactionSummary, MockTransactionItem } from '../_data/mock-data';
import type { HistoryActionType } from '@/types/api.types';

interface MockTransactionCardProps {
  transaction: MockTransactionSummary;
  currentOrgId: string;
}

// 액션 타입별 아이콘
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
    default:
      return <Package className="h-4 w-4" />;
  }
}

// 액션 타입별 배지 스타일
function getActionBadgeVariant(
  actionType: HistoryActionType,
  isRecall: boolean
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (isRecall) {
    return 'destructive';
  }

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
    default:
      return 'outline';
  }
}

// 제품 아이템 행 (확장 가능)
function ProductItemRow({
  item,
}: {
  item: MockTransactionItem;
}): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      {/* 제품 헤더 (클릭하여 확장) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between p-3',
          'hover:bg-gray-50 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset',
          isExpanded && 'bg-gray-50'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-gray-400">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
          <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <div className="min-w-0 text-left">
            <span className="text-sm font-medium">{item.productName}</span>
            {item.modelName && (
              <span className="text-xs text-muted-foreground ml-2">
                {item.modelName}
              </span>
            )}
          </div>
        </div>
        <Badge variant="secondary" className="flex-shrink-0">
          {item.quantity}개
        </Badge>
      </button>

      {/* 확장 영역: 코드 목록 */}
      {isExpanded && (
        <div className="border-t px-3 py-2 bg-gray-50/50">
          <CodeListDisplay codes={item.codes} />
        </div>
      )}
    </div>
  );
}

export function MockTransactionCard({
  transaction,
  currentOrgId,
}: MockTransactionCardProps): React.ReactElement {
  // 내가 보낸 것인지, 받은 것인지
  const isOutgoing = transaction.fromOwner?.id === currentOrgId;

  // 방향 라벨
  const getDirectionLabel = (): string => {
    switch (transaction.actionType) {
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
      default:
        return transaction.actionTypeLabel;
    }
  };

  return (
    <Card className={cn(transaction.isRecall && 'border-red-200 bg-red-50')}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 액션 아이콘 */}
            <div
              className={cn(
                'p-2 rounded-full',
                transaction.isRecall
                  ? 'bg-red-100 text-red-600'
                  : transaction.actionType === 'PRODUCED'
                    ? 'bg-blue-100 text-blue-600'
                    : transaction.actionType === 'SHIPPED'
                      ? 'bg-green-100 text-green-600'
                      : transaction.actionType === 'RECEIVED'
                        ? 'bg-purple-100 text-purple-600'
                        : transaction.actionType === 'TREATED'
                          ? 'bg-orange-100 text-orange-600'
                          : 'bg-gray-100 text-gray-600'
              )}
            >
              {getActionIcon(transaction.actionType)}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={getActionBadgeVariant(
                    transaction.actionType,
                    transaction.isRecall
                  )}
                >
                  {getDirectionLabel()}
                </Badge>
                {transaction.isRecall && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    회수
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(transaction.createdAt), 'yyyy년 M월 d일 HH:mm', {
                  locale: ko,
                })}
              </p>
            </div>
          </div>

          {/* 수량 */}
          <div className="text-right">
            <p className="font-semibold text-lg">{transaction.totalQuantity}개</p>
            <p className="text-xs text-muted-foreground">
              {transaction.items.length}종
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* 거래 당사자 표시 */}
        {(transaction.fromOwner || transaction.toOwner) && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg text-sm">
            {transaction.fromOwner && (
              <div className="flex items-center gap-1">
                {transaction.fromOwner.type === 'PATIENT' ? (
                  <User className="h-3 w-3 text-gray-400" />
                ) : (
                  <Building2 className="h-3 w-3 text-gray-400" />
                )}
                <span
                  className={cn(
                    transaction.fromOwner.id === currentOrgId
                      ? 'font-medium text-blue-600'
                      : 'text-gray-600'
                  )}
                >
                  {transaction.fromOwner.id === currentOrgId
                    ? '내 조직'
                    : transaction.fromOwner.name}
                </span>
              </div>
            )}
            {transaction.fromOwner && transaction.toOwner && (
              <ArrowRight className="h-4 w-4 text-gray-400" />
            )}
            {transaction.toOwner && (
              <div className="flex items-center gap-1">
                {transaction.toOwner.type === 'PATIENT' ? (
                  <User className="h-3 w-3 text-gray-400" />
                ) : (
                  <Building2 className="h-3 w-3 text-gray-400" />
                )}
                <span
                  className={cn(
                    transaction.toOwner.id === currentOrgId
                      ? 'font-medium text-blue-600'
                      : 'text-gray-600'
                  )}
                >
                  {transaction.toOwner.id === currentOrgId
                    ? '내 조직'
                    : transaction.toOwner.name}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 제품 목록 - 클릭하여 코드 확장 */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground mb-1">
            제품을 클릭하여 고유식별코드를 확인하세요
          </p>
          {transaction.items.map((item) => (
            <ProductItemRow key={item.productId} item={item} />
          ))}
        </div>

        {/* 회수 사유 */}
        {transaction.isRecall && transaction.recallReason && (
          <div className="mt-3 p-2 bg-red-100 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>회수 사유:</strong> {transaction.recallReason}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
