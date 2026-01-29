'use client';

/**
 * 대시보드 통계 react-query 훅
 * 각 조직 유형별 대시보드 통계를 조회합니다.
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/query-keys';
import {
  fetchManufacturerDashboardStats,
  fetchDistributorDashboardStats,
  fetchHospitalDashboardStats,
  fetchAdminDashboardStats,
} from '@/lib/query/api';
import type {
  ManufacturerDashboardStats,
  DistributorDashboardStats,
  HospitalDashboardStats,
  AdminDashboardStats,
} from '@/types/api.types';

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
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

/**
 * 유통사 대시보드 통계 쿼리
 * @param organizationId 조직 ID
 * @param initialData Server Component에서 전달받은 초기 데이터
 */
export function useDistributorDashboardStats(
  organizationId: string,
  initialData?: DistributorDashboardStats
) {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(organizationId),
    queryFn: () => fetchDistributorDashboardStats(organizationId),
    initialData,
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

/**
 * 병원 대시보드 통계 쿼리
 * @param organizationId 조직 ID
 * @param initialData Server Component에서 전달받은 초기 데이터
 */
export function useHospitalDashboardStats(
  organizationId: string,
  initialData?: HospitalDashboardStats
) {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(organizationId),
    queryFn: () => fetchHospitalDashboardStats(organizationId),
    initialData,
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

/**
 * 관리자 대시보드 통계 쿼리
 * @param organizationId 조직 ID (캐시 키용)
 * @param initialData Server Component에서 전달받은 초기 데이터
 */
export function useAdminDashboardStats(
  organizationId: string,
  initialData?: AdminDashboardStats
) {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(organizationId),
    queryFn: () => fetchAdminDashboardStats(),
    initialData,
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
