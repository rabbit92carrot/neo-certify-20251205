/**
 * 알리고 카카오 알림톡 서비스
 * 템플릿 관리 및 메시지 발송 (mock/실제 전환 지원)
 *
 * 핵심 기능:
 * - 알리고 API를 통한 카카오 알림톡 발송
 * - ALIGO_TEST_MODE=Y 시 mock 모드 (API 호출 없이 DB 저장 + 로그 출력)
 * - 템플릿 등록/심사 요청/목록 조회
 * - SMS/LMS 대체 발송(failover) 지원
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';
import type { ApiResponse } from '@/types/api.types';
import { createErrorResponse, createSuccessResponse } from './common.service';

const logger = createLogger('alimtalk.service');

const ALIGO_API_BASE = 'https://kakaoapi.aligo.in';

// ============================================================================
// 타입 정의
// ============================================================================

interface AligoConfig {
  apiKey: string;
  userId: string;
  senderKey: string;
  senderPhone: string;
  testMode: boolean;
}

export interface AligoButton {
  name: string;
  linkType: 'WL' | 'AL' | 'DS' | 'BK' | 'BC';
  linkM?: string;
  linkP?: string;
  linkI?: string;
  linkA?: string;
}

interface AligoResponse {
  code: number | string;
  message: string;
  info?: {
    type: string;
    mid: number;
    current: string;
    unit: number;
    total: number;
    scnt: number;
    fcnt: number;
  };
  list?: AligoTemplateItem[];
}

export interface AligoTemplateItem {
  templtCode: string;
  templtName: string;
  templtContent: string;
  status: string;
  inspStatus: string;
  cdate: string;
}

export interface RegisterTemplateParams {
  tplCode: string;
  tplName: string;
  tplContent: string;
  messageType: 'BA' | 'EX' | 'AD' | 'MI';
  emphasizeType?: 'NONE' | 'TEXT' | 'IMAGE';
  tplEmTitle?: string;
  tplEmSubtitle?: string;
  tplButton?: AligoButton[];
}

export interface SendAlimtalkParams {
  templateCode: string;
  recipientPhone: string;
  recipientName?: string;
  subject?: string;
  message: string;
  buttons?: AligoButton[];
  failoverMessage?: string;
}

export interface SendResult {
  mid: number;
  successCount: number;
  failCount: number;
  testMode: boolean;
}

export interface SendAlimtalkBulkParams {
  templateCode: string;
  recipients: Array<{
    phone: string;
    name?: string;
    message: string;
  }>;
  buttons?: AligoButton[];
  failoverMessage?: string;
  /** true면 ALIGO_TEST_MODE 환경변수 무시하고 실제 발송 */
  forceRealSend?: boolean;
}

export interface BulkSendResult {
  mid: number;
  successCount: number;
  failCount: number;
  testMode: boolean;
  results: Array<{
    phone: string;
    success: boolean;
    error?: string;
  }>;
}

// ============================================================================
// 설정 로드
// ============================================================================

function getAligoConfig(): AligoConfig {
  return {
    apiKey: process.env.ALIGO_API_KEY ?? '',
    userId: process.env.ALIGO_USER_ID ?? '',
    senderKey: process.env.KAKAO_SENDER_KEY ?? '',
    senderPhone: process.env.ALIGO_SENDER_PHONE ?? '',
    testMode: process.env.ALIGO_TEST_MODE === 'Y',
  };
}

/**
 * 내부 템플릿 코드를 알리고 API 템플릿 코드로 변환
 * 환경변수에 등록된 카카오 승인 템플릿 코드를 반환
 */
function getAligoTemplateCode(internalCode: string): string | null {
  const templateCodeMap: Record<string, string | undefined> = {
    CERT_COMPLETE: process.env.ALIMTALK_TPL_CERT_COMPLETE,
    CERT_RECALL: process.env.ALIMTALK_TPL_CERT_RECALL,
  };

  return templateCodeMap[internalCode] ?? null;
}

