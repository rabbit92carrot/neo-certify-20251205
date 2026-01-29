'use client';

/**
 * 재고 관리 react-query 훅
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/query-keys';
import { fetchInventorySummary } from '@/lib/query/api';
import type { InventorySummary } from '@/types/api.types';

/**
 * 재고 요약 목록 쿼리
 * @param organizationId 조직 ID
 * @param initialData Server Component에서 전달받은 초기 데이터
 */
export function useInventorySummary(
  organizationId: string,
  initialData?: InventorySummary[]
) {
  return useQuery({
    queryKey: queryKeys.inventory.list({ organizationId }),
    queryFn: () => fetchInventorySummary(organizationId),
    initialData,
    staleTime: 30 * 1000, // 30초 (재고는 빈번하게 변동)
  });
}
