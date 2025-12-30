/**
 * 인증 확인 서비스
 * 환자가 알림톡 버튼을 통해 인증코드를 확인할 수 있는 공개 페이지용 서비스
 *
 * 주의: 이 서비스는 공개 페이지에서 사용되므로 Admin Client를 사용하여 RLS를 우회합니다.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';
import type { ApiResponse } from '@/types/api.types';
import { createErrorResponse, createSuccessResponse } from './common.service';
import { ERROR_CODES } from '@/constants/errors';

const logger = createLogger('verification.service');

// ============================================================================
// 타입 정의
// ============================================================================

/**
 * 인증코드 정보
 */
export interface VerificationCode {
  /** 가상 코드 (NC-XXXXXXXX) */
  code: string;
  /** 제품명 */
  productName: string;
  /** 모델명 */
  modelName: string;
}

/**
 * 회수 정보
 */
export interface RecallInfo {
  /** 병원명 */
  hospitalName: string;
  /** 병원 연락처 */
  hospitalContact?: string;
  /** 회수 사유 */
  reason?: string;
  /** 회수일시 */
  recalledAt: string;
}

/**
 * 인증 확인 데이터
 */
export interface VerificationData {
  /** 시술 ID */
  treatmentId: string;
  /** 시술일 */
  treatmentDate: string;
  /** 병원명 */
  hospitalName: string;
  /** 인증코드 목록 */
  codes: VerificationCode[];
  /** 제품별 요약 */
  productSummary: { productName: string; quantity: number }[];
  /** 회수 여부 */
  isRecalled: boolean;
  /** 회수 정보 (회수된 경우) */
  recallInfo?: RecallInfo;
}

// ============================================================================
// 서비스 함수
// ============================================================================

/**
 * 시술 ID로 인증 확인 데이터 조회
 * 공개 페이지용 - Admin Client 사용
 *
 * @param treatmentId 시술 기록 ID
 * @returns 인증 확인 데이터
 */
export async function getVerificationData(
  treatmentId: string
): Promise<ApiResponse<VerificationData>> {
  try {
    const supabase = createAdminClient();

    // 1. 먼저 회수 여부 확인 (RECALL 메시지가 있는지)
    const { data: recallMessage } = await supabase
      .from('notification_messages')
      .select('created_at, metadata')
      .eq('treatment_id', treatmentId)
      .eq('type', 'RECALL')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // 2. 시술 기록 조회 (병원 정보 포함)
    const { data: treatment, error: treatmentError } = await supabase
      .from('treatment_records')
      .select(`
        id,
        treatment_date,
        hospital:organizations!treatment_records_hospital_id_fkey(name)
      `)
      .eq('id', treatmentId)
      .single();

    // 시술 기록이 없는 경우 (삭제됨)
    if (treatmentError || !treatment) {
      // 회수 메시지가 있으면 회수 안내 표시
      if (recallMessage) {
        const metadata = recallMessage.metadata as { hospitalContact?: string } | null;
        return createSuccessResponse({
          treatmentId,
          treatmentDate: '',
          hospitalName: '',
          codes: [],
          productSummary: [],
          isRecalled: true,
          recallInfo: {
            hospitalName: '(삭제됨)',
            hospitalContact: metadata?.hospitalContact,
            recalledAt: recallMessage.created_at,
          },
        });
      }

      // 회수 메시지도 없으면 진짜 없는 기록
      return createErrorResponse(
        ERROR_CODES.NOT_FOUND,
        '시술 기록을 찾을 수 없습니다.'
      );
    }

    // 3. 시술에 연결된 가상 코드 조회 (제품 정보 포함)
    const { data: details, error: detailsError } = await supabase
      .from('treatment_details')
      .select(`
        virtual_code:virtual_codes!inner(
          code,
          lot:lots!inner(
            product:products!inner(name, model_name)
          )
        )
      `)
      .eq('treatment_id', treatmentId);

    if (detailsError) {
      logger.error('인증 상세 정보 조회 실패', detailsError);
      return createErrorResponse(ERROR_CODES.SERVER_ERROR, '인증 정보 조회 중 오류가 발생했습니다.');
    }

    // 4. 데이터 변환
    const codes: VerificationCode[] = (details ?? []).map((detail) => {
      const vc = detail.virtual_code as {
        code: string;
        lot: { product: { name: string; model_name: string } };
      };
      return {
        code: vc.code,
        productName: vc.lot.product.name,
        modelName: vc.lot.product.model_name,
      };
    });

    // 5. 제품별 요약 생성
    const productMap = new Map<string, number>();
    for (const code of codes) {
      productMap.set(code.productName, (productMap.get(code.productName) ?? 0) + 1);
    }
    const productSummary = Array.from(productMap.entries()).map(
      ([productName, quantity]) => ({ productName, quantity })
    );

    const hospitalInfo = treatment.hospital as { name: string };

    // 6. 회수 여부 확인하여 결과 반환
    if (recallMessage) {
      const metadata = recallMessage.metadata as { hospitalContact?: string } | null;
      return createSuccessResponse({
        treatmentId: treatment.id,
        treatmentDate: treatment.treatment_date,
        hospitalName: hospitalInfo.name,
        codes,
        productSummary,
        isRecalled: true,
        recallInfo: {
          hospitalName: hospitalInfo.name,
          hospitalContact: metadata?.hospitalContact,
          recalledAt: recallMessage.created_at,
        },
      });
    }

    return createSuccessResponse({
      treatmentId: treatment.id,
      treatmentDate: treatment.treatment_date,
      hospitalName: hospitalInfo.name,
      codes,
      productSummary,
      isRecalled: false,
    });
  } catch (error) {
    logger.error('인증 데이터 조회 예외 발생', error);
    return createErrorResponse(ERROR_CODES.SERVER_ERROR, '서버 오류가 발생했습니다.');
  }
}
