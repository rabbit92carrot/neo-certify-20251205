'use client';

/**
 * 회수 이력 코드 상세 테이블
 * 회수된 제품의 코드 상세 정보를 표시합니다.
 * EventCodeTable.tsx 패턴을 재사용합니다.
 */

import { useState, useCallback, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/utils';
import { getEventCodesAction } from '@/app/(dashboard)/admin/actions';
import type { LotCodeItem, VirtualCodeStatus } from '@/types/api.types';

interface RecallCodeTableProps {
  codeIds: string[];
}

/**
 * 상태 배지
 */
function getStatusBadge(status: VirtualCodeStatus): React.ReactElement {
  switch (status) {
    case 'IN_STOCK':
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
          재고
        </span>
      );
    case 'USED':
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
          사용
        </span>
      );
    case 'DISPOSED':
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
          폐기
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
          {status}
        </span>
      );
  }
}

/**
 * 소유자 아이콘
 */
function getOwnerIcon(type: string): React.ReactElement {
  switch (type) {
    case 'ORGANIZATION':
      return <span className="text-xs">🏢</span>;
    case 'PATIENT':
      return <span className="text-xs">👤</span>;
    default:
      return <span className="text-xs">📦</span>;
  }
}

export function RecallCodeTable({ codeIds }: RecallCodeTableProps): React.ReactElement {
  const [codes, setCodes] = useState<LotCodeItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadCodes = useCallback(
    async (pageNum: number) => {
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
    },
    [codeIds]
  );

  useEffect(() => {
    void loadCodes(1);
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
