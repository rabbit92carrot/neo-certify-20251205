/**
 * Lot 서비스
 * Lot 생산 등록 및 조회 관련 비즈니스 로직
 *
 * Lot INSERT 시 DB 트리거(trg_lot_create_virtual_codes)가
 * 자동으로 가상 식별코드를 생성합니다.
 */

import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import type { ApiResponse, Lot, LotWithProduct, PaginatedResponse } from '@/types/api.types';
import type { LotCreateData, LotListQueryData } from '@/lib/validations/product';
import { CONFIG } from '@/constants';
import {
  createErrorResponse,
  createNotFoundResponse,
  createSuccessResponse,
  ERROR_CODES,
  parseRpcArray,
} from './common.service';
import { LotNumberResultSchema, UpsertLotResultSchema } from '@/lib/validations/rpc-schemas';

const logger = createLogger('lot.service');

/**
 * Lot 생산 등록
 * 동일한 제품+Lot번호가 있으면 수량을 추가하고, 없으면 새로 생성합니다.
 * DB 함수(upsert_lot)를 사용하여 atomic하게 처리합니다.
 *
 * @param organizationId 제조사 조직 ID
 * @param data Lot 생성 데이터
 * @returns 생성/업데이트된 Lot 정보
 */
export async function createLot(
  organizationId: string,
  data: LotCreateData
): Promise<ApiResponse<Lot & { isAddedToExisting?: boolean }>> {
  const supabase = await createClient();

  // 제품이 해당 제조사 소유이고 활성 상태인지 확인
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, model_name')
    .eq('id', data.productId)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .single();

  if (productError || !product) {
    return createErrorResponse('PRODUCT_NOT_FOUND', '유효한 제품을 선택해주세요.');
  }

  // Lot 번호 생성 (DB 함수 호출)
  const { data: lotNumberResult, error: lotNumberError } = await supabase.rpc(
    'generate_lot_number',
    {
      p_manufacturer_id: organizationId,
      p_model_name: product.model_name,
      p_manufacture_date: data.manufactureDate,
    }
  );

  if (lotNumberError) {
    logger.error('Lot 번호 생성 실패', lotNumberError);
    return createErrorResponse('LOT_NUMBER_GENERATION_FAILED', 'Lot 번호 생성에 실패했습니다.');
  }

  // Zod 검증으로 결과 파싱
  const lotNumberParsed = LotNumberResultSchema.safeParse(lotNumberResult);
  if (!lotNumberParsed.success) {
    logger.error('generate_lot_number 검증 실패', { error: lotNumberParsed.error });
    return createErrorResponse(ERROR_CODES.VALIDATION_ERROR, 'Lot 번호 형식이 올바르지 않습니다.');
  }

  const lotNumber = lotNumberParsed.data;

  // 사용기한 계산 (설정 기반 또는 직접 입력)
  const expiryDate = data.expiryDate || (await calculateExpiryDate(organizationId, data.manufactureDate));

  // upsert_lot DB 함수 호출 (동일 Lot 존재 시 수량 추가, 없으면 새로 생성)
  const { data: upsertResult, error: upsertError } = await supabase.rpc('upsert_lot', {
    p_product_id: data.productId,
    p_lot_number: lotNumber,
    p_quantity: data.quantity,
    p_manufacture_date: data.manufactureDate,
    p_expiry_date: expiryDate,
  });

  if (upsertError) {
    // 최대 수량 초과 에러 처리
    if (upsertError.message?.includes('exceeds maximum limit')) {
      return createErrorResponse('QUANTITY_LIMIT_EXCEEDED', '총 수량이 최대 한도(100,000개)를 초과합니다.');
    }

    logger.error('Lot 생성/업데이트 실패', upsertError);
    return createErrorResponse('CREATE_FAILED', 'Lot 생성에 실패했습니다.');
  }

  // Zod 검증으로 결과 파싱 (upsert_lot은 배열 반환)
  const upsertParsed = parseRpcArray(UpsertLotResultSchema, upsertResult, 'upsert_lot');
  if (!upsertParsed.success) {
    logger.error('upsert_lot 검증 실패', { error: upsertParsed.error });
    return createErrorResponse(ERROR_CODES.VALIDATION_ERROR, upsertParsed.error);
  }

  const result = upsertParsed.data[0];
  if (!result) {
    return createErrorResponse('CREATE_FAILED', 'Lot 생성 결과를 확인할 수 없습니다.');
  }

  // 생성/업데이트된 Lot 정보 조회
  const { data: lot, error: fetchError } = await supabase
    .from('lots')
    .select()
    .eq('id', result.lot_id)
    .single();

  if (fetchError || !lot) {
    return createErrorResponse('FETCH_FAILED', 'Lot 정보 조회에 실패했습니다.');
  }

  return createSuccessResponse({
    ...lot,
    isAddedToExisting: !result.is_new, // 기존 Lot에 추가된 경우 true
  });
}

