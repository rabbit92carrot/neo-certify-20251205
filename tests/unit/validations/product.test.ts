/**
 * product.ts Zod 스키마 단위 테스트
 *
 * 제품 및 Lot 관련 검증 스키마 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  productCreateSchema,
  productUpdateSchema,
  productDeactivateSchema,
  productIdSchema,
  lotCreateSchema,
  lotCreateFormSchema,
  lotQuerySchema,
  productListQuerySchema,
  lotListQuerySchema,
} from '@/lib/validations/product';

describe('product.ts Zod 스키마', () => {
  // ============================================================================
  // 제품 생성 스키마 테스트
  // ============================================================================
  describe('productCreateSchema', () => {
    it('유효한 제품 데이터 통과', () => {
      const result = productCreateSchema.safeParse({
        name: '테스트 제품',
        udiDi: 'UDI-12345678',
        modelName: 'MODEL-A100',
      });
      expect(result.success).toBe(true);
    });

    it('빈 제품명 실패', () => {
      const result = productCreateSchema.safeParse({
        name: '',
        udiDi: 'UDI-12345678',
        modelName: 'MODEL-A100',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name');
      }
    });

    it('빈 UDI-DI 실패', () => {
      const result = productCreateSchema.safeParse({
        name: '테스트 제품',
        udiDi: '',
        modelName: 'MODEL-A100',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('udiDi');
      }
    });

    it('빈 모델명 실패', () => {
      const result = productCreateSchema.safeParse({
        name: '테스트 제품',
        udiDi: 'UDI-12345678',
        modelName: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('modelName');
      }
    });

    it('100자 초과 제품명 실패', () => {
      const result = productCreateSchema.safeParse({
        name: 'a'.repeat(101),
        udiDi: 'UDI-12345678',
        modelName: 'MODEL-A100',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name');
      }
    });

    it('정확히 100자 제품명 통과', () => {
      const result = productCreateSchema.safeParse({
        name: 'a'.repeat(100),
        udiDi: 'UDI-12345678',
        modelName: 'MODEL-A100',
      });
      expect(result.success).toBe(true);
    });

    it('누락된 필드 실패', () => {
      expect(productCreateSchema.safeParse({ name: '테스트' }).success).toBe(false);
      expect(productCreateSchema.safeParse({}).success).toBe(false);
    });
  });

  // ============================================================================
  // 제품 수정 스키마 테스트
  // ============================================================================
  describe('productUpdateSchema', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';

    it('유효한 수정 데이터 통과', () => {
      const result = productUpdateSchema.safeParse({
        id: validUUID,
        name: '수정된 제품명',
      });
      expect(result.success).toBe(true);
    });

    it('ID만 있어도 통과 (모든 수정 필드 옵셔널)', () => {
      const result = productUpdateSchema.safeParse({
        id: validUUID,
      });
      expect(result.success).toBe(true);
    });

    it('잘못된 UUID 실패', () => {
      const result = productUpdateSchema.safeParse({
        id: 'invalid-uuid',
        name: '수정된 제품명',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('id');
      }
    });

    it('모든 수정 필드 포함 통과', () => {
      const result = productUpdateSchema.safeParse({
        id: validUUID,
        name: '수정된 제품명',
        udiDi: 'NEW-UDI-123',
        modelName: 'NEW-MODEL',
      });
      expect(result.success).toBe(true);
    });

    it('빈 문자열 수정 필드 실패', () => {
      const result = productUpdateSchema.safeParse({
        id: validUUID,
        name: '',
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 제품 비활성화 스키마 테스트
  // ============================================================================
  describe('productDeactivateSchema', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';

    it('유효한 UUID 통과', () => {
      const result = productDeactivateSchema.safeParse({ id: validUUID });
      expect(result.success).toBe(true);
    });

    it('잘못된 UUID 실패', () => {
      const result = productDeactivateSchema.safeParse({ id: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });

    it('누락된 ID 실패', () => {
      const result = productDeactivateSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 제품 ID 스키마 테스트
  // ============================================================================
  describe('productIdSchema', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';

    it('유효한 productId 통과', () => {
      const result = productIdSchema.safeParse({ productId: validUUID });
      expect(result.success).toBe(true);
    });

    it('잘못된 productId 실패', () => {
      const result = productIdSchema.safeParse({ productId: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Lot 생성 스키마 테스트
  // ============================================================================
  describe('lotCreateSchema', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';

    it('유효한 Lot 데이터 통과', () => {
      const result = lotCreateSchema.safeParse({
        productId: validUUID,
        quantity: 100,
        manufactureDate: '2024-01-15',
      });
      expect(result.success).toBe(true);
    });

    it('expiryDate 옵셔널 통과', () => {
      const result = lotCreateSchema.safeParse({
        productId: validUUID,
        quantity: 100,
        manufactureDate: '2024-01-15',
        expiryDate: '2025-01-15',
      });
      expect(result.success).toBe(true);
    });

    it('잘못된 productId 실패', () => {
      const result = lotCreateSchema.safeParse({
        productId: 'invalid-uuid',
        quantity: 100,
        manufactureDate: '2024-01-15',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('productId');
      }
    });

    it('수량 0 이하 실패', () => {
      const result = lotCreateSchema.safeParse({
        productId: validUUID,
        quantity: 0,
        manufactureDate: '2024-01-15',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('quantity');
      }
    });

    it('수량 100,000 초과 실패', () => {
      const result = lotCreateSchema.safeParse({
        productId: validUUID,
        quantity: 100001,
        manufactureDate: '2024-01-15',
      });
      expect(result.success).toBe(false);
    });

    it('수량 경계값 (1, 100000) 통과', () => {
      expect(
        lotCreateSchema.safeParse({
          productId: validUUID,
          quantity: 1,
          manufactureDate: '2024-01-15',
        }).success
      ).toBe(true);

      expect(
        lotCreateSchema.safeParse({
          productId: validUUID,
          quantity: 100000,
          manufactureDate: '2024-01-15',
        }).success
      ).toBe(true);
    });

    it('잘못된 날짜 형식 실패', () => {
      const result = lotCreateSchema.safeParse({
        productId: validUUID,
        quantity: 100,
        manufactureDate: '01-15-2024', // 잘못된 형식
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('manufactureDate');
      }
    });
  });

  // ============================================================================
  // Lot 생성 폼 스키마 테스트
  // ============================================================================
  describe('lotCreateFormSchema', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';

    it('문자열 수량이 숫자로 변환되어 통과', () => {
      const result = lotCreateFormSchema.safeParse({
        productId: validUUID,
        quantity: '100',
        manufactureDate: '2024-01-15',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantity).toBe(100);
        expect(typeof result.data.quantity).toBe('number');
      }
    });

    it('빈 수량 문자열 실패', () => {
      const result = lotCreateFormSchema.safeParse({
        productId: validUUID,
        quantity: '',
        manufactureDate: '2024-01-15',
      });
      expect(result.success).toBe(false);
    });

    it('숫자가 아닌 수량 문자열 실패', () => {
      const result = lotCreateFormSchema.safeParse({
        productId: validUUID,
        quantity: 'abc',
        manufactureDate: '2024-01-15',
      });
      expect(result.success).toBe(false);
    });

    it('수량 0 문자열 실패', () => {
      const result = lotCreateFormSchema.safeParse({
        productId: validUUID,
        quantity: '0',
        manufactureDate: '2024-01-15',
      });
      expect(result.success).toBe(false);
    });

    it('수량 100,000 초과 문자열 실패', () => {
      const result = lotCreateFormSchema.safeParse({
        productId: validUUID,
        quantity: '100001',
        manufactureDate: '2024-01-15',
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Lot 조회 스키마 테스트
  // ============================================================================
  describe('lotQuerySchema', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';

    it('모든 필드 옵셔널로 빈 객체 통과', () => {
      const result = lotQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('productId만 있어도 통과', () => {
      const result = lotQuerySchema.safeParse({ productId: validUUID });
      expect(result.success).toBe(true);
    });

    it('lotId만 있어도 통과', () => {
      const result = lotQuerySchema.safeParse({ lotId: validUUID });
      expect(result.success).toBe(true);
    });

    it('둘 다 있어도 통과', () => {
      const result = lotQuerySchema.safeParse({
        productId: validUUID,
        lotId: validUUID,
      });
      expect(result.success).toBe(true);
    });

    it('잘못된 UUID 실패', () => {
      const result = lotQuerySchema.safeParse({ productId: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 제품 목록 조회 스키마 테스트
  // ============================================================================
  describe('productListQuerySchema', () => {
    it('기본값으로 빈 객체 통과', () => {
      const result = productListQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(20);
      }
    });

    it('유효한 페이지네이션 통과', () => {
      const result = productListQuerySchema.safeParse({
        page: 5,
        pageSize: 50,
      });
      expect(result.success).toBe(true);
    });

    it('검색어 통과', () => {
      const result = productListQuerySchema.safeParse({
        search: '테스트 제품',
      });
      expect(result.success).toBe(true);
    });

    it('isActive 필터 통과', () => {
      const result = productListQuerySchema.safeParse({
        isActive: true,
      });
      expect(result.success).toBe(true);
    });

    it('page 0 이하 실패', () => {
      const result = productListQuerySchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it('pageSize 100 초과 실패', () => {
      const result = productListQuerySchema.safeParse({ pageSize: 101 });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Lot 목록 조회 스키마 테스트
  // ============================================================================
  describe('lotListQuerySchema', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';

    it('기본값으로 빈 객체 통과', () => {
      const result = lotListQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(20);
      }
    });

    it('productId 필터 통과', () => {
      const result = lotListQuerySchema.safeParse({
        productId: validUUID,
      });
      expect(result.success).toBe(true);
    });

    it('잘못된 productId 실패', () => {
      const result = lotListQuerySchema.safeParse({
        productId: 'invalid-uuid',
      });
      expect(result.success).toBe(false);
    });

    it('페이지네이션 범위 통과', () => {
      const result = lotListQuerySchema.safeParse({
        page: 10,
        pageSize: 100,
      });
      expect(result.success).toBe(true);
    });
  });
});
