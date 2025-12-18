/**
 * 병원 재고 조회 페이지 로딩 UI
 * 요약 + 제품별 카드 리스트 형태
 */
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader } from '@/components/ui/card';

export default function InventoryLoading(): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* 페이지 헤더 스켈레톤 */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* 재고 요약 */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="text-right space-y-1">
          <Skeleton className="h-8 w-24 ml-auto" />
          <Skeleton className="h-4 w-12 ml-auto" />
        </div>
      </div>

      {/* 제품별 카드 */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="cursor-pointer">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Skeleton className="h-6 w-6" />
                  <Skeleton className="h-5 w-5" />
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
