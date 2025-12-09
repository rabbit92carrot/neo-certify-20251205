/**
 * 시술 관련 Zod 유효성 검사 스키마
 */

import { z } from 'zod';
import { uuidSchema, quantitySchema, phoneNumberInputSchema, dateInputSchema } from './common';
import { ERROR_MESSAGES } from '@/constants';

// ============================================================================
// 시술 항목 스키마
// ============================================================================

/**
 * 시술 항목 스키마
 */
export const treatmentItemSchema = z.object({
  productId: uuidSchema,
  quantity: quantitySchema,
});

/**
 * 시술 항목 목록 스키마 (최소 1개 이상)
 */
export const treatmentItemsSchema = z
  .array(treatmentItemSchema)
  .min(1, '최소 1개 이상의 제품을 선택해야 합니다.');

// ============================================================================
// 시술 스키마
// ============================================================================

/**
 * 시술 등록 스키마
 */
export const treatmentCreateSchema = z.object({
  patientPhone: phoneNumberInputSchema,
  treatmentDate: dateInputSchema,
  items: treatmentItemsSchema,
});

/**
 * 시술 등록 폼 스키마 (문자열 수량 입력)
 */
export const treatmentCreateFormSchema = z.object({
  patientPhone: phoneNumberInputSchema,
  treatmentDate: dateInputSchema.optional(), // 기본값: 오늘
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
    .min(1, '최소 1개 이상의 제품을 선택해야 합니다.'),
});

// ============================================================================
// 시술 조회 스키마
// ============================================================================

/**
 * 시술 이력 조회 스키마
 */
export const treatmentHistoryQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  patientPhone: z.string().optional(),
});

/**
 * 시술 상세 조회 스키마
 */
export const treatmentDetailQuerySchema = z.object({
  treatmentId: uuidSchema,
});

/**
 * 환자 시술 이력 조회 스키마 (환자 전화번호 기준)
 */
export const patientTreatmentQuerySchema = z.object({
  patientPhone: phoneNumberInputSchema,
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

// ============================================================================
// 시술 회수 스키마 (병원)
// ============================================================================

/**
 * 시술 회수 스키마 (병원에서 환자에게 시술한 제품 회수)
 * 이관 뭉치 단위가 아닌 시술 기록 단위로 회수
 */
export const treatmentRecallSchema = z.object({
  treatmentId: uuidSchema,
  reason: z
    .string()
    .min(1, ERROR_MESSAGES.RECALL.REASON_REQUIRED)
    .max(500, '회수 사유는 500자를 초과할 수 없습니다.'),
});

// ============================================================================
// 타입 추출
// ============================================================================

export type TreatmentItemData = z.infer<typeof treatmentItemSchema>;
export type TreatmentCreateData = z.infer<typeof treatmentCreateSchema>;
export type TreatmentCreateFormData = z.infer<typeof treatmentCreateFormSchema>;
export type TreatmentHistoryQueryData = z.infer<typeof treatmentHistoryQuerySchema>;
export type TreatmentDetailQueryData = z.infer<typeof treatmentDetailQuerySchema>;
export type PatientTreatmentQueryData = z.infer<typeof patientTreatmentQuerySchema>;
export type TreatmentRecallData = z.infer<typeof treatmentRecallSchema>;
