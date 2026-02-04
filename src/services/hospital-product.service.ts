/**
 * 병원 제품 관리 서비스
 *
 * 병원의 known products (입고받은 제품) 관리 기능을 제공합니다:
 * - known products 목록 조회 (검색, 필터링)
 * - 제품 별칭 설정/삭제
 * - 제품 활성화/비활성화
 * - 시술 등록용 활성 제품 조회
 */

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';
import type {
  ApiResponse,
  HospitalKnownProduct,
  ProductForTreatment,
  PaginatedResponse,
} from '@/types/api.types';
import {
  createSuccessResponse,
  createErrorResponse,
  handlePostgrestError,
} from './common.service';
import { parseRpcArray, parseRpcSingle } from './common.service';
import {
  HospitalKnownProductRowSchema,
  UpdateHospitalProductSettingsResultSchema,
  ActiveProductForTreatmentRowSchema,
} from '@/lib/validations/rpc-schemas';

const logger = createLogger('hospital-product.service');

// ============================================================================
// 타입 정의
// ============================================================================

/**
 * Known Products 조회 쿼리 파라미터
 */
export interface GetKnownProductsQuery {
  search?: string;
  aliasFilter?: 'with_alias' | 'without_alias';
  activeFilter?: boolean;
}

/**
 * 제품 설정 업데이트 파라미터
 */
export interface UpdateProductSettingsParams {
  alias?: string | null;
  isActive?: boolean;
}

// ============================================================================
// 병원 Known Products 조회
// ============================================================================

/**
 * 병원의 known products 목록 조회
 *
 * @param hospitalId - 병원 조직 ID
 * @param query - 검색/필터링 조건
 * @returns Known products 목록
 */
export async function getHospitalKnownProducts(
  hospitalId: string,
  query?: GetKnownProductsQuery
): Promise<ApiResponse<HospitalKnownProduct[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_hospital_known_products', {
    p_hospital_id: hospitalId,
    p_search: query?.search ?? undefined,
    p_alias_filter: query?.aliasFilter ?? undefined,
    p_active_filter: query?.activeFilter ?? undefined,
  });

  if (error) {
    logger.error('getHospitalKnownProducts 실패', error);
    return handlePostgrestError(error, '제품 목록 조회에 실패했습니다.');
  }

  // RPC 결과 검증
  const parsed = parseRpcArray(
    HospitalKnownProductRowSchema,
    data,
    'get_hospital_known_products'
  );

  if (!parsed.success) {
    logger.error('get_hospital_known_products 검증 실패', { error: parsed.error });
    return createErrorResponse('VALIDATION_ERROR', parsed.error);
  }

  // 결과 변환
  const products: HospitalKnownProduct[] = parsed.data.map((row) => ({
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    modelName: row.model_name ?? '',
    udiDi: row.udi_di ?? '',
    alias: row.alias,
    isActive: row.is_active,
    firstReceivedAt: row.first_received_at,
    currentInventory: row.current_inventory,
  }));

  return createSuccessResponse(products);
}

// ============================================================================
// 제품 설정 업데이트
// ============================================================================

/**
 * 제품 설정 업데이트 (별칭, 활성화 상태)
 *
 * @param hospitalId - 병원 조직 ID
 * @param productId - 제품 ID
 * @param settings - 업데이트할 설정 (별칭, 활성화)
 * @returns 업데이트 결과
 */
export async function updateHospitalProductSettings(
  hospitalId: string,
  productId: string,
  settings: UpdateProductSettingsParams
): Promise<ApiResponse<void>> {
  const supabase = await createClient();

  // alias: null → 빈 문자열('')로 변환 (RPC에서 빈 문자열을 NULL로 처리)
  // alias: undefined → RPC 파라미터 생략 (기존 값 유지)
  // alias: 'value' → 해당 값으로 업데이트
  const aliasParam = settings.alias === null ? '' : settings.alias;

  const { data, error } = await supabase.rpc('update_hospital_product_settings', {
    p_hospital_id: hospitalId,
    p_product_id: productId,
    p_alias: aliasParam,
    p_is_active: settings.isActive,
  });

  if (error) {
    logger.error('updateHospitalProductSettings 실패', error);
    return handlePostgrestError(error, '설정 저장에 실패했습니다.');
  }

  // RPC 결과 검증
  const parsed = parseRpcSingle(
    UpdateHospitalProductSettingsResultSchema,
    data,
    'update_hospital_product_settings'
  );

  if (!parsed.success) {
    logger.error('update_hospital_product_settings 검증 실패', { error: parsed.error });
    return createErrorResponse('VALIDATION_ERROR', parsed.error);
  }

  if (!parsed.data) {
    return createErrorResponse('VALIDATION_ERROR', '알 수 없는 오류');
  }

  // DB 함수 에러 응답 처리
  if (!parsed.data.success) {
    return createErrorResponse(
      parsed.data.error_code || 'UPDATE_FAILED',
      parsed.data.error_message || '설정 저장에 실패했습니다.'
    );
  }

  return createSuccessResponse(undefined);
}

