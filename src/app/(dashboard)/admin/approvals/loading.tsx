/**
 * 가입 승인 페이지 로딩 UI
 */
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminApprovalsLoading(): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* 페이지 헤더 스켈레톤 */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* 테이블 카드 스켈레톤 */}
      <Card>
        <CardContent className="p-6">
          {/* 테이블 헤더 */}
          <div className="flex items-center gap-4 pb-4 border-b">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          {/* 테이블 로우 */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-4 border-b last:border-0">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-20 rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