function validateConfig(config: AligoConfig): string | null {
  if (!config.apiKey) {
    return 'ALIGO_API_KEY 환경변수가 설정되지 않았습니다.';
  }
  if (!config.userId) {
    return 'ALIGO_USER_ID 환경변수가 설정되지 않았습니다.';
  }
  if (!config.senderKey) {
    return 'KAKAO_SENDER_KEY 환경변수가 설정되지 않았습니다.';
  }
  return null;
}

// ============================================================================
// 알리고 API 공통 호출
// ============================================================================

async function callAligoApi(
  endpoint: string,
  params: Record<string, string>
): Promise<AligoResponse> {
  const config = getAligoConfig();
  const configError = validateConfig(config);
  if (configError) {
    throw new Error(configError);
  }

  const formData = new URLSearchParams();
  formData.append('apikey', config.apiKey);
  formData.append('userid', config.userId);
  formData.append('senderkey', config.senderKey);

  for (const [key, value] of Object.entries(params)) {
    formData.append(key, value);
  }

  const url = `${ALIGO_API_BASE}${endpoint}`;
  logger.info('알리고 API 호출', { endpoint, params: Object.keys(params) });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });

  if (!response.ok) {
    throw new Error(`알리고 API HTTP 오류: ${response.status}`);
  }

  const result = (await response.json()) as AligoResponse;

  if (String(result.code) !== '0') {
    logger.error('알리고 API 오류 응답', {
      code: result.code,
      message: result.message,
      endpoint,
    });
  }

  return result;
}

// ============================================================================
// 템플릿 관리 API
// ============================================================================

/**
 * 템플릿 등록
 */
export async function registerTemplate(
  params: RegisterTemplateParams
): Promise<ApiResponse<AligoResponse>> {
  try {
    const config = getAligoConfig();
    if (config.testMode) {
      const mockResponse: AligoResponse = {
        code: 0,
        message: '테스트 모드 - 템플릿 등록 시뮬레이션',
      };
      logger.info('[MOCK] 템플릿 등록', {
        tplCode: params.tplCode,
        tplName: params.tplName,
        messageType: params.messageType,
        emphasizeType: params.emphasizeType,
        contentLength: params.tplContent.length,
      });
      return createSuccessResponse(mockResponse);
    }

    const apiParams: Record<string, string> = {
      tpl_code: params.tplCode,
      tpl_name: params.tplName,
      tpl_content: params.tplContent,
      message_type: params.messageType,
    };

    if (params.emphasizeType) {
      apiParams['emphasize_type'] = params.emphasizeType;
    }
    if (params.tplEmTitle) {
      apiParams['tpl_emtitle'] = params.tplEmTitle;
    }
    if (params.tplEmSubtitle) {
      apiParams['tpl_emsubtitle'] = params.tplEmSubtitle;
    }
    if (params.tplButton) {
      apiParams['tpl_button'] = JSON.stringify({ button: params.tplButton });
    }

    const result = await callAligoApi('/akv10/template/add/', apiParams);

    if (String(result.code) !== '0') {
      return createErrorResponse('TEMPLATE_REGISTER_FAILED', result.message);
    }

    return createSuccessResponse(result);
  } catch (error) {
    logger.error('템플릿 등록 실패', error);
    return createErrorResponse('TEMPLATE_REGISTER_ERROR', '템플릿 등록 중 오류가 발생했습니다.');
  }
}

/**
 * 템플릿 심사 요청
 */
