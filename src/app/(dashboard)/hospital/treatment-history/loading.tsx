/**
 * 시술 이력 페이지 로딩 UI
 * 카드 리스트 형태 (TreatmentHistoryTable)
 */
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function TreatmentHistoryLoading(): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* 페이지 헤더 스켈레톤 */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* 시술 이력 카드 리스트 */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-6 w-16 ml-auto" />
                  <Skeleton className="h-5 w-20 rounded-full ml-auto" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* 환자 정보 */}
              <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-28" />
              </div>
              {/* 제품 정보 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
              </div>
              {/* 회수 버튼 영역 */}
              <div className="mt-3 pt-3 border-t">
                <Skeleton className="h-8 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
