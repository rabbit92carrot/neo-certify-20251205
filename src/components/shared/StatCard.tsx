/**
 * 통계 카드 컴포넌트
 * 대시보드에서 주요 통계를 표시합니다.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  /** 통계 제목 */
  title: string;
  /** 통계 값 */
  value: string | number;
  /** 아이콘 */
  icon?: LucideIcon;
  /** 설명 (선택) */
  description?: string;
  /** 트렌드 (양수: 증가, 음수: 감소) */
  trend?: number;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 통계 카드 컴포넌트
 */
export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  isLoading = false,
  className,
}: StatCardProps): React.ReactElement {
  if (isLoading) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        {Icon && (
          <div className="rounded-md bg-gray-100 p-2">
            <Icon className="h-5 w-5 text-gray-600" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend !== undefined) && (
          <p className="text-xs text-gray-500 mt-1">
            {trend !== undefined && (
              <span className={cn('mr-1', trend >= 0 ? 'text-green-600' : 'text-red-600')}>
                {trend >= 0 ? '+' : ''}
                {trend}%
              </span>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
