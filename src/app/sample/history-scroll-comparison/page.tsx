'use client';

/**
 * 이력 테이블 스크롤/반응형 비교 샘플 페이지
 * 가로 스크롤 방식 vs 반응형 페이지네이션 방식 비교
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  ChevronRight,
  ChevronLeft,
  Package,
  AlertTriangle,
  Factory,
  Truck,
  Building2,
  Stethoscope,
  User,
  ChevronsLeft,
  ChevronsRight,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, formatNumber } from '@/lib/utils';

// 목업 데이터 타입
interface MockEvent {
  id: string;
  eventTime: string;
  actionType: 'PRODUCED' | 'SHIPPED' | 'RECEIVED' | 'TREATED' | 'RECALLED';
  actionTypeLabel: string;
  totalQuantity: number;
  fromOwner: { name: string; type: string } | null;
  toOwner: { name: string; type: string } | null;
  lotNumbers: string[];
  isRecall: boolean;
}

// 목업 데이터
const mockEvents: MockEvent[] = [
  {
    id: '1',
    eventTime: '2024-12-15T13:06:00Z',
    actionType: 'TREATED',
    actionTypeLabel: '시술',
    totalQuantity: 10,
    fromOwner: { name: '테스트병원', type: 'ORGANIZATION' },
    toOwner: { name: '***-****-9829', type: 'PATIENT' },
    lotNumbers: ['ND23060251106', 'ND23060251107'],
    isRecall: false,
  },
  {
    id: '2',
    eventTime: '2024-12-15T13:05:00Z',
    actionType: 'SHIPPED',
    actionTypeLabel: '출고',
    totalQuantity: 10,
    fromOwner: { name: '테스트제조사', type: 'ORGANIZATION' },
    toOwner: { name: '테스트병원', type: 'ORGANIZATION' },
    lotNumbers: ['ND23060251106'],
    isRecall: false,
  },
  {
    id: '3',
    eventTime: '2024-12-15T13:05:00Z',
    actionType: 'RECEIVED',
    actionTypeLabel: '입고',
    totalQuantity: 10,
    fromOwner: { name: '테스트제조사', type: 'ORGANIZATION' },
    toOwner: { name: '테스트병원', type: 'ORGANIZATION' },
    lotNumbers: ['ND23060251106'],
    isRecall: false,
  },
  {
    id: '4',
    eventTime: '2024-12-15T11:28:00Z',
    actionType: 'TREATED',
    actionTypeLabel: '시술',
    totalQuantity: 6,
    fromOwner: { name: '테스트병원', type: 'ORGANIZATION' },
    toOwner: { name: '***-****-9829', type: 'PATIENT' },
    lotNumbers: ['ND23060251106'],
    isRecall: false,
  },
  {
    id: '5',
    eventTime: '2024-12-15T10:40:00Z',
    actionType: 'RECEIVED',
    actionTypeLabel: '입고',
    totalQuantity: 20,
    fromOwner: { name: '테스트유통사', type: 'ORGANIZATION' },
    toOwner: { name: '테스트병원', type: 'ORGANIZATION' },
    lotNumbers: ['ND23060251106'],
    isRecall: false,
  },
  {
    id: '6',
    eventTime: '2024-12-15T10:37:00Z',
    actionType: 'SHIPPED',
    actionTypeLabel: '출고',
    totalQuantity: 1392,
    fromOwner: { name: '테스트제조사', type: 'ORGANIZATION' },
    toOwner: { name: '테스트유통사', type: 'ORGANIZATION' },
    lotNumbers: ['ND23060251106'],
    isRecall: false,
  },
  {
    id: '7',
    eventTime: '2024-12-15T10:22:00Z',
    actionType: 'PRODUCED',
    actionTypeLabel: '생산',
    totalQuantity: 154,
    fromOwner: { name: '테스트제조사', type: 'ORGANIZATION' },
    toOwner: { name: '테스트제조사', type: 'ORGANIZATION' },
    lotNumbers: ['ND23060251106'],
    isRecall: false,
  },
  {
    id: '8',
    eventTime: '2024-12-14T00:54:00Z',
    actionType: 'RECALLED',
    actionTypeLabel: '회수',
    totalQuantity: 5,
    fromOwner: { name: '테스트병원', type: 'ORGANIZATION' },
    toOwner: { name: '***-****-9829', type: 'PATIENT' },
    lotNumbers: ['ND23060251213'],
    isRecall: true,
  },
];

// 헬퍼 함수들
function getActionTypeBadgeVariant(
  actionType: string
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

function getOwnerIcon(type: string): React.ReactNode {
  if (type === 'PATIENT') {
    return <User className="h-3 w-3" />;
  }
  return <Building2 className="h-3 w-3" />;
}

function getActionTypeIcon(actionType: string): React.ReactNode {
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
    default:
      return <Package className="h-4 w-4" />;
  }
}

/**
 * 방식 1: 가로 스크롤 테이블
 * 테이블 전체를 overflow-x-auto로 감싸서 작은 화면에서 가로 스크롤
 */
