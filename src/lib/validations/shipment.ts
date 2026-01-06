/**
 * 출고 및 회수 관련 Zod 유효성 검사 스키마
 */

import { z } from 'zod';
import { uuidSchema, quantitySchema } from './common';
import { ERROR_MESSAGES } from '@/constants';

// ============================================================================
// 출고 항목 스키마
// ============================================================================

/**
 * lotId 스키마: UUID 또는 빈 문자열/null/undefined 허용
 * 빈 문자열이나 falsy 값은 undefined로 변환 (z.preprocess 사용)
 */
const optionalLotIdSchema = z.preprocess(
  (val) => {
    // 빈 문자열, null, undefined는 모두 undefined로 변환
    if (val === '' || val === null || val === undefined) {
      return undefined;
    }
    return val;
  },
  uuidSchema.optional()
);

/**
 * 출고 항목 스키마 (장바구니 아이템)
 */
export const shipmentItemSchema = z.object({
  productId: uuidSchema,
  quantity: quantitySchema,
  lotId: optionalLotIdSchema, // 제조사만 선택 가능 (FIFO 우회)
});

/**
 * 출고 항목 목록 스키마 (최소 1개 이상)
 */
export const shipmentItemsSchema = z
  .array(shipmentItemSchema)
  .min(1, '최소 1개 이상의 제품을 선택해야 합니다.');

// ============================================================================
// 출고 스키마
// ============================================================================

/**
 * 출고 생성 스키마
 */
export const shipmentCreateSchema = z.object({
  toOrganizationId: uuidSchema,
  items: shipmentItemsSchema,
});

/**
 * 출고 생성 폼 스키마 (문자열 수량 입력)
 */
export const shipmentCreateFormSchema = z.object({
  toOrganizationId: uuidSchema,
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
        lotId: optionalLotIdSchema,
      })
    )
    .min(1, '최소 1개 이상의 제품을 선택해야 합니다.'),
});

// ============================================================================
// 회수 스키마 (시술 회수용 - 병원 주도, 24시간 제한)
// ============================================================================

/**
 * 회수 스키마 (시술 회수용)
 */
export const recallSchema = z.object({
  shipmentBatchId: uuidSchema,
  reason: z
    .string()
    .min(1, ERROR_MESSAGES.RECALL.REASON_REQUIRED)
    .max(500, '회수 사유는 500자를 초과할 수 없습니다.'),
});

/**
 * 회수 가능 여부 확인 스키마
 */
export const recallCheckSchema = z.object({
  shipmentBatchId: uuidSchema,
});

// ============================================================================
// 반품 스키마 (출고 반품용 - 수신자 주도, 시간 제한 없음)
// ============================================================================

/**
 * 반품 스키마 (출고 반품용)
 */
export const returnSchema = z.object({
  shipmentBatchId: uuidSchema,
  reason: z
    .string()
    .min(1, '반품 사유를 입력해주세요.')
    .max(500, '반품 사유는 500자를 초과할 수 없습니다.'),
});

/**
 * 반품 가능 여부 확인 스키마
 */
export const returnCheckSchema = z.object({
  shipmentBatchId: uuidSchema,
});

// ============================================================================
// 출고 이력 조회 스키마
// ============================================================================

/**
 * 출고 이력 조회 스키마
 */
export const shipmentHistoryQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  toOrganizationId: uuidSchema.optional(),
  isRecalled: z.boolean().optional(),
});

/**
 * 출고 상세 조회 스키마
 */
export const shipmentDetailQuerySchema = z.object({
  shipmentBatchId: uuidSchema,
});

// ============================================================================
// 장바구니 스키마 (클라이언트 상태 관리용)
// ============================================================================

/**
 * 장바구니 아이템 스키마
 */
export const cartItemSchema = z.object({
  productId: uuidSchema,
  productName: z.string(),
  quantity: quantitySchema,
  lotId: optionalLotIdSchema,
  lotNumber: z.string().optional(),
  availableQuantity: z.number().int().min(0),
});

/**
 * 장바구니에 아이템 추가 스키마
 */
export const addToCartSchema = z.object({
  productId: uuidSchema,
  quantity: quantitySchema,
  lotId: optionalLotIdSchema,
});

/**
 * 장바구니 아이템 수량 수정 스키마
 */
export const updateCartItemSchema = z.object({
  productId: uuidSchema,
  quantity: quantitySchema,
});

/**
 * 장바구니에서 아이템 제거 스키마
 */
export const removeFromCartSchema = z.object({
  productId: uuidSchema,
});

// ============================================================================
// 타입 추출
// ============================================================================

export type ShipmentItemData = z.infer<typeof shipmentItemSchema>;
export type ShipmentCreateData = z.infer<typeof shipmentCreateSchema>;
export type ShipmentCreateFormData = z.infer<typeof shipmentCreateFormSchema>;
export type RecallData = z.infer<typeof recallSchema>;
export type RecallCheckData = z.infer<typeof recallCheckSchema>;
export type ReturnData = z.infer<typeof returnSchema>;
export type ReturnCheckData = z.infer<typeof returnCheckSchema>;
export type ShipmentHistoryQueryData = z.infer<typeof shipmentHistoryQuerySchema>;
export type ShipmentDetailQueryData = z.infer<typeof shipmentDetailQuerySchema>;
export type CartItemData = z.infer<typeof cartItemSchema>;
export type AddToCartData = z.infer<typeof addToCartSchema>;
export type UpdateCartItemData = z.infer<typeof updateCartItemSchema>;
export type RemoveFromCartData = z.infer<typeof removeFromCartSchema>;
