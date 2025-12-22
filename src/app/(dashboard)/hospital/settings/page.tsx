import { redirect } from 'next/navigation';
import { getCachedCurrentUser } from '@/services/auth.service';
import { PageHeader } from '@/components/shared';
import { HospitalProductSettingsForm } from '@/components/forms/HospitalProductSettingsForm';

export const metadata = {
  title: '제품 관리 | 병원',
  description: '병원 제품 별칭 및 활성화 설정',
};

/**
 * 병원 제품 관리 페이지
 *
 * 기능:
 * - 입고받은 제품 목록 조회
 * - 제품 별칭 설정/삭제
 * - 제품 활성화/비활성화 (비활성 시 시술 등록에서 숨김)
 */
export default async function HospitalSettingsPage(): Promise<React.ReactElement> {
  const user = await getCachedCurrentUser();

  if (user?.organization.type !== 'HOSPITAL') {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="제품 관리"
        description="입고받은 제품의 별칭을 설정하고, 시술 등록에서의 표시 여부를 관리합니다."
      />

      <HospitalProductSettingsForm />
    </div>
  );
}
