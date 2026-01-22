'use client';

/**
 * 설정 View 컴포넌트
 * Hospital 제품 관리 페이지 뷰 (props 기반)
 */

import { PageHeader } from '@/components/shared/PageHeader';
import { HospitalProductSettingsForm } from '@/components/forms/HospitalProductSettingsForm';

export interface HospitalSettingsViewProps {
  /** Preview 모드 여부 */
  isPreview?: boolean;
}

export function HospitalSettingsView({
  isPreview,
}: HospitalSettingsViewProps = {}): React.ReactElement {
  return (
    <div className="space-y-6">
      <PageHeader
        title="제품 관리"
        description="입고받은 제품의 별칭을 설정하고, 시술 등록에서의 표시 여부를 관리합니다."
      />
      <HospitalProductSettingsForm isPreview={isPreview} />
    </div>
  );
}
