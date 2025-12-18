/**
 * 병원 거래 이력 페이지 로딩 UI
 * 카드 리스트 형태 (TransactionHistoryTable)
 */
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function HistoryLoading(): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* 페이지 헤더 스켈레톤 */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* 거래 이력 카드 리스트 */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* 액션 아이콘 */}
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                {/* 수량 */}
                <div className="text-right space-y-1">
                  <Skeleton className="h-6 w-16 ml-auto" />
                  <Skeleton className="h-3 w-12 ml-auto" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* 거래 당사자 표시 */}
              <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
                <Skeleton className="h-3 w-3" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-3 w-3" />
                <Skeleton className="h-4 w-24" />
              </div>
              {/* 제품 목록 */}
              <div className="space-y-2">
                <div className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
