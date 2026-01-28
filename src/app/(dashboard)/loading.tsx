/**
 * 대시보드 전역 로딩 UI
 * 페이지 전환 시 즉시 표시되어 체감 속도 개선
 */
import { PageLoading } from '@/components/shared/LoadingSpinner';

export default function DashboardLoading(): React.ReactElement {
  return <PageLoading />;
}
