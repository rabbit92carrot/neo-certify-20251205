import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LOGIN_PATH, PENDING_PATH } from '@/constants/routes';
import { DashboardLayout as DashboardLayoutComponent } from '@/components/layout';
import type { OrganizationType } from '@/constants';

/**
 * 대시보드 레이아웃
 * 인증된 사용자만 접근 가능한 페이지들의 공통 레이아웃
 * 사이드바, 헤더가 포함된 전체 레이아웃
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const supabase = await createClient();

  // 사용자 인증 체크
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(LOGIN_PATH);
  }

  // 조직 정보 조회
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  if (!org) {
    // 조직 정보가 없으면 로그아웃 처리
    await supabase.auth.signOut();
    redirect(LOGIN_PATH);
  }

  // 상태 체크
  if (org.status !== 'ACTIVE') {
    if (org.status === 'PENDING_APPROVAL') {
      redirect(PENDING_PATH);
    }
    // INACTIVE, DELETED 상태는 로그인 페이지로
    await supabase.auth.signOut();
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