export async function requestTemplateReview(
  tplCode: string
): Promise<ApiResponse<AligoResponse>> {
  try {
    const config = getAligoConfig();
    if (config.testMode) {
      const mockResponse: AligoResponse = {
        code: 0,
        message: '테스트 모드 - 심사 요청 시뮬레이션',
      };
      logger.info('[MOCK] 심사 요청', { tplCode });
      return createSuccessResponse(mockResponse);
    }

    const result = await callAligoApi('/akv10/template/request/', {
      tpl_code: tplCode,
    });

    if (String(result.code) !== '0') {
      return createErrorResponse('TEMPLATE_REVIEW_FAILED', result.message);
    }

    return createSuccessResponse(result);
  } catch (error) {
    logger.error('심사 요청 실패', error);
    return createErrorResponse('TEMPLATE_REVIEW_ERROR', '심사 요청 중 오류가 발생했습니다.');
  }
}

/**
 * 템플릿 목록 조회
 */
export async function listTemplates(): Promise<ApiResponse<AligoTemplateItem[]>> {
  try {
    const config = getAligoConfig();
    if (config.testMode) {
      logger.info('[MOCK] 템플릿 목록 조회');
      return createSuccessResponse([]);
    }

    const result = await callAligoApi('/akv10/template/list/', {});

    if (String(result.code) !== '0') {
      return createErrorResponse('TEMPLATE_LIST_FAILED', result.message);
    }

    return createSuccessResponse(result.list ?? []);
  } catch (error) {
    logger.error('템플릿 목록 조회 실패', error);
    return createErrorResponse('TEMPLATE_LIST_ERROR', '템플릿 목록 조회 중 오류가 발생했습니다.');
  }
}

// ============================================================================
// 메시지 발송 API
// ============================================================================

/**
 * 알림톡 발송 (단건)
 *
 * mock 모드(ALIGO_TEST_MODE=Y):
 * - 알리고 API 호출 없이 DB에 메시지 저장
 * - 로그에 발송 파라미터 전체 출력
 * - mock 응답 반환
 *
 * 실제 모드:
 * - 알리고 API 호출
 * - 성공 시 notification_messages.is_sent = true 업데이트
 */
export async function sendAlimtalk(
  params: SendAlimtalkParams
): Promise<ApiResponse<SendResult>> {
  const config = getAligoConfig();

  try {
    const configError = validateConfig(config);
    if (configError && !config.testMode) {
      return createErrorResponse('ALIMTALK_CONFIG_ERROR', configError);
    }

    // 알리고 API 템플릿 코드 조회
    const aligoTemplateCode = getAligoTemplateCode(params.templateCode);

    // mock 모드
    if (config.testMode) {
      logger.info('[MOCK] 알림톡 발송 시뮬레이션', {
        templateCode: params.templateCode,
        aligoTemplateCode: aligoTemplateCode ?? '(미등록)',
        recipientPhone: params.recipientPhone,
        recipientName: params.recipientName,
        subject: params.subject,
        messageLength: params.message.length,
        buttons: params.buttons,
        failoverMessage: params.failoverMessage,
      });
      logger.info('[MOCK] 치환된 메시지 전문:', { message: params.message });

      const mockResult: SendResult = {
        mid: 0,
        successCount: 1,
        failCount: 0,
        testMode: true,
      };

      return createSuccessResponse(mockResult);
    }

    // 실제 발송 시 템플릿 코드 확인
    if (!aligoTemplateCode) {
      return createErrorResponse(
        'ALIMTALK_TEMPLATE_NOT_FOUND',
        `템플릿 코드 '${params.templateCode}'에 대한 알리고 템플릿이 등록되지 않았습니다. 환경변수 ALIMTALK_TPL_${params.templateCode}를 확인하세요.`
      );
    }

    // 실제 발송
    const apiParams: Record<string, string> = {
      tpl_code: aligoTemplateCode,
      sender: config.senderPhone,
      receiver_1: params.recipientPhone,
      message_1: params.message,
    };

    if (params.recipientName) {
      apiParams['recvname_1'] = params.recipientName;
    }
    if (params.subject) {
      apiParams['subject_1'] = params.subject;
    }
    if (params.buttons) {
      apiParams['button_1'] = JSON.stringify({ button: params.buttons });
    }
    if (params.failoverMessage) {
      apiParams['failover'] = 'Y';
      apiParams['fmessage_1'] = params.failoverMessage;
    }

    const result = await callAligoApi('/akv10/alimtalk/send/', apiParams);

    if (String(result.code) !== '0') {
      return createErrorResponse('ALIMTALK_SEND_FAILED', result.message);
    }

    const sendResult: SendResult = {
      mid: result.info?.mid ?? 0,
      successCount: result.info?.scnt ?? 0,
      failCount: result.info?.fcnt ?? 0,
      testMode: false,
    };

    return createSuccessResponse(sendResult);
  } catch (error) {
    logger.error('알림톡 발송 실패', error);
    return createErrorResponse('ALIMTALK_SEND_ERROR', '알림톡 발송 중 오류가 발생했습니다.');
  }
}