/**
 * 사용기한 계산 (제조사 설정 기반)
 * 유효기간 N개월의 경우, 제조일 + N개월의 **하루 전**으로 계산
 * 예: 2024-01-15 + 24개월 = 2026-01-14 (2026-01-15의 하루 전)
 */
async function calculateExpiryDate(
  organizationId: string,
  manufactureDate: string
): Promise<string> {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from('manufacturer_settings')
    .select('expiry_months')
    .eq('organization_id', organizationId)
    .single();

  const expiryMonths = settings?.expiry_months ?? CONFIG.DEFAULT_EXPIRY_MONTHS;

  const date = new Date(manufactureDate);
  date.setMonth(date.getMonth() + expiryMonths);
  // 유효기간 만료일은 N개월 후의 하루 전
  date.setDate(date.getDate() - 1);

  const isoDate = date.toISOString().split('T')[0];
  return isoDate || manufactureDate;
}

/**
 * Lot 목록 조회 (제품별)
 *
 * @param organizationId 제조사 조직 ID
 * @param query 조회 옵션
 * @returns 페이지네이션된 Lot 목록
 */
export async function getLots(
  organizationId: string,
  query: LotListQueryData
): Promise<ApiResponse<PaginatedResponse<LotWithProduct>>> {
  const supabase = await createClient();
  const { productId, page = 1, pageSize = 20 } = query;
  const offset = (page - 1) * pageSize;

  let queryBuilder = supabase
    .from('lots')
    .select(
      `
      *,
      product:products!inner(*)
    `,
      { count: 'exact' }
    )
    .eq('product.organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (productId) {
    queryBuilder = queryBuilder.eq('product_id', productId);
  }

  const { data, count, error } = await queryBuilder.range(offset, offset + pageSize - 1);

  if (error) {
    return createErrorResponse(ERROR_CODES.QUERY_ERROR, error.message);
  }

  const total = count ?? 0;

  // Supabase 조인 쿼리 결과는 정확한 타입 추론이 어려워 타입 단언 사용
  return createSuccessResponse({
    items: (data ?? []) as LotWithProduct[],
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasMore: offset + pageSize < total,
    },
  });
}

/**
 * Lot 상세 조회
 *
 * @param organizationId 제조사 조직 ID
 * @param lotId Lot ID
 * @returns Lot 정보 (제품 정보 포함)
 */
export async function getLot(
  organizationId: string,
  lotId: string
): Promise<ApiResponse<LotWithProduct>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('lots')
    .select(
      `
      *,
      product:products!inner(*)
    `
    )
    .eq('id', lotId)
    .eq('product.organization_id', organizationId)
    .single();

  if (error) {
    return createNotFoundResponse('Lot을 찾을 수 없습니다.');
  }

  // Supabase 조인 쿼리 결과는 정확한 타입 추론이 어려워 타입 단언 사용
  return createSuccessResponse(data as LotWithProduct);
}

/**
 * 오늘 생산량 조회
 *
 * @param organizationId 제조사 조직 ID
 * @returns 오늘 생산된 총 수량
 */
export async function getTodayProduction(organizationId: string): Promise<number> {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('lots')
    .select('quantity, product:products!inner(organization_id)')
    .eq('product.organization_id', organizationId)
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`);

  if (!data) {
    return 0;
  }

  return data.reduce((sum, lot) => sum + lot.quantity, 0);
}
