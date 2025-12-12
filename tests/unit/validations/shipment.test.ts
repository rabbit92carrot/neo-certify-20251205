/**
 * shipment.ts Zod 스키마 단위 테스트
 *
 * 출고 및 회수 관련 검증 스키마 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  shipmentItemSchema,
  shipmentItemsSchema,
  shipmentCreateSchema,
  shipmentCreateFormSchema,
  recallSchema,
  recallCheckSchema,
  shipmentHistoryQuerySchema,
  shipmentDetailQuerySchema,
  cartItemSchema,
  addToCartSchema,
  updateCartItemSchema,
  removeFromCartSchema,
} from '@/lib/validations/shipment';

describe('shipment.ts Zod 스키마', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';
  const validUUID2 = '660e8400-e29b-41d4-a716-446655440001';

  // ============================================================================
  // 출고 항목 스키마 테스트
  // ============================================================================
  describe('shipmentItemSchema', () => {
    it('유효한 출고 항목 통과', () => {
      const result = shipmentItemSchema.safeParse({
        productId: validUUID,
        quantity: 10,
      });
      expect(result.success).toBe(true);
    });

    it('lotId 옵셔널로 통과', () => {
      const result = shipmentItemSchema.safeParse({
        productId: validUUID,
        quantity: 10,
        lotId: validUUID2,
      });
      expect(result.success).toBe(true);
    });

    it('잘못된 productId 실패', () => {
      const result = shipmentItemSchema.safeParse({
        productId: 'invalid',
        quantity: 10,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('productId');
      }
    });

    it('수량 0 이하 실패', () => {
      const result = shipmentItemSchema.safeParse({
        productId: validUUID,
        quantity: 0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('quantity');
      }
    });

    it('소수점 수량 실패', () => {
      const result = shipmentItemSchema.safeParse({
        productId: validUUID,
        quantity: 1.5,
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 출고 항목 목록 스키마 테스트
  // ============================================================================
  describe('shipmentItemsSchema', () => {
    it('1개 이상 항목 통과', () => {
      const result = shipmentItemsSchema.safeParse([
        { productId: validUUID, quantity: 10 },
      ]);
      expect(result.success).toBe(true);
    });

    it('여러 항목 통과', () => {
      const result = shipmentItemsSchema.safeParse([
        { productId: validUUID, quantity: 10 },
        { productId: validUUID2, quantity: 20 },
      ]);
      expect(result.success).toBe(true);
    });

    it('빈 배열 실패', () => {
      const result = shipmentItemsSchema.safeParse([]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('최소 1개');
      }
    });

    it('잘못된 항목이 하나라도 있으면 실패', () => {
      const result = shipmentItemsSchema.safeParse([
        { productId: validUUID, quantity: 10 },
        { productId: 'invalid', quantity: 5 },
      ]);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 출고 생성 스키마 테스트
  // ============================================================================
  describe('shipmentCreateSchema', () => {
    it('유효한 출고 데이터 통과', () => {
      const result = shipmentCreateSchema.safeParse({
        toOrganizationId: validUUID,
        items: [{ productId: validUUID2, quantity: 10 }],
      });
      expect(result.success).toBe(true);
    });

    it('잘못된 toOrganizationId 실패', () => {
      const result = shipmentCreateSchema.safeParse({
        toOrganizationId: 'invalid',
        items: [{ productId: validUUID2, quantity: 10 }],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('toOrganizationId');
      }
    });

    it('빈 items 배열 실패', () => {
      const result = shipmentCreateSchema.safeParse({
        toOrganizationId: validUUID,
        items: [],
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 출고 생성 폼 스키마 테스트
  // ============================================================================
  describe('shipmentCreateFormSchema', () => {
    it('문자열 수량이 숫자로 변환되어 통과', () => {
      const result = shipmentCreateFormSchema.safeParse({
        toOrganizationId: validUUID,
        items: [{ productId: validUUID2, quantity: '10' }],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items[0].quantity).toBe(10);
        expect(typeof result.data.items[0].quantity).toBe('number');
      }
    });

    it('빈 수량 문자열 실패', () => {
      const result = shipmentCreateFormSchema.safeParse({
        toOrganizationId: validUUID,
        items: [{ productId: validUUID2, quantity: '' }],
      });
      expect(result.success).toBe(false);
    });

    it('수량 0 문자열 실패', () => {
      const result = shipmentCreateFormSchema.safeParse({
        toOrganizationId: validUUID,
        items: [{ productId: validUUID2, quantity: '0' }],
      });
      expect(result.success).toBe(false);
    });

    it('lotId 옵셔널 통과', () => {
      const result = shipmentCreateFormSchema.safeParse({
        toOrganizationId: validUUID,
        items: [{ productId: validUUID2, quantity: '10', lotId: validUUID }],
      });
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // 회수 스키마 테스트
  // ============================================================================
  describe('recallSchema', () => {
    it('유효한 회수 데이터 통과', () => {
      const result = recallSchema.safeParse({
        shipmentBatchId: validUUID,
        reason: '제품 불량으로 인한 회수',
      });
      expect(result.success).toBe(true);
    });

    it('빈 회수 사유 실패', () => {
      const result = recallSchema.safeParse({
        shipmentBatchId: validUUID,
        reason: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('reason');
      }
    });

    it('500자 초과 회수 사유 실패', () => {
      const result = recallSchema.safeParse({
        shipmentBatchId: validUUID,
        reason: 'a'.repeat(501),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('500자');
      }
    });

    it('정확히 500자 회수 사유 통과', () => {
      const result = recallSchema.safeParse({
        shipmentBatchId: validUUID,
        reason: 'a'.repeat(500),
      });
      expect(result.success).toBe(true);
    });

    it('잘못된 shipmentBatchId 실패', () => {
      const result = recallSchema.safeParse({
        shipmentBatchId: 'invalid',
        reason: '회수 사유',
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 회수 가능 여부 확인 스키마 테스트
  // ============================================================================
  describe('recallCheckSchema', () => {
    it('유효한 shipmentBatchId 통과', () => {
      const result = recallCheckSchema.safeParse({
        shipmentBatchId: validUUID,
      });
      expect(result.success).toBe(true);
    });

    it('잘못된 shipmentBatchId 실패', () => {
      const result = recallCheckSchema.safeParse({
        shipmentBatchId: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 출고 이력 조회 스키마 테스트
  // ============================================================================
  describe('shipmentHistoryQuerySchema', () => {
    it('기본값으로 빈 객체 통과', () => {
      const result = shipmentHistoryQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(20);
      }
    });

    it('모든 필터 옵션 통과', () => {
      const result = shipmentHistoryQuerySchema.safeParse({
        page: 2,
        pageSize: 50,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        toOrganizationId: validUUID,
        isRecalled: false,
      });
      expect(result.success).toBe(true);
    });

    it('page 0 이하 실패', () => {
      const result = shipmentHistoryQuerySchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it('pageSize 100 초과 실패', () => {
      const result = shipmentHistoryQuerySchema.safeParse({ pageSize: 101 });
      expect(result.success).toBe(false);
    });

    it('isRecalled true 통과', () => {
      const result = shipmentHistoryQuerySchema.safeParse({
        isRecalled: true,
      });
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // 출고 상세 조회 스키마 테스트
  // ============================================================================
  describe('shipmentDetailQuerySchema', () => {
    it('유효한 shipmentBatchId 통과', () => {
      const result = shipmentDetailQuerySchema.safeParse({
        shipmentBatchId: validUUID,
      });
      expect(result.success).toBe(true);
    });

    it('잘못된 shipmentBatchId 실패', () => {
      const result = shipmentDetailQuerySchema.safeParse({
        shipmentBatchId: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 장바구니 아이템 스키마 테스트
  // ============================================================================
  describe('cartItemSchema', () => {
    it('유효한 장바구니 아이템 통과', () => {
      const result = cartItemSchema.safeParse({
        productId: validUUID,
        productName: '테스트 제품',
        quantity: 10,
        availableQuantity: 100,
      });
      expect(result.success).toBe(true);
    });

    it('lotId, lotNumber 옵셔널 통과', () => {
      const result = cartItemSchema.safeParse({
        productId: validUUID,
        productName: '테스트 제품',
        quantity: 10,
        lotId: validUUID2,
        lotNumber: 'LOT-001',
        availableQuantity: 100,
      });
      expect(result.success).toBe(true);
    });

    it('availableQuantity 0 통과', () => {
      const result = cartItemSchema.safeParse({
        productId: validUUID,
        productName: '테스트 제품',
        quantity: 1,
        availableQuantity: 0,
      });
      expect(result.success).toBe(true);
    });

    it('availableQuantity 음수 실패', () => {
      const result = cartItemSchema.safeParse({
        productId: validUUID,
        productName: '테스트 제품',
        quantity: 1,
        availableQuantity: -1,
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 장바구니 추가 스키마 테스트
  // ============================================================================
  describe('addToCartSchema', () => {
    it('유효한 추가 데이터 통과', () => {
      const result = addToCartSchema.safeParse({
        productId: validUUID,
        quantity: 5,
      });
      expect(result.success).toBe(true);
    });

    it('lotId 옵셔널 통과', () => {
      const result = addToCartSchema.safeParse({
        productId: validUUID,
        quantity: 5,
        lotId: validUUID2,
      });
      expect(result.success).toBe(true);
    });

    it('수량 0 이하 실패', () => {
      const result = addToCartSchema.safeParse({
        productId: validUUID,
        quantity: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 장바구니 수량 수정 스키마 테스트
  // ============================================================================
  describe('updateCartItemSchema', () => {
    it('유효한 수정 데이터 통과', () => {
      const result = updateCartItemSchema.safeParse({
        productId: validUUID,
        quantity: 20,
      });
      expect(result.success).toBe(true);
    });

    it('수량 0 이하 실패', () => {
      const result = updateCartItemSchema.safeParse({
        productId: validUUID,
        quantity: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 장바구니 제거 스키마 테스트
  // ============================================================================
  describe('removeFromCartSchema', () => {
    it('유효한 productId 통과', () => {
      const result = removeFromCartSchema.safeParse({
        productId: validUUID,
      });
      expect(result.success).toBe(true);
    });

    it('잘못된 productId 실패', () => {
      const result = removeFromCartSchema.safeParse({
        productId: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });
});
