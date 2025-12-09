/**
 * 페이지 헤더 컴포넌트
 * 페이지 상단에 제목과 설명, 액션 버튼을 표시합니다.
 */

import { cn } from '@/lib/utils';

interface PageHeaderProps {
  /** 페이지 제목 */
  title: string;
  /** 페이지 설명 (선택) */
  description?: string;
  /** 액션 버튼 영역 (선택) */
  actions?: React.ReactNode;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 페이지 헤더 컴포넌트
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps): React.ReactElement {
  return (
    <div className={cn('flex flex-col gap-4 md:flex-row md:items-center md:justify-between', className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
