'use server';

import { sendAlimtalkBulk, type AligoButton } from '@/services/alimtalk.service';

interface BulkSendParams {
  templateCode: string;
  message: string;
  recipients: Array<{
    phone: string;
    name?: string;
  }>;
  buttons?: AligoButton[];
  /** true면 ALIGO_TEST_MODE 환경변수 무시하고 실제 발송 */
  forceRealSend?: boolean;
}

interface BulkSendResult {
  successCount: number;
  failCount: number;
  testMode: boolean;
  results: Array<{
    phone: string;
    success: boolean;
    error?: string;
  }>;
}

/**
 * 알림톡 다중 발송 Server Action
 * 개발/테스트 환경에서 실제 알림톡 발송 테스트용
 */
export async function sendBulkAlimtalkAction(
  params: BulkSendParams
): Promise<BulkSendResult> {
  // 프로덕션 환경 체크 (명시적 허용이 없으면 차단)
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_TEST_SEND !== 'true'
  ) {
    throw new Error('테스트 발송은 개발 환경에서만 사용 가능합니다.');
  }

  // 각 수신자에게 동일한 메시지 적용
  const result = await sendAlimtalkBulk({
    templateCode: params.templateCode,
    recipients: params.recipients.map((r) => ({
      phone: r.phone.replace(/[^0-9]/g, ''), // 숫자만 추출
      name: r.name,
      message: params.message,
    })),
    buttons: params.buttons,
    forceRealSend: params.forceRealSend,
  });

  if (!result.success || !result.data) {
    return {
      successCount: 0,
      failCount: params.recipients.length,
      testMode: false,
      results: params.recipients.map((r) => ({
        phone: r.phone,
        success: false,
        error: result.error?.message || '알 수 없는 오류',
      })),
    };
  }

  return {
    successCount: result.data.successCount,
    failCount: result.data.failCount,
    testMode: result.data.testMode,
    results: result.data.results,
  };
}
