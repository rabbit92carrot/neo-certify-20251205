/**
 * 폐기 관련 Zod 유효성 검사 스키마
 */

import { z } from 'zod';
import { uuidSchema, quantitySchema, dateInputSchema } from './common';
import { DISPOSAL_REASON_TYPES, ERROR_MESSAGES } from '@/constants';

// ============================================================================
// 폐기 사유 스키마
// ============================================================================

/**
 * 폐기 사유 타입 스키마
 */
export const disposalReasonTypeSchema = z.enum([
  DISPOSAL_REASON_TYPES.TREATMENT_LOSS,
  DISPOSAL_REASON_TYPES.EXPIRED,
  DISPOSAL_REASON_TYPES.DEFECTIVE,
  DISPOSAL_REASON_TYPES.OTHER,
]);

// ============================================================================
// 폐기 항목 스키마
// ============================================================================

/**
 * 폐기 항목 스키마
 */
export const disposalItemSchema = z.object({
  productId: uuidSchema,
  quantity: quantitySchema,
});

/**
 * 폐기 항목 목록 스키마 (최소 1개 이상)
 */
export const disposalItemsSchema = z
  .array(disposalItemSchema)
  .min(1, ERROR_MESSAGES.DISPOSAL.ITEMS_MIN);

// ============================================================================
// 폐기 스키마
// ============================================================================

/**
 * 폐기 등록 스키마
 */
export const disposalCreateSchema = z
  .object({
    disposalDate: dateInputSchema,
    disposalReasonType: disposalReasonTypeSchema,
    disposalReasonCustom: z.string().max(500, ERROR_MESSAGES.DISPOSAL.REASON_MAX_LENGTH).nullable().optional(),
    items: disposalItemsSchema,
  })
  .refine(
    (data) => {
      if (data.disposalReasonType === DISPOSAL_REASON_TYPES.OTHER) {
        return data.disposalReasonCustom && data.disposalReasonCustom.trim().length > 0;
      }
      return true;
    },
    {
      message: ERROR_MESSAGES.DISPOSAL.REASON_REQUIRED,
      path: ['disposalReasonCustom'],
    }
  );

/**
 * 폐기 등록 폼 스키마 (문자열 수량 입력)
 */
export const disposalCreateFormSchema = z
  .object({
    disposalDate: dateInputSchema.optional(), // 기본값: 오늘
    disposalReasonType: disposalReasonTypeSchema,
    disposalReasonCustom: z.string().max(500).nullable().optional(),
    items: z
      .array(
        z.object({
          productId: uuidSchema,
          quantity: z
            .string()
            .min(1, ERROR_MESSAGES.GENERAL.REQUIRED_FIELD('수량'))
            .transform((val) => parseInt(val, 10))
            .refine((val) => !isNaN(val) && val >= 1, {
              message: ERROR_MESSAGES.QUANTITY.MIN,
            }),
        })
      )
      .min(1, ERROR_MESSAGES.DISPOSAL.ITEMS_MIN),
  })
  .refine(
    (data) => {
      if (data.disposalReasonType === DISPOSAL_REASON_TYPES.OTHER) {
        return data.disposalReasonCustom && data.disposalReasonCustom.trim().length > 0;
      }
      return true;
    },
    {
      message: ERROR_MESSAGES.DISPOSAL.REASON_REQUIRED,
      path: ['disposalReasonCustom'],
    }
  );

// ============================================================================
// 폐기 조회 스키마
// ============================================================================

/**
 * 폐기 이력 조회 스키마
 */
export const disposalHistoryQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  disposalReasonType: disposalReasonTypeSchema.optional(),
});

// ============================================================================
// 타입 추출
// ============================================================================

export type DisposalReasonTypeValue = z.infer<typeof disposalReasonTypeSchema>;
export type DisposalItemData = z.infer<typeof disposalItemSchema>;
export type DisposalCreateData = z.infer<typeof disposalCreateSchema>;
export type DisposalCreateFormData = z.infer<typeof disposalCreateFormSchema>;
export type DisposalHistoryQueryData = z.infer<typeof disposalHistoryQuerySchema>;
