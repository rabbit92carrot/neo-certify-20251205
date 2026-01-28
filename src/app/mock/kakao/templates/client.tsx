'use client';

import { AlimtalkTemplatePreview } from '@/components/mock/AlimtalkTemplatePreview';
import { simulateAlimtalkSend } from '../actions';

/**
 * 알림톡 템플릿 미리보기 클라이언트 래퍼
 * Server Action을 AlimtalkTemplatePreview에 연결
 */
export function AlimtalkTemplatesPageClient(): React.ReactElement {
  return (
    <AlimtalkTemplatePreview
      onSimulateSend={async (params) => {
        const result = await simulateAlimtalkSend(params);
        return result;
      }}
    />
  );
}