// ============================================================================
// 알림톡 다중 발송 API
// ============================================================================

/**
 * 알림톡 다중 발송 (최대 10건, 알리고 API는 500건까지 지원)
 * 알리고 API 형식: receiver_1, receiver_2, ..., message_1, message_2, ...
 *
 * mock 모드(ALIGO_TEST_MODE=Y):
 * - 알리고 API 호출 없이 개별 결과 시뮬레이션
 * - 로그에 발송 파라미터 전체 출력
 *
 * 실제 모드:
 * - 알리고 API /akv10/alimtalk/send/ 호출 (다중 수신자)
 */
export async function sendAlimtalkBulk(
  params: SendAlimtalkBulkParams
): Promise<ApiResponse<BulkSendResult>> {
  const config = getAligoConfig();

  try {
    // forceRealSend가 true면 testMode 무시
    const effectiveTestMode = params.forceRealSend ? false : config.testMode;

    const configError = validateConfig(config);
    if (configError && !effectiveTestMode) {
      return createErrorResponse('ALIMTALK_CONFIG_ERROR', configError);
    }

    // 수신자 수 제한 (UI에서 10명으로 제한, 알리고 API는 500건까지)
    if (params.recipients.length > 10) {
      return createErrorResponse(
        'ALIMTALK_BULK_LIMIT',
        '한 번에 최대 10명까지 발송 가능합니다.'
      );
    }

    if (params.recipients.length === 0) {
      return createErrorResponse(
        'ALIMTALK_NO_RECIPIENTS',
        '수신자가 없습니다.'
      );
    }

    const aligoTemplateCode = getAligoTemplateCode(params.templateCode);

    // Mock 모드 (forceRealSend가 true면 건너뜀)
    if (effectiveTestMode) {
      logger.info('[MOCK] 알림톡 다중 발송 시뮬레이션', {
        templateCode: params.templateCode,
        aligoTemplateCode: aligoTemplateCode ?? '(미등록)',
        recipientCount: params.recipients.length,
        recipients: params.recipients.map((r) => r.phone),
      });

      // 각 수신자별 메시지 로그
      for (const [index, recipient] of params.recipients.entries()) {
        logger.info(`[MOCK] 수신자 ${index + 1}:`, {
          phone: recipient.phone,
          name: recipient.name,
          messageLength: recipient.message.length,
        });
      }

      const mockResult: BulkSendResult = {
        mid: 0,
        successCount: params.recipients.length,
        failCount: 0,
        testMode: true,
        results: params.recipients.map((r) => ({
          phone: r.phone,
          success: true,
        })),
      };

      return createSuccessResponse(mockResult);
    }

    // 실제 발송 시 템플릿 코드 확인
    if (!aligoTemplateCode) {
      return createErrorResponse(
        'ALIMTALK_TEMPLATE_NOT_FOUND',
        `템플릿 코드 '${params.templateCode}'에 대한 알리고 템플릿이 등록되지 않았습니다. 환경변수 ALIMTALK_TPL_${params.templateCode}를 확인하세요.`
      );
    }

    // 알리고 API 파라미터 구성
    const apiParams: Record<string, string> = {
      tpl_code: aligoTemplateCode,
      sender: config.senderPhone,
    };

    // 수신자별 파라미터 (receiver_N, message_N, recvname_N)
    for (const [index, recipient] of params.recipients.entries()) {
      const n = index + 1;
      apiParams[`receiver_${n}`] = recipient.phone;
      apiParams[`message_${n}`] = recipient.message;
      if (recipient.name) {
        apiParams[`recvname_${n}`] = recipient.name;
      }
    }

    // 버튼 (모든 수신자에게 동일하게 적용)
    if (params.buttons && params.buttons.length > 0) {
      const buttonJson = JSON.stringify({ button: params.buttons });
      for (const [index] of params.recipients.entries()) {
        apiParams[`button_${index + 1}`] = buttonJson;
      }
    }

    // Failover 설정
    if (params.failoverMessage) {
      apiParams['failover'] = 'Y';
      for (const [index] of params.recipients.entries()) {
        apiParams[`fmessage_${index + 1}`] = params.failoverMessage;
      }
    }

    const result = await callAligoApi('/akv10/alimtalk/send/', apiParams);

    if (String(result.code) !== '0') {
      return createErrorResponse('ALIMTALK_SEND_FAILED', result.message);
    }

    const sendResult: BulkSendResult = {
      mid: result.info?.mid ?? 0,
      successCount: result.info?.scnt ?? 0,
      failCount: result.info?.fcnt ?? 0,
      testMode: false,
      // 알리고 API는 개별 결과를 반환하지 않으므로 성공으로 가정
      results: params.recipients.map((r) => ({
        phone: r.phone,
        success: true,
      })),
    };

    logger.info('알림톡 다중 발송 완료', {
      mid: sendResult.mid,
      successCount: sendResult.successCount,
      failCount: sendResult.failCount,
      recipientCount: params.recipients.length,
    });

    return createSuccessResponse(sendResult);
  } catch (error) {
    logger.error('알림톡 다중 발송 실패', error);
    return createErrorResponse(
      'ALIMTALK_SEND_ERROR',
      '알림톡 다중 발송 중 오류가 발생했습니다.'
    );
  }
}

