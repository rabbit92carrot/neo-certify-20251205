'use client';

/**
 * 제품 관리 react-query 훅
 * 제품 목록/상세 쿼리 + 생성/수정/비활성화/활성화 뮤테이션
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/query-keys';
import { fetchProducts, fetchProduct } from '@/lib/query/api';
import {
  createProductAction,
  updateProductAction,
  deactivateProductAction,
  activateProductAction,
} from '@/app/(dashboard)/manufacturer/actions';
import type { Product, PaginatedResponse, ProductDeactivationReason } from '@/types/api.types';
import type { ProductListQueryData } from '@/lib/validations/product';

// ============================================================================
// 쿼리 훅
// ============================================================================

/**
 * 제품 목록 쿼리
 * @param organizationId 조직 ID
 * @param query 필터/페이지네이션
 * @param initialData Server Component에서 전달받은 초기 데이터
 */
export function useProductList(
  organizationId: string,
  query: ProductListQueryData = { page: 1, pageSize: 100 },
  initialData?: PaginatedResponse<Product>
) {
  return useQuery({
    queryKey: queryKeys.products.list(query),
    queryFn: () => fetchProducts(organizationId, query),
    initialData,
    staleTime: 60 * 1000, // 1분
  });
}

/**
 * 제품 상세 쿼리
 */
export function useProductDetail(
  organizationId: string,
  productId: string,
  initialData?: Product
) {
  return useQuery({
    queryKey: queryKeys.products.detail(productId),
    queryFn: () => fetchProduct(organizationId, productId),
    initialData,
    staleTime: 60 * 1000,
    enabled: !!productId,
  });
}

// ============================================================================
// 뮤테이션 훅
// ============================================================================

/**
 * 제품 생성 뮤테이션
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => createProductAction(formData),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      }
    },
  });
}

/**
 * 제품 수정 뮤테이션
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => updateProductAction(formData),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      }
    },
  });
}

/**
 * 제품 비활성화 뮤테이션
 */
export function useDeactivateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      reason,
      note,
    }: {
      productId: string;
      reason: ProductDeactivationReason;
      note?: string;
    }) => deactivateProductAction(productId, reason, note),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      }
    },
  });
}

/**
 * 제품 활성화 뮤테이션
 */
export function useActivateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => activateProductAction(productId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      }
    },
  });
}
