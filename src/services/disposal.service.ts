/**
 * 폐기 서비스
 * 병원의 재고 폐기 등록 관련 비즈니스 로직
 *
 * 핵심 기능:
 * - FIFO 기반 가상 코드 자동 선택
 * - 폐기 사유 기록 (사전 정의 + 기타)
 * - 폐기 이력 저장
 * - 취소 불가 (즉시 확정)
 */

import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import type { ApiResponse } from '@/types/api.types';
import type { DisposalCreateData } from '@/lib/validations/disposal';
import {
  createErrorResponse,
  createSuccessResponse,
  parseRpcSingle,
} from './common.service';
import { DisposalAtomicResultSchema } from '@/lib/validations/rpc-schemas';

const logger = createLogger('disposal.service');

// ============================================================================
// 폐기 생성
// ============================================================================

/**
 * 폐기 생성 (원자적 DB 함수 사용)
 * FIFO 기반으로 가상 코드를 자동 선택하고 상태를 DISPOSED로 변경합니다.
 * 모든 작업이 단일 트랜잭션에서 실행되어 원자성을 보장합니다.
 * 병원 ID는 DB 함수 내에서 auth.uid()로부터 도출됩니다.
 *
 * @param data 폐기 데이터
 * @returns 생성된 폐기 기록
 */
export async function createDisposal(
  data: DisposalCreateData
): Promise<ApiResponse<{ disposalId: string; totalQuantity: number }>> {
  const supabase = await createClient();

  // 아이템 데이터 준비 (JSONB 형식)
  const items = data.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
  }));

  logger.debug('폐기 생성 요청', {
    disposalDate: data.disposalDate,
    reasonType: data.disposalReasonType,
    itemCount: items.length,
  });

  // 원자적 폐기 생성 DB 함수 호출
  // 병원 ID는 DB 함수 내에서 get_user_organization_id()로 도출됨
  const { data: result, error } = await supabase.rpc('create_disposal_atomic', {
    p_disposal_date: data.disposalDate,
    p_disposal_reason_type: data.disposalReasonType,
    p_disposal_reason_custom: data.disposalReasonCustom ?? null,
    p_items: items,
  });

  if (error) {
    logger.error('폐기 생성 RPC 호출 실패', error);
    return createErrorResponse('DISPOSAL_CREATE_FAILED', '폐기 등록에 실패했습니다.');
  }

  // 결과 파싱 및 검증
  const parsed = parseRpcSingle(DisposalAtomicResultSchema, result, 'create_disposal_atomic');
  if (!parsed.success) {
    logger.error('폐기 결과 파싱 실패', { error: parsed.error });
    return createErrorResponse('VALIDATION_ERROR', parsed.error);
  }

  const row = parsed.data;

  // DB 함수 내부 에러 확인
  if (row?.error_code) {
    logger.warn('폐기 생성 실패 (DB 에러)', {
      errorCode: row.error_code,
      errorMessage: row.error_message,
    });
    return createErrorResponse(row.error_code, row.error_message ?? '폐기 등록에 실패했습니다.');
  }

  if (!row?.disposal_id) {
    logger.error('폐기 ID가 반환되지 않음');
    return createErrorResponse('DISPOSAL_CREATE_FAILED', '폐기 등록에 실패했습니다.');
  }

  logger.info('폐기 생성 완료', {
    disposalId: row.disposal_id,
    totalQuantity: row.total_quantity,
  });

  return createSuccessResponse({
    disposalId: row.disposal_id,
    totalQuantity: row.total_quantity,
  });
}