// ============================================================================
// 별칭 중복 체크
// ============================================================================

/**
 * 별칭 중복 여부 확인
 *
 * @param hospitalId - 병원 조직 ID
 * @param alias - 확인할 별칭
 * @param excludeProductId - 중복 체크에서 제외할 제품 ID (수정 시)
 * @returns 중복 여부 (true = 중복)
 */
export async function checkAliasExists(
  hospitalId: string,
  alias: string,
  excludeProductId?: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('check_hospital_alias_duplicate', {
    p_hospital_id: hospitalId,
    p_alias: alias,
    p_exclude_product_id: excludeProductId ?? undefined,
  });

  if (error) {
    logger.error('checkAliasExists 실패', error);
    return false; // 에러 시 중복 아님으로 처리 (저장 시 DB 제약조건에서 잡힘)
  }

  return data === true;
}

// ============================================================================
// 시술 등록용 제품 조회
// ============================================================================

/**
 * 시술 등록용 활성 제품 목록 조회
 * - 재고가 있고 활성화된 제품만 반환
 * - 별칭 정보 포함
 *
 * @param hospitalId - 병원 조직 ID
 * @returns 시술 등록 가능한 제품 목록
 */
export async function getActiveProductsForTreatment(
  hospitalId: string
): Promise<ApiResponse<ProductForTreatment[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_active_products_for_treatment', {
    p_hospital_id: hospitalId,
  });

  if (error) {
    logger.error('getActiveProductsForTreatment 실패', error);
    return handlePostgrestError(error, '제품 목록 조회에 실패했습니다.');
  }

  // RPC 결과 검증
  const parsed = parseRpcArray(
    ActiveProductForTreatmentRowSchema,
    data,
    'get_active_products_for_treatment'
  );

  if (!parsed.success) {
    logger.error('get_active_products_for_treatment 검증 실패', { error: parsed.error });
    return createErrorResponse('VALIDATION_ERROR', parsed.error);
  }

  // 결과 변환
  const products: ProductForTreatment[] = parsed.data.map((row) => ({
    productId: row.product_id,
    productName: row.product_name,
    modelName: row.model_name ?? '',
    udiDi: row.udi_di ?? '',
    alias: row.alias,
    availableQuantity: row.available_quantity,
  }));

  return createSuccessResponse(products);
}

// ============================================================================
// 시술 등록용 제품 조회 (페이지네이션)
// ============================================================================

/**
 * 페이지네이션 조회 옵션
 */
export interface PaginatedProductsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

/**
 * 시술 등록용 활성 제품 목록 조회 (페이지네이션)
 * AllProductsDialog에서 사용됩니다.
 *
 * 내부적으로 getActiveProductsForTreatment를 호출하고
 * 검색 필터 및 페이지네이션을 적용합니다.
 *
 * @param hospitalId - 병원 조직 ID
 * @param query - 조회 옵션 (page, pageSize, search)
 * @returns 페이지네이션된 제품 목록
 */
export async function getActiveProductsForTreatmentPaginated(
  hospitalId: string,
  query: PaginatedProductsQuery
): Promise<ApiResponse<PaginatedResponse<ProductForTreatment>>> {
  const { page = 1, pageSize = 30, search } = query;

  // 기존 함수로 전체 목록 조회
  const result = await getActiveProductsForTreatment(hospitalId);
  if (!result.success || !result.data) {
    return createErrorResponse(
      result.error?.code ?? 'QUERY_ERROR',
      result.error?.message ?? '제품 목록 조회에 실패했습니다.'
    );
  }

  let products = result.data;

  // 검색 필터 (별칭, 제품명, 모델명)
  if (search) {
    const searchLower = search.toLowerCase();
    products = products.filter(
      (p) =>
        p.productName.toLowerCase().includes(searchLower) ||
        p.modelName.toLowerCase().includes(searchLower) ||
        (p.alias?.toLowerCase().includes(searchLower) ?? false)
    );
  }

  // 재고 내림차순 정렬
  products.sort((a, b) => b.availableQuantity - a.availableQuantity);

  // 페이지네이션 계산
  const total = products.length;
  const totalPages = Math.ceil(total / pageSize);
  const offset = (page - 1) * pageSize;
  const paginatedProducts = products.slice(offset, offset + pageSize);

  return createSuccessResponse({
    items: paginatedProducts,
    meta: {
      page,
      pageSize,
      total,
      totalPages,
      hasMore: offset + pageSize < total,
    },
  });
}