function HorizontalScrollTable({ events }: { events: MockEvent[] }): React.ReactElement {
  const [page, setPage] = useState(1);
  const totalPages = 10;

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-2">
        테이블 영역을 가로로 스크롤할 수 있습니다. 페이지네이션은 테이블 아래에 고정됩니다.
      </div>

      {/* 가로 스크롤 컨테이너 */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] min-w-[100px]">일시</TableHead>
              <TableHead className="w-[140px] min-w-[140px]">이벤트</TableHead>
              <TableHead className="w-[100px] min-w-[100px]">수량</TableHead>
              <TableHead className="min-w-[150px]">출발</TableHead>
              <TableHead className="min-w-[150px]">도착</TableHead>
              <TableHead className="min-w-[200px]">Lot 번호</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id} className={cn(event.isRecall && 'bg-red-50')}>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(event.eventTime), 'MM.dd HH:mm', { locale: ko })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getActionTypeIcon(event.actionType)}
                    <Badge variant={getActionTypeBadgeVariant(event.actionType)}>
                      {event.actionTypeLabel}
                    </Badge>
                    {event.isRecall && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono">
                    {formatNumber(event.totalQuantity)}개
                  </Badge>
                </TableCell>
                <TableCell>
                  {event.fromOwner ? (
                    <div className="flex items-center gap-1">
                      {getOwnerIcon(event.fromOwner.type)}
                      <span className="text-sm truncate max-w-[120px]">{event.fromOwner.name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {event.toOwner ? (
                    <div className="flex items-center gap-1">
                      {getOwnerIcon(event.toOwner.type)}
                      <span className="text-sm truncate max-w-[120px]">{event.toOwner.name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <code className="text-xs font-mono">{event.lotNumbers.slice(0, 2).join(', ')}</code>
                    {event.lotNumbers.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{event.lotNumbers.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 - 테이블 외부에 고정 */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>
          <ChevronLeft className="h-4 w-4" />
          이전
        </Button>
        <span className="text-sm text-muted-foreground px-4">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          다음
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * 방식 2: 반응형 페이지네이션
 * 데스크톱에서는 전체 페이지네이션, 모바일에서는 간소화된 버전
 */
function ResponsivePaginationTable({ events }: { events: MockEvent[] }): React.ReactElement {
  const [page, setPage] = useState(5);
  const totalPages = 10;

  // 페이지 번호 배열 생성 (현재 페이지 주변 2개씩)
  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-2">
        데스크톱: 페이지 번호 전체 표시 / 모바일: 이전/다음 버튼만 표시
      </div>

      {/* 테이블 */}
      <div className="rounded-md border">
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
              <TableRow key={event.id} className={cn(event.isRecall && 'bg-red-50')}>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(event.eventTime), 'MM.dd HH:mm', { locale: ko })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getActionTypeIcon(event.actionType)}
                    <Badge variant={getActionTypeBadgeVariant(event.actionType)}>
                      {event.actionTypeLabel}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono">
                    {formatNumber(event.totalQuantity)}개
                  </Badge>
                </TableCell>
                <TableCell>
                  {event.fromOwner ? (
                    <div className="flex items-center gap-1">
                      {getOwnerIcon(event.fromOwner.type)}
                      <span className="text-sm truncate max-w-[120px]">{event.fromOwner.name}</span>
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {event.toOwner ? (
                    <div className="flex items-center gap-1">
                      {getOwnerIcon(event.toOwner.type)}
                      <span className="text-sm truncate max-w-[120px]">{event.toOwner.name}</span>
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <code className="text-xs font-mono">{event.lotNumbers[0]}</code>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 반응형 페이지네이션 */}
      <div className="flex items-center justify-center">
        {/* 모바일: 간소화된 페이지네이션 */}
        <div className="flex md:hidden items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[60px] text-center">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* 데스크톱: 전체 페이지네이션 */}
        <div className="hidden md:flex items-center gap-1">
          {/* 처음으로 */}
          <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page <= 1}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          {/* 이전 */}
          <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* 페이지 번호들 */}
          {page > 3 && (
            <>
              <Button variant="outline" size="sm" onClick={() => setPage(1)}>
                1
              </Button>
              {page > 4 && <span className="text-muted-foreground px-1">...</span>}
            </>
          )}

          {getPageNumbers().map((p) => (
            <Button
              key={p}
              variant={p === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPage(p)}
              className="min-w-[36px]"
            >
              {p}
            </Button>
          ))}

          {page < totalPages - 2 && (
            <>
              {page < totalPages - 3 && <span className="text-muted-foreground px-1">...</span>}
              <Button variant="outline" size="sm" onClick={() => setPage(totalPages)}>
                {totalPages}
              </Button>
            </>
          )}

          {/* 다음 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {/* 마지막으로 */}
          <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page >= totalPages}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * 방식 3: 두 가지 결합 (가로 스크롤 + 반응형 페이지네이션)
 */
function CombinedApproach({ events }: { events: MockEvent[] }): React.ReactElement {
  const [page, setPage] = useState(5);
  const totalPages = 10;

  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-2">
        테이블: 가로 스크롤 / 페이지네이션: 반응형 (두 가지 장점 결합)
      </div>

      {/* 가로 스크롤 테이블 */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] min-w-[100px]">일시</TableHead>
              <TableHead className="w-[140px] min-w-[140px]">이벤트</TableHead>
              <TableHead className="w-[100px] min-w-[100px]">수량</TableHead>
              <TableHead className="min-w-[150px]">출발</TableHead>
              <TableHead className="min-w-[150px]">도착</TableHead>
              <TableHead className="min-w-[200px]">Lot 번호</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id} className={cn(event.isRecall && 'bg-red-50')}>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(event.eventTime), 'MM.dd HH:mm', { locale: ko })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getActionTypeIcon(event.actionType)}
                    <Badge variant={getActionTypeBadgeVariant(event.actionType)}>
                      {event.actionTypeLabel}
                    </Badge>
                    {event.isRecall && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono">
                    {formatNumber(event.totalQuantity)}개
                  </Badge>
                </TableCell>
                <TableCell>
                  {event.fromOwner ? (
                    <div className="flex items-center gap-1">
                      {getOwnerIcon(event.fromOwner.type)}
                      <span className="text-sm truncate max-w-[120px]">{event.fromOwner.name}</span>
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {event.toOwner ? (
                    <div className="flex items-center gap-1">
                      {getOwnerIcon(event.toOwner.type)}
                      <span className="text-sm truncate max-w-[120px]">{event.toOwner.name}</span>
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <code className="text-xs font-mono">{event.lotNumbers.slice(0, 2).join(', ')}</code>
                    {event.lotNumbers.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{event.lotNumbers.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 반응형 페이지네이션 */}
      <div className="flex items-center justify-center">
        {/* 모바일 */}
        <div className="flex md:hidden items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[60px] text-center">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* 데스크톱 */}
        <div className="hidden md:flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page <= 1}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {page > 3 && (
            <>
              <Button variant="outline" size="sm" onClick={() => setPage(1)}>
                1
              </Button>
              {page > 4 && <span className="text-muted-foreground px-1">...</span>}
            </>
          )}

          {getPageNumbers().map((p) => (
            <Button
              key={p}
              variant={p === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPage(p)}
              className="min-w-[36px]"
            >
              {p}
            </Button>
          ))}

          {page < totalPages - 2 && (
            <>
              {page < totalPages - 3 && <span className="text-muted-foreground px-1">...</span>}
              <Button variant="outline" size="sm" onClick={() => setPage(totalPages)}>
                {totalPages}
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page >= totalPages}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function HistoryScrollComparisonPage(): React.ReactElement {
  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-2">이력 테이블 반응형 비교</h1>
      <p className="text-muted-foreground mb-6">
        창 크기를 줄여서 각 방식의 동작을 확인해보세요.
      </p>

      <Tabs defaultValue="horizontal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="horizontal">가로 스크롤</TabsTrigger>
          <TabsTrigger value="responsive">반응형 페이지네이션</TabsTrigger>
          <TabsTrigger value="combined">결합 방식</TabsTrigger>
        </TabsList>

        <TabsContent value="horizontal" className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900">방식 1: 가로 스크롤</h3>
            <ul className="text-sm text-blue-800 mt-2 space-y-1">
              <li>- 테이블에 min-width 설정 + overflow-x-auto</li>
              <li>- 모든 컬럼을 그대로 유지</li>
              <li>- 작은 화면에서 좌우 스크롤</li>
              <li>- 페이지네이션은 테이블 외부에 고정</li>
            </ul>
          </div>
          <HorizontalScrollTable events={mockEvents} />
        </TabsContent>

        <TabsContent value="responsive" className="space-y-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-900">방식 2: 반응형 페이지네이션</h3>
            <ul className="text-sm text-green-800 mt-2 space-y-1">
              <li>- 데스크톱: 페이지 번호 전체 표시</li>
              <li>- 모바일: 이전/다음 버튼 + 현재/전체 페이지만 표시</li>
              <li>- 테이블은 기존 방식 유지</li>
            </ul>
          </div>
          <ResponsivePaginationTable events={mockEvents} />
        </TabsContent>

        <TabsContent value="combined" className="space-y-4">
          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="font-semibold text-purple-900">방식 3: 두 가지 결합</h3>
            <ul className="text-sm text-purple-800 mt-2 space-y-1">
              <li>- 테이블: 가로 스크롤 적용</li>
              <li>- 페이지네이션: 반응형 적용</li>
              <li>- 두 가지 장점을 모두 활용</li>
            </ul>
          </div>
          <CombinedApproach events={mockEvents} />
        </TabsContent>
      </Tabs>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">테스트 방법</h3>
        <ol className="text-sm text-muted-foreground space-y-1">
          <li>1. 브라우저 창 크기를 768px 이하로 줄여보세요 (모바일 시뮬레이션)</li>
          <li>2. 각 탭을 전환하며 테이블과 페이지네이션의 동작을 확인하세요</li>
          <li>3. 가로 스크롤 방식에서는 테이블 영역을 좌우로 드래그해보세요</li>
        </ol>
      </div>
    </div>
  );
}
