/**
 * 거래이력 조회 스키마
 * 모든 역할에서 공유하는 거래 이력 조회 스키마
 */

import { z } from 'zod';
import { HISTORY_ACTION_TYPES } from '@/constants/history';

// ============================================================================
// 이력 액션 타입 스키마
// ============================================================================

export const historyActionTypeSchema = z.enum([
  HISTORY_ACTION_TYPES.PRODUCED,
  HISTORY_ACTION_TYPES.SHIPPED,
  HISTORY_ACTION_TYPES.RECEIVED,
  HISTORY_ACTION_TYPES.TREATED,
  HISTORY_ACTION_TYPES.RECALLED,
  HISTORY_ACTION_TYPES.DISPOSED,
]);

// ============================================================================
// 거래이력 조회 쿼리 스키마
// ============================================================================

/**
 * 거래이력 조회 쿼리 스키마
 */
export const transactionHistoryQuerySchema = z.object({
  // 페이지네이션
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),

  // 기간 필터
  startDate: z.string().optional(),
  endDate: z.string().optional(),

  // 액션 타입 필터 (복수 선택 가능)
  actionTypes: z
    .array(historyActionTypeSchema)
    .optional(),

  // 회수 여부 필터
  isRecall: z.boolean().optional(),

  // 제품 필터
  productId: z.string().uuid().optional(),
});

/**
 * 거래이력 조회 쿼리 (폼용 - 문자열 변환 포함)
 */
export const transactionHistoryQueryFormSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  actionTypes: z.string().optional().transform((val) => {
    if (!val) return [];
    return val.split(',').filter(Boolean);
  }),
  isRecall: z.string().optional().transform((val) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  }),
  productId: z.string().uuid().optional(),
});

// ============================================================================
// 타입 추출
// ============================================================================

export type HistoryActionTypeValue = z.infer<typeof historyActionTypeSchema>;
export type TransactionHistoryQueryData = z.infer<typeof transactionHistoryQuerySchema>;
export type TransactionHistoryQueryFormData = z.infer<typeof transactionHistoryQueryFormSchema>;
