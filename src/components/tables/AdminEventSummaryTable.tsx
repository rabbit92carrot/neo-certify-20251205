'use client';

/**
 * 관리자 이벤트 요약 테이블 컴포넌트
 * 이벤트 단위 요약 표시, 인라인 확장으로 Lot별 상세 + 고유식별코드 표시
 *
 * 구조:
 * - EventRow: 데스크톱 테이블 행
 * - EventCard: 모바일 카드 뷰
 * - LotSummaryRow: Lot 요약 (확장 가능)
 * - EventCodeTable: 고유식별코드 테이블
 */

import { Package } from 'lucide-react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/EmptyState';
import { EventRow, EventCard } from './admin-event';
import type { AdminEventSummary } from '@/types/api.types';

interface AdminEventSummaryTableProps {
  events: AdminEventSummary[];
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
      <div className="hidden md:block rounded-md border overflow-x-auto">
        <Table className="min-w-[700px] table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">일시</TableHead>
              <TableHead className="w-[120px]">이벤트</TableHead>
              <TableHead className="w-[80px]">수량</TableHead>
              <TableHead className="w-[18%]">출발</TableHead>
              <TableHead className="w-[18%]">도착</TableHead>
              <TableHead className="w-auto">Lot 번호</TableHead>
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