// ============================================================================
// 시술 등록용 제품 검색
// ============================================================================

/**
 * 시술 등록용 활성 제품 검색
 * 검색어와 즐겨찾기 ID를 기반으로 제품 목록을 반환합니다.
 *
 * @param hospitalId - 병원 조직 ID
 * @param query - 검색 옵션 (search, favoriteIds)
 * @returns 검색된 제품 목록
 */
export async function searchActiveProductsForTreatment(
  hospitalId: string,
  query: { search?: string; favoriteIds?: string[]; limit?: number }
): Promise<ApiResponse<ProductForTreatment[]>> {
  const { search, favoriteIds = [], limit = 50 } = query;

  // 기존 함수로 전체 목록 조회
  const result = await getActiveProductsForTreatment(hospitalId);
  if (!result.success || !result.data) {
    return createErrorResponse(
      result.error?.code ?? 'QUERY_ERROR',
      result.error?.message ?? '제품 목록 조회에 실패했습니다.'
    );
  }

  let products = result.data;

  // 검색 필터 (별칭, 제품명, 모델명)
  if (search) {
    const searchLower = search.toLowerCase();
    products = products.filter(
      (p) =>
        p.productName.toLowerCase().includes(searchLower) ||
        p.modelName.toLowerCase().includes(searchLower) ||
        (p.alias?.toLowerCase().includes(searchLower) ?? false)
    );
  }

  // 즐겨찾기 우선 정렬 후 재고 내림차순
  const favoriteSet = new Set(favoriteIds);
  products.sort((a, b) => {
    const aFav = favoriteSet.has(a.productId) ? 1 : 0;
    const bFav = favoriteSet.has(b.productId) ? 1 : 0;
    if (aFav !== bFav) {return bFav - aFav;}
    return b.availableQuantity - a.availableQuantity;
  });

  // 상위 N개만 반환
  return createSuccessResponse(products.slice(0, limit));
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 제품 표시명 반환 (별칭 우선)
 *
 * @param alias - 별칭 (nullable)
 * @param productName - 제품명
 * @param modelName - 모델명
 * @returns 표시할 제품명
 */
export function getProductDisplayName(
  alias: string | null,
  productName: string,
  modelName?: string
): { primary: string; secondary: string | null } {
  if (alias) {
    // 별칭이 있으면 별칭을 메인으로, 원본 정보를 서브로
    const secondary = modelName ? `${productName} · ${modelName}` : productName;
    return { primary: alias, secondary };
  }

  // 별칭이 없으면 제품명 (모델명) 형태
  const primary = modelName ? `${productName} (${modelName})` : productName;
  return { primary, secondary: null };
}

// ============================================================================
// unstable_cache() 호환 함수 (Admin Client 사용)
// Issue #001: hospital-disposal 페이지 성능 최적화
// cookies()를 사용하지 않아 unstable_cache() 내에서 사용 가능
// ============================================================================

/**
 * 시술 등록용 활성 제품 목록 조회 (캐시용)
 * Admin Client를 사용하여 unstable_cache()와 호환
 *
 * @param hospitalId - 병원 조직 ID
 * @returns 시술 등록 가능한 제품 목록
 */
export async function getActiveProductsForTreatmentCacheable(
  hospitalId: string
): Promise<ApiResponse<ProductForTreatment[]>> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc('get_active_products_for_treatment', {
    p_hospital_id: hospitalId,
  });

  if (error) {
    logger.error('getActiveProductsForTreatmentCacheable 실패', error);
    return createErrorResponse('RPC_ERROR', '제품 목록 조회에 실패했습니다.');
  }

  // RPC 결과 검증
  const parsed = parseRpcArray(
    ActiveProductForTreatmentRowSchema,
    data,
    'get_active_products_for_treatment'
  );

  if (!parsed.success) {
    logger.error('get_active_products_for_treatment 검증 실패', { error: parsed.error });
    return createErrorResponse('VALIDATION_ERROR', parsed.error);
  }

  // 결과 변환
  const products: ProductForTreatment[] = parsed.data.map((row) => ({
    productId: row.product_id,
    productName: row.product_name,
    modelName: row.model_name ?? '',
    udiDi: row.udi_di ?? '',
    alias: row.alias,
    availableQuantity: row.available_quantity,
  }));

  return createSuccessResponse(products);
}
