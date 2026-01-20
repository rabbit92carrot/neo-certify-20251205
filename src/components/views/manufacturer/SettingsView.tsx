'use client';

/**
 * 설정 View 컴포넌트
 * Manufacturer 설정 페이지 뷰 (props 기반)
 */

import { PageHeader } from '@/components/shared/PageHeader';
import { ManufacturerSettingsForm } from '@/components/forms/ManufacturerSettingsForm';
import type { ManufacturerSettings } from '@/types/api.types';

export interface ManufacturerSettingsViewProps {
  /** 현재 설정 값 */
  settings: ManufacturerSettings;
}

export function ManufacturerSettingsView({
  settings,
}: ManufacturerSettingsViewProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <PageHeader
        title="설정"
        description="Lot 번호 생성 규칙 및 사용기한을 설정합니다."
      />
      <ManufacturerSettingsForm settings={settings} />
    </div>
  );
}
