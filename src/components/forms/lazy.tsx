/**
 * Lazy-loaded form components
 *
 * 폼 컴포넌트들의 lazy loading을 위한 배럴 파일입니다.
 * next/dynamic을 사용하여 초기 번들 크기를 줄입니다.
 *
 * 사용 예:
 * import { LazyTreatmentForm } from '@/components/forms/lazy';
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading
 */

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * 폼 로딩 스켈레톤 컴포넌트
 * 3-column 레이아웃에 맞춘 스켈레톤 UI
 */
function FormSkeleton(): React.ReactElement {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 왼쪽: 제품 선택 영역 */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* 오른쪽: 장바구니 영역 */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Lazy-loaded TreatmentForm
 * 시술 폼 (병원용)
 *
 * Note: ssr: false 제거 - Server Component에서 사용 가능하도록 변경
 */
export const LazyTreatmentForm = dynamic(
  () => import('./TreatmentForm').then((mod) => ({ default: mod.TreatmentForm })),
  { loading: () => <FormSkeleton /> }
);

/**
 * Lazy-loaded DisposalForm
 * 폐기 폼 (병원용)
 *
 * Note: ssr: false 제거 - Server Component에서 사용 가능하도록 변경
 */
export const LazyDisposalForm = dynamic(
  () => import('./DisposalForm').then((mod) => ({ default: mod.DisposalForm })),
  { loading: () => <FormSkeleton /> }
);