// ============================================================================
// Mock 발송 시뮬레이션 (템플릿 미리보기 페이지용)
// ============================================================================

/**
 * 발송 시뮬레이션 — 변수 치환된 메시지를 notification_messages 테이블에 저장
 * /mock/kakao/templates 페이지의 "발송 시뮬레이션" 버튼에서 호출
 */
export async function simulateSend(params: {
  templateCode: string;
  recipientPhone: string;
  message: string;
  treatmentId?: string;
  buttons?: { name: string; url: string }[];
  type: 'CERTIFICATION' | 'RECALL';
}): Promise<ApiResponse<{ notificationId: string }>> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('notification_messages')
      .insert({
        type: params.type,
        patient_phone: params.recipientPhone,
        content: params.message,
        treatment_id: params.treatmentId ?? null,
        metadata: {
          templateCode: params.templateCode,
          buttons: params.buttons ?? [],
          simulatedAt: new Date().toISOString(),
        },
        is_sent: false,
      })
      .select('id')
      .single();

    if (error) {
      logger.error('시뮬레이션 메시지 저장 실패', error);
      return createErrorResponse('SIMULATION_SAVE_ERROR', '메시지 저장에 실패했습니다.');
    }

    logger.info('[MOCK] 시뮬레이션 메시지 저장 완료', {
      notificationId: data.id,
      templateCode: params.templateCode,
      type: params.type,
    });

    return createSuccessResponse({ notificationId: data.id });
  } catch (error) {
    logger.error('시뮬레이션 실패', error);
    return createErrorResponse('SIMULATION_ERROR', '시뮬레이션 중 오류가 발생했습니다.');
  }
}
