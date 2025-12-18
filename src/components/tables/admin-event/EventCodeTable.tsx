'use client';

/**
 * 이벤트별 고유식별코드 테이블
 * codeIds 배열을 기반으로 해당 이벤트에서 처리된 코드만 표시
 */

import { useState, useCallback, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/utils';
import { getEventCodesAction } from '@/app/(dashboard)/admin/actions';
import { getOwnerIcon, getStatusBadge } from './utils';
import type { LotCodeItem } from '@/types/api.types';

interface EventCodeTableProps {
  codeIds: string[];
}

export function EventCodeTable({ codeIds }: EventCodeTableProps): React.ReactElement {
  const [codes, setCodes] = useState<LotCodeItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

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
        <div className="max-h-[200px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-xs table-fixed min-w-[280px]">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="h-8 py-1 px-2 text-left font-medium text-muted-foreground w-[35%]">
                  코드
                </th>
                <th className="h-8 py-1 px-2 text-left font-medium text-muted-foreground w-[20%]">
                  상태
                </th>
                <th className="h-8 py-1 px-2 text-left font-medium text-muted-foreground w-[45%]">
                  현재 소유
                </th>
              </tr>
            </thead>
            <tbody>
              {codes.map((code) => (
                <tr key={code.id} className="border-t hover:bg-gray-50/50">
                  <td className="py-1.5 px-2 font-mono truncate">{code.code}</td>
                  <td className="py-1.5 px-2">{getStatusBadge(code.currentStatus)}</td>
                  <td className="py-1.5 px-2">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="flex-shrink-0">
                        {getOwnerIcon(code.currentOwnerType)}
                      </span>
                      <span className="truncate">{code.currentOwnerName}</span>
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
