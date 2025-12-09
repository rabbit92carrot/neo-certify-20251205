/**
 * 로딩 스피너 컴포넌트
 * 로딩 상태를 표시합니다.
 */

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  /** 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 텍스트 (선택) */
  text?: string;
  /** 추가 클래스 */
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

/**
 * 로딩 스피너 컴포넌트
 */
export function LoadingSpinner({
  size = 'md',
  text,
  className,
}: LoadingSpinnerProps): React.ReactElement {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-blue-600', sizeClasses[size])} />
      {text && <span className="text-sm text-gray-500">{text}</span>}
    </div>
  );
}

/**
 * 페이지 전체 로딩 컴포넌트
 */
export function PageLoading(): React.ReactElement {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" text="로딩 중..." />
    </div>
  );
}
