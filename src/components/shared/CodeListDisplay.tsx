'use client';

/**
 * 코드 목록 표시 컴포넌트
 * - 반응형 그리드 (2~4열)
 * - 하단 페이지네이션
 * - 코드 클릭 시 클립보드 복사
 *
 * 사용처:
 * - 거래 이력 페이지에서 제품별 코드 목록 표시
 * - 샘플 페이지 (/sample/org-history-detail)
 */

import { useState, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CodeListDisplayProps {
  codes: string[];
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 20;

export function CodeListDisplay({
  codes,
  pageSize = DEFAULT_PAGE_SIZE,
}: CodeListDisplayProps): React.ReactElement {
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // 총 페이지 수
  const totalPages = useMemo(() => {
    return Math.ceil(codes.length / pageSize);
  }, [codes.length, pageSize]);

  // 현재 페이지에 표시할 코드
  const displayedCodes = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return codes.slice(startIndex, startIndex + pageSize);
  }, [codes, currentPage, pageSize]);

  // 페이지 이동
  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages]
  );

  // 코드 복사
  const handleCopyCode = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1500);
    } catch {
      toast.error('클립보드 복사에 실패했습니다');
    }
  }, []);

  // 전체 복사
  const handleCopyAll = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      setCopiedCode('__ALL__');
      setTimeout(() => setCopiedCode(null), 1500);
    } catch {
      toast.error('전체 복사에 실패했습니다');
    }
  }, [codes]);

  if (codes.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-3">
        코드 정보가 없습니다.
      </div>
    );
  }

  // 현재 표시 범위
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, codes.length);

  return (
    <div className="space-y-2">
      {/* 헤더: 총 개수 및 전체 복사 */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-muted-foreground">
          총 {codes.length}개
          {totalPages > 1 && ` (${startIndex}-${endIndex})`}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={handleCopyAll}
        >
          {copiedCode === '__ALL__' ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              복사됨
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              전체 복사
            </>
          )}
        </Button>
      </div>

      {/* 코드 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 p-2 bg-gray-50 rounded-lg">
        {displayedCodes.map((code) => (
          <button
            key={code}
            onClick={() => handleCopyCode(code)}
            className={cn(
              'text-xs font-mono text-gray-700 px-2 py-1.5 rounded',
              'hover:bg-gray-200 transition-colors text-left truncate',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
              copiedCode === code && 'bg-green-100 text-green-700'
            )}
            title={`클릭하여 복사: ${code}`}
          >
            {copiedCode === code ? '복사됨!' : code}
          </button>
        ))}
      </div>

      {/* 하단 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-1">
          {/* 첫 페이지 */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            title="첫 페이지"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* 이전 페이지 */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            title="이전 페이지"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* 페이지 번호 */}
          <div className="flex items-center gap-1 mx-1">
            {generatePageNumbers(currentPage, totalPages).map((page, idx) =>
              page === '...' ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted-foreground">
                  ...
                </span>
              ) : (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'h-7 w-7 p-0 text-xs',
                    currentPage === page && 'pointer-events-none'
                  )}
                  onClick={() => goToPage(page as number)}
                >
                  {page}
                </Button>
              )
            )}
          </div>

          {/* 다음 페이지 */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            title="다음 페이지"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* 마지막 페이지 */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            title="마지막 페이지"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * 표시할 페이지 번호 배열 생성
 * 예: [1, 2, 3, '...', 10] 또는 [1, '...', 4, 5, 6, '...', 10]
 */
function generatePageNumbers(
  currentPage: number,
  totalPages: number
): (number | '...')[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];

  // 항상 첫 페이지 표시
  pages.push(1);

  // 현재 페이지 주변
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  // 첫 페이지와 start 사이에 간격이 있으면 ...
  if (start > 2) {
    pages.push('...');
  }

  // 중간 페이지들
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  // end와 마지막 페이지 사이에 간격이 있으면 ...
  if (end < totalPages - 1) {
    pages.push('...');
  }

  // 항상 마지막 페이지 표시
  pages.push(totalPages);

  return pages;
}
