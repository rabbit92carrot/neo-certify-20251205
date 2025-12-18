/**
 * 회수 모니터링 페이지 로딩 UI
 * 필터 + 카드 리스트 형태
 */
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

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
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-16" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-28" />
          </div>
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </CardContent>
      </Card>

      {/* 회수 이력 카드 리스트 */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-20 rounded-full" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-6 w-16 ml-auto" />
                  <Skeleton className="h-4 w-24 ml-auto" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* 회수 사유 */}
              <div className="p-3 bg-amber-50 rounded-lg">
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 페이지네이션 스켈레톤 */}
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10 w-10" />
        ))}
      </div>
    </div>
  );
}
