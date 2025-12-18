import { PageHeader } from '@/components/shared/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="알림 보관함"
        description="비활성 제품 사용 알림 및 시스템 메시지를 확인합니다."
      />

      <div className="space-y-4">
        {/* 필터 스켈레톤 */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-[120px]" />
          <Skeleton className="h-10 w-[160px]" />
        </div>

        {/* 테이블 스켈레톤 */}
        <div className="rounded-md border">
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 flex-1" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
