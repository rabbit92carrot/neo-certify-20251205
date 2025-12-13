/**
 * 회수 모니터링 페이지 로딩 UI
 */
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminRecallsLoading(): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* 페이지 헤더 스켈레톤 */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* 필터 영역 스켈레톤 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-28" />
          </div>
        </CardContent>
      </Card>

      {/* 테이블 카드 스켈레톤 */}
      <Card>
        <CardContent className="p-6">
          {/* 테이블 헤더 */}
          <div className="flex items-center gap-4 pb-4 border-b">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-28" />
          </div>
          {/* 테이블 로우 */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-4 border-b last:border-0">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
