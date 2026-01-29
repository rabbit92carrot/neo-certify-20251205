'use client';

/**
 * 대시보드 통계 react-query 훅
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/query-keys';
import { fetchManufacturerDashboardStats } from '@/lib/query/api';
import type { ManufacturerDashboardStats } from '@/types/api.types';

/**
 * 제조사 대시보드 통계 쿼리
 * @param organizationId 조직 ID
 * @param initialData Server Component에서 전달받은 초기 데이터
 */
export function useManufacturerDashboardStats(
  organizationId: string,
  initialData?: ManufacturerDashboardStats
) {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(organizationId),
    queryFn: () => fetchManufacturerDashboardStats(organizationId),
    initialData,
    staleTime: 60 * 1000, // 1분
    refetchInterval: 5 * 60 * 1000, // 5분마다 자동 refetch
  });
}
