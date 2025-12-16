/**
 * 환경 설정 페이지 로딩 UI
 * Lot 번호 설정 폼 레이아웃
 */
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function SettingsLoading(): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* 페이지 헤더 스켈레톤 */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Lot 번호 설정 카드 */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 접두어 */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-3 w-64" />
          </div>
          {/* 모델 코드 자릿수 */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          {/* 날짜 형식 */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full max-w-md" />
          </div>
          {/* Lot 번호 미리보기 */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <Skeleton className="h-3 w-28 mb-2" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-3 w-56 mt-2" />
          </div>

          <hr />

          {/* 사용기한 */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-3 w-52" />
          </div>
          {/* 저장 버튼 */}
          <Skeleton className="h-10 w-24" />
        </CardContent>
      </Card>
    </div>
  );
}
