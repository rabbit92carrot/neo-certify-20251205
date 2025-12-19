'use client';

/**
 * 전역 에러 경계 컴포넌트
 * 런타임 에러 발생 시 사용자에게 피드백을 제공하고 복구 옵션을 제공합니다.
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러 로깅 서비스에 전송 (향후 Sentry 등 연동)
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-xl font-semibold mb-4">문제가 발생했습니다</h2>
      <p className="text-muted-foreground mb-6 text-center">
        예상치 못한 오류가 발생했습니다. 다시 시도해 주세요.
      </p>
      <Button onClick={reset}>다시 시도</Button>
    </div>
  );
}
