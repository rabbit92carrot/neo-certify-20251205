/**
 * 제품 서비스
 * 제품 CRUD 및 조회 관련 비즈니스 로직
 */

import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, Product, PaginatedResponse, ProductDeactivationReason } from '@/types/api.types';
import type {
  ProductCreateData,
  ProductUpdateData,
  ProductListQueryData,
} from '@/lib/validations/product';
import { createErrorResponse, createSuccessResponse, createNotFoundResponse } from './common.service';
import { buildIlikeFilter } from '@/lib/utils/db';

// 캐시 TTL 상수 (초)
const PRODUCTS_CACHE_TTL = 300; // 5분

/**
 * 제품 목록 조회 (페이지네이션)
 *
 * @param organizationId 제조사 조직 ID
 * @param query 조회 옵션 (페이지, 검색어, 활성 여부)
 * @returns 페이지네이션된 제품 목록
 */
export async function getProducts(
  organizationId: string,
  query: ProductListQueryData
): Promise<ApiResponse<PaginatedResponse<Product>>> {
  const supabase = await createClient();
  const { page = 1, pageSize = 20, search, isActive } = query;
  const offset = (page - 1) * pageSize;

  let queryBuilder = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  // 활성 여부 필터
  if (isActive !== undefined) {
    queryBuilder = queryBuilder.eq('is_active', isActive);
  }

  // 검색어 필터 (제품명, 모델명, UDI-DI)
  if (search) {
    queryBuilder = queryBuilder.or(
      buildIlikeFilter(['name', 'model_name', 'udi_di'], search)
    );
  }

  const { data, count, error } = await queryBuilder.range(offset, offset + pageSize - 1);

  if (error) {
    return createErrorResponse('QUERY_ERROR', error.message);
  }

  const total = count ?? 0;

  return createSuccessResponse({
    items: data ?? [],
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
 * 활성 제품 목록 조회 (생산 등록용)
 * 비활성화된 제품은 제외하고 반환
 *
 * @param organizationId 제조사 조직 ID
 * @returns 활성 제품 목록
 */
export async function getActiveProducts(
  organizationId: string
): Promise<ApiResponse<Product[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    return createErrorResponse('QUERY_ERROR', error.message);
  }

  return createSuccessResponse(data ?? []);
}

/**
 * 캐싱된 활성 제품 목록 조회
 * unstable_cache를 사용하여 5분간 캐싱
 * 제품 생성/수정/삭제 시 revalidateTag('products')로 무효화
 *
 * @param organizationId 제조사 조직 ID
 * @returns 활성 제품 목록
 */
export const getCachedActiveProducts = (organizationId: string) =>
  unstable_cache(
    async () => {
      const result = await getActiveProducts(organizationId);
      return result;
    },
    [`products-${organizationId}`],
    {
      tags: ['products', `products-${organizationId}`],
      revalidate: PRODUCTS_CACHE_TTL,
    }
  )();

/**
 * 제품 상세 조회
 *
 * @param organizationId 제조사 조직 ID
 * @param productId 제품 ID
 * @returns 제품 정보
 */
export async function getProduct(
  organizationId: string,
  productId: string
): Promise<ApiResponse<Product>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('organization_id', organizationId)
    .single();

  if (error) {
    return createNotFoundResponse('제품을 찾을 수 없습니다.');
  }

  return createSuccessResponse(data);
}

/**
 * 제품 생성
 *
 * @param organizationId 제조사 조직 ID
 * @param data 제품 생성 데이터
 * @returns 생성된 제품 정보
 */
export async function createProduct(
  organizationId: string,
  data: ProductCreateData
): Promise<ApiResponse<Product>> {
  const supabase = await createClient();

  // UDI-DI 중복 확인 (동일 제조사 내)
  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('udi_di', data.udiDi)
    .single();

  if (existing) {
    return createErrorResponse('DUPLICATE_UDI_DI', '이미 등록된 UDI-DI입니다.');
  }

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      organization_id: organizationId,
      name: data.name,
      udi_di: data.udiDi,
      model_name: data.modelName,
    })
    .select()
    .single();

  if (error) {
    return createErrorResponse('CREATE_FAILED', '제품 등록에 실패했습니다.');
  }

  return createSuccessResponse(product);
}

/**
 * 제품 수정
 *
 * @param organizationId 제조사 조직 ID
 * @param data 제품 수정 데이터 (id 필수)
 * @returns 수정된 제품 정보
 */
export async function updateProduct(
  organizationId: string,
  data: ProductUpdateData
): Promise<ApiResponse<Product>> {
  const supabase = await createClient();

  // 수정할 필드만 추출
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  if (data.udiDi !== undefined) {
    updateData.udi_di = data.udiDi;
  }
  if (data.modelName !== undefined) {
    updateData.model_name = data.modelName;
  }

  // UDI-DI 변경 시 중복 확인
  if (data.udiDi) {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('udi_di', data.udiDi)
      .neq('id', data.id)
      .single();

    if (existing) {
      return createErrorResponse('DUPLICATE_UDI_DI', '이미 등록된 UDI-DI입니다.');
    }
  }

  const { data: product, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', data.id)
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) {
    return createErrorResponse('UPDATE_FAILED', '제품 수정에 실패했습니다.');
  }

  return createSuccessResponse(product);
}

/**
 * 제품 비활성화
 * 비활성화된 제품은 생산 등록 목록에서 표시되지 않지만 이력은 유지됨
 *
 * @param organizationId 제조사 조직 ID
 * @param productId 제품 ID
 * @param reason 비활성화 사유
 * @param note 상세 사유 (선택)
 * @returns 비활성화된 제품 정보
 */
export async function deactivateProduct(
  organizationId: string,
  productId: string,
  reason: ProductDeactivationReason,
  note?: string
): Promise<ApiResponse<Product>> {
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from('products')
    .update({
      is_active: false,
      deactivation_reason: reason,
      deactivation_note: note ?? null,
      deactivated_at: new Date().toISOString(),
    })
    .eq('id', productId)
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) {
    return createErrorResponse('DEACTIVATE_FAILED', '제품 비활성화에 실패했습니다.');
  }

  return createSuccessResponse(product);
}

/**
 * 제품 활성화
 * 비활성화 관련 필드를 초기화함
 *
 * @param organizationId 제조사 조직 ID
 * @param productId 제품 ID
 * @returns 활성화된 제품 정보
 */
export async function activateProduct(
  organizationId: string,
  productId: string
): Promise<ApiResponse<Product>> {
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from('products')
    .update({
      is_active: true,
      deactivation_reason: null,
      deactivation_note: null,
      deactivated_at: null,
    })
    .eq('id', productId)
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) {
    return createErrorResponse('ACTIVATE_FAILED', '제품 활성화에 실패했습니다.');
  }

  return createSuccessResponse(product);
}
