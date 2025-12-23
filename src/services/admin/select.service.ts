/**
 * 관리자 선택 목록 서비스
 * 조직/제품 검색 및 선택용 목록 조회
 */

import { createClient } from '@/lib/supabase/server';
import {
  createErrorResponse,
  createSuccessResponse,
} from '../common.service';
import type { ApiResponse, OrganizationType } from '@/types/api.types';

// ============================================================================
// 조직 선택 목록 (드롭다운용)
// ============================================================================

/**
 * 모든 조직 목록 조회 (선택용)
 * 관리자 제외, 활성 상태만
 */
export async function getAllOrganizationsForSelect(): Promise<
  ApiResponse<{ id: string; name: string; type: OrganizationType }[]>
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, type')
    .eq('status', 'ACTIVE')
    .neq('type', 'ADMIN')
    .order('name');

  if (error) {
    return createErrorResponse('QUERY_ERROR', error.message);
  }

  return createSuccessResponse(
    (data || []).map((org) => ({
      id: org.id,
      name: org.name,
      type: org.type as OrganizationType,
    }))
  );
}

/**
 * 조직 검색 (Lazy Load용)
 * 검색어 기반으로 조직을 검색합니다.
 */
export async function searchOrganizations(
  query: string,
  limit: number = 20
): Promise<ApiResponse<{ id: string; name: string; type: OrganizationType }[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, type')
    .eq('status', 'ACTIVE')
    .neq('type', 'ADMIN')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(limit);

  if (error) {
    return createErrorResponse('QUERY_ERROR', error.message);
  }

  return createSuccessResponse(
    (data || []).map((org) => ({
      id: org.id,
      name: org.name,
      type: org.type as OrganizationType,
    }))
  );
}

/**
 * 제품 검색 (Lazy Load용)
 * 검색어 기반으로 제품을 검색합니다 (model_name 또는 name).
 */
export async function searchProducts(
  query: string,
  limit: number = 20
): Promise<ApiResponse<{ id: string; name: string; modelName: string; manufacturerName: string }[]>> {
  const supabase = await createClient();

  // model_name 또는 name으로 검색
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id,
      name,
      model_name,
      organization:organizations!inner(name)
    `
    )
    .eq('is_active', true)
    .or(`model_name.ilike.%${query}%,name.ilike.%${query}%`)
    .order('model_name')
    .limit(limit);

  if (error) {
    return createErrorResponse('QUERY_ERROR', error.message);
  }

  return createSuccessResponse(
    (data || []).map((product) => ({
      id: product.id,
      name: product.name,
      modelName: product.model_name,
      manufacturerName: (product.organization as { name: string }).name,
    }))
  );
}

/**
 * 모든 제품 목록 조회 (선택용)
 * model_name을 포함하여 동일 제품명의 다른 모델을 구분
 */
export async function getAllProductsForSelect(): Promise<
  ApiResponse<{ id: string; name: string; modelName: string; manufacturerName: string }[]>
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id,
      name,
      model_name,
      organization:organizations!inner(name)
    `
    )
    .eq('is_active', true)
    .order('model_name');

  if (error) {
    return createErrorResponse('QUERY_ERROR', error.message);
  }

  return createSuccessResponse(
    (data || []).map((product) => ({
      id: product.id,
      name: product.name,
      modelName: product.model_name,
      manufacturerName: (product.organization as { name: string }).name,
    }))
  );
}
