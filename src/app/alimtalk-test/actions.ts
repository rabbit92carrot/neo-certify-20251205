'use server';

import { sendAlimtalkBulk, type AligoButton } from '@/services/alimtalk.service';

/**
 * 알림톡 테스트 페이지 비밀번호 검증
 * ALIMTALK_TEST_PASSWORD 환경 변수와 비교
 */
export async function verifyTestPasswordAction(
  password: string
): Promise<{ success: boolean; error?: string }> {
  const correctPassword = process.env.ALIMTALK_TEST_PASSWORD;

  if (!correctPassword) {
    return {
      success: false,
      error: '테스트 비밀번호가 설정되지 않았습니다. 관리자에게 문의하세요.',
    };
  }

  if (password !== correctPassword) {
    return {
      success: false,
      error: '비밀번호가 올바르지 않습니다.',
    };
  }

  return { success: true };
}

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
 * 비밀번호 검증 후 사용 가능 (클라이언트에서 세션 체크)
 */
export async function sendBulkAlimtalkAction(
  params: BulkSendParams
): Promise<BulkSendResult> {
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
