/**
 * AdminEventSummaryTable 유틸리티 함수
 * 배지 스타일, 아이콘 등 공통 헬퍼
 */

import React from 'react';
import {
  Package,
  AlertTriangle,
  Factory,
  Truck,
  Building2,
  Stethoscope,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { HistoryActionType } from '@/types/api.types';

/**
 * 이벤트 타입별 배지 스타일
 */
export function getActionTypeBadgeVariant(
  actionType: HistoryActionType
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (actionType) {
    case 'PRODUCED':
      return 'default';
    case 'SHIPPED':
    case 'RECEIVED':
      return 'secondary';
    case 'TREATED':
      return 'outline';
    case 'RECALLED':
    case 'DISPOSED':
      return 'destructive';
    default:
      return 'outline';
  }
}

/**
 * 조직/환자 타입별 아이콘
 */
export function getOwnerIcon(type: 'ORGANIZATION' | 'PATIENT' | string): React.ReactNode {
  if (type === 'PATIENT') {
    return React.createElement(User, { className: 'h-3 w-3' });
  }
  return React.createElement(Building2, { className: 'h-3 w-3' });
}

/**
 * 이벤트 타입별 아이콘
 */
export function getActionTypeIcon(actionType: HistoryActionType): React.ReactNode {
  switch (actionType) {
    case 'PRODUCED':
      return React.createElement(Factory, { className: 'h-4 w-4' });
    case 'SHIPPED':
    case 'RECEIVED':
      return React.createElement(Truck, { className: 'h-4 w-4' });
    case 'TREATED':
      return React.createElement(Stethoscope, { className: 'h-4 w-4' });
    case 'RECALLED':
      return React.createElement(AlertTriangle, { className: 'h-4 w-4' });
    case 'DISPOSED':
      return React.createElement(Package, { className: 'h-4 w-4' });
    default:
      return React.createElement(Package, { className: 'h-4 w-4' });
  }
}

/**
 * 상태별 배지 스타일
 */
export function getStatusBadge(status: string): React.ReactElement {
  switch (status) {
    case 'IN_STOCK':
      return React.createElement(Badge, { variant: 'secondary', className: 'text-xs' }, '재고');
    case 'USED':
      return React.createElement(Badge, { variant: 'outline', className: 'text-xs' }, '사용됨');
    case 'DISPOSED':
      return React.createElement(Badge, { variant: 'destructive', className: 'text-xs' }, '폐기');
    default:
      return React.createElement(Badge, { variant: 'outline', className: 'text-xs' }, status);
  }
}
