'use client';

/**
 * 대시보드 에러 경계 컴포넌트
 * 대시보드 영역에서 발생하는 에러를 처리합니다.
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
      <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-lg font-semibold mb-2">페이지 로드 중 오류 발생</h2>
      <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
        데이터를 불러오는 중 문제가 발생했습니다.
      </p>
      <Button onClick={reset} variant="outline">
        다시 시도
      </Button>
    </div>
  );
}
