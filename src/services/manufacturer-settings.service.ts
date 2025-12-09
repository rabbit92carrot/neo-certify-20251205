/**
 * 제조사 설정 서비스
 * 제조사별 Lot 번호 생성 규칙 및 사용기한 설정 관리
 */

import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, ManufacturerSettings } from '@/types/api.types';

/**
 * 제조사 설정 수정 데이터 타입
 */
export interface ManufacturerSettingsUpdateData {
  lotPrefix: string;
  lotModelDigits: number;
  lotDateFormat: string;
  expiryMonths: number;
}

/**
 * 제조사 설정 조회
 *
 * @param organizationId 제조사 조직 ID
 * @returns 제조사 설정 정보
 */
export async function getManufacturerSettings(
  organizationId: string
): Promise<ApiResponse<ManufacturerSettings>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('manufacturer_settings')
    .select('*')
    .eq('organization_id', organizationId)
    .single();

  if (error) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: '제조사 설정을 찾을 수 없습니다.',
      },
    };
  }

  return { success: true, data };
}

/**
 * 제조사 설정 수정
 *
 * @param organizationId 제조사 조직 ID
 * @param data 수정할 설정 데이터
 * @returns 수정된 설정 정보
 */
export async function updateManufacturerSettings(
  organizationId: string,
  data: ManufacturerSettingsUpdateData
): Promise<ApiResponse<ManufacturerSettings>> {
  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from('manufacturer_settings')
    .update({
      lot_prefix: data.lotPrefix,
      lot_model_digits: data.lotModelDigits,
      lot_date_format: data.lotDateFormat,
      expiry_months: data.expiryMonths,
    })
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) {
    return {
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: '설정 저장에 실패했습니다.',
      },
    };
  }

  return { success: true, data: updated };
}

/**
 * 제조사 설정 생성 (조직 생성 시 호출)
 *
 * @param organizationId 제조사 조직 ID
 * @returns 생성된 설정 정보
 */
export async function createManufacturerSettings(
  organizationId: string
): Promise<ApiResponse<ManufacturerSettings>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('manufacturer_settings')
    .insert({
      organization_id: organizationId,
      // 기본값은 DB 스키마에서 설정됨
    })
    .select()
    .single();

  if (error) {
    return {
      success: false,
      error: {
        code: 'CREATE_FAILED',
        message: '제조사 설정 생성에 실패했습니다.',
      },
    };
  }

  return { success: true, data };
}
