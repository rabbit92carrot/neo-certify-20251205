/**
 * 빈 상태 컴포넌트
 * 데이터가 없을 때 표시합니다.
 */

import { Inbox, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /** 아이콘 */
  icon?: LucideIcon;
  /** 제목 */
  title?: string;
  /** 설명 */
  description?: string;
  /** 액션 버튼 (선택) */
  action?: React.ReactNode;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 빈 상태 컴포넌트
 */
export function EmptyState({
  icon: Icon = Inbox,
  title = '데이터가 없습니다',
  description,
  action,
  className,
}: EmptyStateProps): React.ReactElement {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="rounded-full bg-gray-100 p-4 mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-sm mb-4">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
