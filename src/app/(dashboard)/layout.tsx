import { redirect } from 'next/navigation';
import { LOGIN_PATH, PENDING_PATH } from '@/constants/routes';
import { DashboardLayout as DashboardLayoutComponent } from '@/components/layout';
import { getCachedCurrentUser } from '@/services/auth.service';
import type { OrganizationType } from '@/constants';

/**
 * 대시보드 레이아웃
 * 인증된 사용자만 접근 가능한 페이지들의 공통 레이아웃
 * 사이드바, 헤더가 포함된 전체 레이아웃
 *
 * 최적화: getCachedCurrentUser() 사용으로 동일 요청 내 중복 DB 호출 방지
 * - 레이아웃에서 호출한 결과가 하위 페이지에서도 재사용됨
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  // 캐싱된 사용자 조회 (페이지에서 다시 호출해도 한 번만 실행)
  const currentUser = await getCachedCurrentUser();

  if (!currentUser) {
    redirect(LOGIN_PATH);
  }

  const { organization: org } = currentUser;

  // 상태 체크 (미들웨어에서도 체크하지만 이중 안전장치)
  if (org.status !== 'ACTIVE') {
    if (org.status === 'PENDING_APPROVAL') {
      redirect(PENDING_PATH);
    }
    redirect(LOGIN_PATH);
  }

  return (
    <DashboardLayoutComponent
      organizationType={org.type as OrganizationType}
      organizationName={org.name}
    >
      {children}
    </DashboardLayoutComponent>
  );
}
