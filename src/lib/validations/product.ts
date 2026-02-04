/**
 * 제품 및 Lot 관련 Zod 유효성 검사 스키마
 */

import { z } from 'zod';
import {
  uuidSchema,
  productionQuantitySchema,
  dateInputSchema,
  maxLengthStringSchema,
} from './common';
import { ERROR_MESSAGES } from '@/constants';

// ============================================================================
// 제품 스키마
// ============================================================================

/**
 * 제품 생성 스키마
 */
export const productCreateSchema = z.object({
  name: maxLengthStringSchema('제품명', 100),
  udiDi: maxLengthStringSchema('UDI-DI', 100),
  modelName: maxLengthStringSchema('모델명', 100),
});

/**
 * 제품 수정 스키마
 */
export const productUpdateSchema = z.object({
  id: uuidSchema,
  name: maxLengthStringSchema('제품명', 100).optional(),
  udiDi: maxLengthStringSchema('UDI-DI', 100).optional(),
  modelName: maxLengthStringSchema('모델명', 100).optional(),
});

/**
 * 제품 비활성화 스키마
 */
export const productDeactivateSchema = z.object({
  id: uuidSchema,
});

/**
 * 제품 ID 스키마 (조회용)
 */
export const productIdSchema = z.object({
  productId: uuidSchema,
});

// ============================================================================
// Lot 스키마
// ============================================================================

/**
 * Lot 생산 등록 스키마
 */
export const lotCreateSchema = z.object({
  productId: uuidSchema,
  quantity: productionQuantitySchema,
  manufactureDate: dateInputSchema,
  expiryDate: dateInputSchema.optional(), // 자동 계산되므로 옵셔널
});

/**
 * Lot 생산 등록 스키마 (자동 생성 필드 포함)
 * 서버에서 사용
 */
export const lotCreateWithAutoFieldsSchema = lotCreateSchema.extend({
  lotNumber: z.string().optional(), // 자동 생성
});

/**
 * Lot 생산 등록 폼 스키마
 * 클라이언트 폼에서 사용
 */
export const lotCreateFormSchema = z.object({
  productId: uuidSchema,
  quantity: z
    .string()
    .min(1, ERROR_MESSAGES.GENERAL.REQUIRED_FIELD('수량'))
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val >= 1, {
      message: ERROR_MESSAGES.QUANTITY.MIN,
    })
    .refine((val) => val <= 100000, {
      message: ERROR_MESSAGES.QUANTITY.MAX_PRODUCTION,
    }),
  manufactureDate: dateInputSchema,
});

/**
 * Lot 조회 스키마
 */
export const lotQuerySchema = z.object({
  productId: uuidSchema.optional(),
  lotId: uuidSchema.optional(),
});

// ============================================================================
// 제품 조회/필터 스키마
// ============================================================================

/**
 * 제품 목록 정렬 기준
 */
export const productSortBySchema = z.enum(['model_name', 'name', 'created_at']).default('created_at');

/**
 * 정렬 방향
 */
export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc');

/**
 * 제품 목록 조회 스키마
 */
export const productListQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  sortBy: productSortBySchema.optional(),
  sortOrder: sortOrderSchema.optional(),
});

/**
 * Lot 목록 조회 스키마
 */
export const lotListQuerySchema = z.object({
  productId: uuidSchema.optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

// ============================================================================
// 타입 추출
// ============================================================================

export type ProductCreateData = z.infer<typeof productCreateSchema>;
export type ProductUpdateData = z.infer<typeof productUpdateSchema>;
export type ProductDeactivateData = z.infer<typeof productDeactivateSchema>;
export type LotCreateData = z.infer<typeof lotCreateSchema>;
export type LotCreateFormData = z.infer<typeof lotCreateFormSchema>;
export type ProductListQueryData = z.infer<typeof productListQuerySchema>;
export type LotListQueryData = z.infer<typeof lotListQuerySchema>;
