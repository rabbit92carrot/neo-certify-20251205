'use client';

/**
 * 관리자 이벤트 요약 테이블 컴포넌트
 * 이벤트 단위 요약 표시, 인라인 확장으로 Lot별 상세 + 고유식별코드 표시
 */

import { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Package,
  AlertTriangle,
  Factory,
  Truck,
  Building2,
  Stethoscope,
  User,
  Loader2,
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
import { cn, formatNumber } from '@/lib/utils';
import { getEventCodesAction } from '@/app/(dashboard)/admin/actions';
import type {
  AdminEventSummary,
  AdminEventLotSummary,
  HistoryActionType,
  LotCodeItem,
} from '@/types/api.types';

interface AdminEventSummaryTableProps {
  events: AdminEventSummary[];
}

/**
 * 이벤트 타입별 배지 스타일
 */
function getActionTypeBadgeVariant(
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
function getOwnerIcon(type: 'ORGANIZATION' | 'PATIENT' | string): React.ReactNode {
  if (type === 'PATIENT') {
    return <User className="h-3 w-3" />;
  }
  return <Building2 className="h-3 w-3" />;
}

/**
 * 이벤트 타입별 아이콘
 */
function getActionTypeIcon(actionType: HistoryActionType): React.ReactNode {
  switch (actionType) {
    case 'PRODUCED':
      return <Factory className="h-4 w-4" />;
    case 'SHIPPED':
    case 'RECEIVED':
      return <Truck className="h-4 w-4" />;
    case 'TREATED':
      return <Stethoscope className="h-4 w-4" />;
    case 'RECALLED':
      return <AlertTriangle className="h-4 w-4" />;
    case 'DISPOSED':
      return <Package className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
}

/**
 * 상태별 배지 스타일
 */
function getStatusBadge(status: string): React.ReactElement {
  switch (status) {
    case 'IN_STOCK':
      return <Badge variant="secondary" className="text-xs">재고</Badge>;
    case 'USED':
      return <Badge variant="outline" className="text-xs">사용됨</Badge>;
    case 'DISPOSED':
      return <Badge variant="destructive" className="text-xs">폐기</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}

/**
 * 이벤트별 고유식별코드 테이블 (인라인 스크롤)
 * codeIds 배열을 기반으로 해당 이벤트에서 처리된 코드만 표시
 */
function EventCodeTable({
  codeIds,
}: {
  codeIds: string[];
}): React.ReactElement {
  const [codes, setCodes] = useState<LotCodeItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true); // 초기 로딩 상태

  const loadCodes = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const result = await getEventCodesAction(codeIds, pageNum);
      if (result.success && result.data) {
        setCodes(result.data.codes);
        setTotalPages(result.data.totalPages);
        setTotal(result.data.total);
        setPage(pageNum);
      }
    } finally {
      setLoading(false);
    }
  }, [codeIds]);

  // useEffect로 마운트 시 데이터 로드 (무한 루프 방지)
  useEffect(() => {
    loadCodes(1);
  }, [loadCodes]);

  // 초기 로딩 상태
  if (loading && codes.length === 0) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">코드 로딩 중...</span>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        고유식별코드가 없습니다.
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">
          고유식별코드 ({formatNumber(total)}개)
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={page <= 1 || loading}
              onClick={() => loadCodes(page - 1)}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <span className="text-xs text-muted-foreground px-1">
              {page}/{totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={page >= totalPages || loading}
              onClick={() => loadCodes(page + 1)}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      {/* 코드 테이블 - 고정 높이 + 내부 스크롤 */}
      <div className="relative rounded border bg-white overflow-hidden">
        <div className="max-h-[200px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="h-8 py-1 px-3 text-left font-medium text-muted-foreground">코드</th>
                <th className="h-8 py-1 px-3 text-left font-medium text-muted-foreground w-[80px]">상태</th>
                <th className="h-8 py-1 px-3 text-left font-medium text-muted-foreground">현재 소유</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((code) => (
                <tr key={code.id} className="border-t hover:bg-gray-50/50">
                  <td className="py-1.5 px-3 font-mono">
                    {code.code}
                  </td>
                  <td className="py-1.5 px-3">
                    {getStatusBadge(code.currentStatus)}
                  </td>
                  <td className="py-1.5 px-3">
                    <div className="flex items-center gap-1">
                      {getOwnerIcon(code.currentOwnerType)}
                      <span className="truncate max-w-[120px]">
                        {code.currentOwnerName}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* 로딩 오버레이 */}
        {loading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Lot 요약 행 (확장 가능 - 고유식별코드 포함)
 */
function LotSummaryRow({ lot }: { lot: AdminEventLotSummary }): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded-lg bg-white">
      {/* Lot 헤더 (클릭하여 확장) */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          <code className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
            {lot.lotNumber}
          </code>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{lot.productName}</span>
            <span className="text-xs text-muted-foreground">{lot.modelName || '-'}</span>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          {formatNumber(lot.quantity)}개
        </Badge>
      </div>

      {/* 확장 영역 - 고유식별코드 테이블 */}
      {isExpanded && lot.codeIds && lot.codeIds.length > 0 && (
        <div className="px-4 pb-4 border-t">
          <EventCodeTable codeIds={lot.codeIds} />
        </div>
      )}
      {isExpanded && (!lot.codeIds || lot.codeIds.length === 0) && (
        <div className="px-4 pb-4 border-t">
          <div className="text-center py-4 text-sm text-muted-foreground">
            고유식별코드 정보가 없습니다.
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 이벤트 행 (확장 가능)
 * 테이블 구조에 맞게 Collapsible 대신 상태 기반 토글 사용
 */
function EventRow({
  event,
}: {
  event: AdminEventSummary;
}): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  // Lot 번호 요약 (최대 3개까지 표시)
  const lotNumbers = event.lotSummaries.map((l) => l.lotNumber);
  const displayLots = lotNumbers.slice(0, 3);
  const remainingLots = lotNumbers.length - 3;

  return (
    <>
      <TableRow className={cn(event.isRecall && 'bg-red-50')}>
        {/* 일시 */}
        <TableCell className="whitespace-nowrap">
          {format(new Date(event.eventTime), 'MM.dd HH:mm', { locale: ko })}
        </TableCell>

        {/* 이벤트 타입 */}
        <TableCell>
          <div className="flex items-center gap-2">
            {getActionTypeIcon(event.actionType)}
            <Badge variant={getActionTypeBadgeVariant(event.actionType)}>
              {event.actionTypeLabel}
            </Badge>
            {event.isRecall && (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </div>
        </TableCell>

        {/* 수량 */}
        <TableCell>
          <Badge variant="outline" className="font-mono">
            {formatNumber(event.totalQuantity)}개
          </Badge>
        </TableCell>

        {/* 출발 */}
        <TableCell>
          {event.fromOwner ? (
            <div className="flex items-center gap-1">
              {getOwnerIcon(event.fromOwner.type)}
              <span className="text-sm max-w-[150px] truncate">
                {event.fromOwner.name}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>

        {/* 도착 */}
        <TableCell>
          {event.toOwner ? (
            <div className="flex items-center gap-1">
              {getOwnerIcon(event.toOwner.type)}
              <span className="text-sm max-w-[150px] truncate">
                {event.toOwner.name}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>

        {/* Lot 번호 */}
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-auto font-normal"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4 mr-1" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-1" />
            )}
            <div className="flex items-center gap-1">
              <code className="text-xs font-mono">{displayLots.join(', ')}</code>
              {remainingLots > 0 && (
                <Badge variant="secondary" className="text-xs ml-1">
                  +{remainingLots}
                </Badge>
              )}
            </div>
          </Button>
        </TableCell>
      </TableRow>

      {/* 확장 콘텐츠 - Lot별 상세 (고유식별코드 포함) */}
      {isOpen && (
        <TableRow>
          <TableCell colSpan={6} className="p-0">
            <div className="px-6 py-4 space-y-3 bg-gray-50/50">
              <div className="text-xs font-medium text-muted-foreground">
                Lot별 상세 ({event.lotSummaries.length}개) - 클릭하여 고유식별코드 확인
              </div>
              {event.lotSummaries.map((lot) => (
                <LotSummaryRow key={lot.lotId} lot={lot} />
              ))}
              {event.isRecall && event.recallReason && (
                <div className="p-3 rounded-lg bg-red-100 text-sm text-red-800">
                  <span className="font-medium">회수 사유:</span> {event.recallReason}
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

/**
 * 모바일용 이벤트 카드 컴포넌트
 * 모바일에서 테이블 대신 카드 형태로 이벤트를 표시
 */
function EventCard({
  event,
}: {
  event: AdminEventSummary;
}): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn(
      'border rounded-lg overflow-hidden',
      event.isRecall && 'border-red-200 bg-red-50/50'
    )}>
      {/* 카드 헤더 - 클릭하여 확장 */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* 첫 번째 줄: 일시 + 이벤트 타입 + 수량 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {format(new Date(event.eventTime), 'MM.dd HH:mm', { locale: ko })}
            </span>
            <Badge variant={getActionTypeBadgeVariant(event.actionType)} className="text-xs">
              {event.actionTypeLabel}
            </Badge>
            {event.isRecall && (
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            )}
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {formatNumber(event.totalQuantity)}개
          </Badge>
        </div>

        {/* 두 번째 줄: 출발 → 도착 */}
        <div className="flex items-center gap-2 text-sm">
          {event.fromOwner ? (
            <div className="flex items-center gap-1 min-w-0">
              {getOwnerIcon(event.fromOwner.type)}
              <span className="truncate">{event.fromOwner.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
          <ChevronRight className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
          {event.toOwner ? (
            <div className="flex items-center gap-1 min-w-0">
              {getOwnerIcon(event.toOwner.type)}
              <span className="truncate">{event.toOwner.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>

        {/* 세 번째 줄: Lot 번호 요약 + 확장 버튼 */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Package className="h-3 w-3" />
            <span>Lot {event.lotSummaries.length}개</span>
          </div>
          <Button variant="ghost" size="sm" className="h-6 px-2">
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="text-xs ml-1">상세</span>
          </Button>
        </div>
      </div>

      {/* 확장 영역 - Lot별 상세 */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-3 border-t bg-gray-50/50">
          <div className="text-xs font-medium text-muted-foreground pt-3">
            Lot별 상세 - 클릭하여 고유식별코드 확인
          </div>
          {event.lotSummaries.map((lot) => (
            <LotSummaryRow key={lot.lotId} lot={lot} />
          ))}
          {event.isRecall && event.recallReason && (
            <div className="p-3 rounded-lg bg-red-100 text-sm text-red-800">
              <span className="font-medium">회수 사유:</span> {event.recallReason}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 관리자 이벤트 요약 테이블
 */
export function AdminEventSummaryTable({
  events,
}: AdminEventSummaryTableProps): React.ReactElement {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="이벤트가 없습니다"
        description="조회 조건에 맞는 이벤트가 없습니다."
      />
    );
  }

  return (
    <>
      {/* 데스크톱: 테이블 뷰 */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">일시</TableHead>
              <TableHead className="w-[140px]">이벤트</TableHead>
              <TableHead className="w-[100px]">수량</TableHead>
              <TableHead>출발</TableHead>
              <TableHead>도착</TableHead>
              <TableHead>Lot 번호</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 모바일: 카드 뷰 */}
      <div className="block md:hidden space-y-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </>
  );
}
