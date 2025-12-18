/**
 * 생산 등록 페이지 로딩 UI
 * E안: 2열 레이아웃 (좌: 아코디언 제품 선택, 우: 생산 정보 폼)
 */
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function ProductionLoading(): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* 페이지 헤더 스켈레톤 */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* E안: 2열 레이아웃 */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 좌측: 아코디언 제품 선택 영역 */}
        <div className="flex-1 lg:max-w-[60%]">
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 검색 입력 */}
              <Skeleton className="h-10 w-full" />

              {/* 아코디언 그룹 */}
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border rounded-lg px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-5 w-8 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>

              {/* 전체 그룹 수 */}
              <div className="text-center pt-2 border-t">
                <Skeleton className="h-3 w-32 mx-auto" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 우측: 생산 정보 폼 */}
        <div className="lg:w-[40%]">
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 수량 입력 */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-3 w-48" />
              </div>
              {/* 생산일자 */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              {/* 사용기한 */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-3 w-56" />
              </div>
              {/* 제출 버튼 */}
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
