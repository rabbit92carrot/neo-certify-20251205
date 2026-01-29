'use client';

/**
 * Mutation 훅 — Server Action 호출 후 react-query 캐시 무효화
 *
 * 출고/시술/회수 등 데이터 변경 시 관련 캐시를 자동으로 무효화하여
 * 대시보드와 재고 목록이 최신 상태를 반영합니다.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/query-keys';

// ============================================================================
// 출고 Mutation
// ============================================================================

/**
 * 출고 생성 mutation
 * 성공 시 inventory, dashboard, shipments 캐시를 무효화합니다.
 *
 * @param mutationFn Server Action 함수 (createShipmentAction 등)
 */
export function useShipmentMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.history.all });
    },
  });
}

/**
 * 출고 회수 mutation
 * 성공 시 inventory, dashboard, shipments, history 캐시를 무효화합니다.
 *
 * @param mutationFn Server Action 함수 (returnShipmentAction 등)
 */
export function useReturnShipmentMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.history.all });
    },
  });
}

// ============================================================================
// 시술 Mutation
// ============================================================================

/**
 * 시술 등록 mutation
 * 성공 시 inventory, dashboard, treatments 캐시를 무효화합니다.
 *
 * @param mutationFn Server Action 함수 (createTreatmentAction 등)
 */
export function useTreatmentMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.treatments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.history.all });
    },
  });
}

/**
 * 시술 회수 mutation
 * 성공 시 inventory, dashboard, treatments, history 캐시를 무효화합니다.
 *
 * @param mutationFn Server Action 함수 (recallTreatmentAction 등)
 */
export function useRecallTreatmentMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.treatments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.history.all });
    },
  });
}

// ============================================================================
// 폐기 Mutation
// ============================================================================

/**
 * 폐기 처리 mutation
 * 성공 시 inventory, dashboard 캐시를 무효화합니다.
 *
 * @param mutationFn Server Action 함수 (createDisposalAction 등)
 */
export function useDisposalMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.history.all });
    },
  });
}
