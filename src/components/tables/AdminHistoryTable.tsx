'use client';

/**
 * 관리자 전체 이력 테이블 컴포넌트
 * Excel형 테이블, 회수 이력 강조 표시
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  ChevronDown,
  ChevronRight,
  Package,
  AlertTriangle,
  Factory,
  Truck,
  Building2,
  Stethoscope,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';
import type {
  AdminHistoryItem,
  AdminHistoryDetail,
  VirtualCodeStatus,
  HistoryActionType,
  OrganizationType,
} from '@/types/api.types';
import { VIRTUAL_CODE_STATUS_LABELS } from '@/constants/product';

interface AdminHistoryTableProps {
  histories: AdminHistoryItem[];
}

/**
 * 상태별 배지 스타일
 */
function getStatusBadgeVariant(
  status: VirtualCodeStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'IN_STOCK':
      return 'default';
    case 'USED':
      return 'secondary';
    case 'DISPOSED':
      return 'destructive';
    default:
      return 'outline';
  }
}

/**
 * 조직 타입별 아이콘
 */
function getOwnerIcon(type: OrganizationType | 'PATIENT'): React.ReactNode {
  switch (type) {
    case 'MANUFACTURER':
      return <Factory className="h-3 w-3" />;
    case 'DISTRIBUTOR':
      return <Truck className="h-3 w-3" />;
    case 'HOSPITAL':
      return <Stethoscope className="h-3 w-3" />;
    case 'PATIENT':
      return <User className="h-3 w-3" />;
    default:
      return <Building2 className="h-3 w-3" />;
  }
}

/**
 * 액션 타입 라벨
 */
const ACTION_TYPE_LABELS: Record<HistoryActionType, string> = {
  PRODUCED: '생산',
  SHIPPED: '출고',
  RECEIVED: '입고',
  TREATED: '시술',
  RECALLED: '회수',
  DISPOSED: '폐기',
};

/**
 * 이력 상세 행
 */
function HistoryDetailRow({ detail }: { detail: AdminHistoryDetail }): React.ReactElement {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-2 rounded text-sm',
        detail.isRecall ? 'bg-red-50 text-red-800' : 'bg-gray-50'
      )}
    >
      <div className="flex items-center gap-3">
        <Badge variant={detail.isRecall ? 'destructive' : 'outline'} className="text-xs">
          {ACTION_TYPE_LABELS[detail.actionType]}
        </Badge>
        <span className="text-muted-foreground">
          {detail.fromOwner} → {detail.toOwner}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {detail.isRecall && detail.recallReason && (
          <span className="text-xs text-red-600 max-w-[200px] truncate">
            사유: {detail.recallReason}
          </span>
        )}
        <span className="text-xs text-muted-foreground">
          {format(new Date(detail.createdAt), 'MM.dd HH:mm', { locale: ko })}
        </span>
      </div>
    </div>
  );
}

/**
 * 이력 행 (확장 가능)
 * 테이블 구조에 맞게 Collapsible 대신 상태 기반 토글 사용
 */
function HistoryRow({ item }: { item: AdminHistoryItem }): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <TableRow className={cn(item.isRecalled && 'bg-red-50')}>
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-auto"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4 mr-2" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-2" />
            )}
            <code className="text-xs font-mono">{item.virtualCode}</code>
          </Button>
        </TableCell>
        <TableCell className="text-muted-foreground">
          {format(new Date(item.productionDate), 'yyyy.MM.dd', { locale: ko })}
        </TableCell>
        <TableCell>
          <Badge variant={getStatusBadgeVariant(item.currentStatus)}>
            {VIRTUAL_CODE_STATUS_LABELS[item.currentStatus]}
          </Badge>
        </TableCell>
        <TableCell>
          {item.currentOwner ? (
            <div className="flex items-center gap-1">
              {getOwnerIcon(item.currentOwner.type)}
              <span className="text-sm">{item.currentOwner.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Factory className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{item.originalProducer.name}</span>
          </div>
        </TableCell>
        <TableCell>{item.productName}</TableCell>
        <TableCell>
          <code className="text-xs">{item.lotNumber}</code>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {item.historyCount}건
            </Badge>
            {item.isRecalled && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                회수
              </Badge>
            )}
          </div>
        </TableCell>
      </TableRow>
      {isOpen && (
        <TableRow>
          <TableCell colSpan={8} className="p-0">
            <div className="px-6 py-3 space-y-2 bg-gray-50/50">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                이동 이력 ({item.histories.length}건)
              </div>
              {item.histories.map((detail) => (
                <HistoryDetailRow key={detail.id} detail={detail} />
              ))}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

/**
 * 관리자 전체 이력 테이블
 */
export function AdminHistoryTable({ histories }: AdminHistoryTableProps): React.ReactElement {
  if (histories.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="이력이 없습니다"
        description="조회 조건에 맞는 이력이 없습니다."
      />
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>식별코드</TableHead>
            <TableHead>생산일자</TableHead>
            <TableHead>현재 상태</TableHead>
            <TableHead>현재 소유자</TableHead>
            <TableHead>최초 생산자</TableHead>
            <TableHead>제품명</TableHead>
            <TableHead>Lot 번호</TableHead>
            <TableHead>이동 이력</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {histories.map((item) => (
            <HistoryRow key={item.id} item={item} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
