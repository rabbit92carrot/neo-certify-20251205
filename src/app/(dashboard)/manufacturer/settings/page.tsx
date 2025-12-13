import { getCachedCurrentUser } from '@/services/auth.service';
import { getManufacturerSettings } from '@/services/manufacturer-settings.service';
import { PageHeader } from '@/components/shared';
import { ManufacturerSettingsForm } from '@/components/forms/ManufacturerSettingsForm';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: '환경 설정 | 제조사',
  description: '제조사 환경 설정',
};

/**
 * 제조사 환경 설정 페이지
 */
export default async function SettingsPage(): Promise<React.ReactElement> {
  const user = await getCachedCurrentUser();

  if (user?.organization.type !== 'MANUFACTURER') {
    redirect('/login');
  }

  // 제조사 설정 조회
  const settingsResult = await getManufacturerSettings(user.organization.id);

  if (!settingsResult.success || !settingsResult.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="환경 설정"
          description="Lot 번호 생성 규칙 및 사용기한을 설정합니다."
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">설정 로드 실패</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              제조사 설정을 불러올 수 없습니다. 관리자에게 문의해주세요.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="환경 설정"
        description="Lot 번호 생성 규칙 및 사용기한을 설정합니다."
      />

      <ManufacturerSettingsForm settings={settingsResult.data} />
    </div>
  );
}
