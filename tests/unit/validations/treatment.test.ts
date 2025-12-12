/**
 * treatment.ts Zod 스키마 단위 테스트
 *
 * 시술 관련 검증 스키마 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  treatmentItemSchema,
  treatmentItemsSchema,
  treatmentCreateSchema,
  treatmentCreateFormSchema,
  treatmentHistoryQuerySchema,
  treatmentDetailQuerySchema,
  patientTreatmentQuerySchema,
  treatmentRecallSchema,
} from '@/lib/validations/treatment';

describe('treatment.ts Zod 스키마', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';
  const validUUID2 = '660e8400-e29b-41d4-a716-446655440001';

  // ============================================================================
  // 시술 항목 스키마 테스트
  // ============================================================================
  describe('treatmentItemSchema', () => {
    it('유효한 시술 항목 통과', () => {
      const result = treatmentItemSchema.safeParse({
        productId: validUUID,
        quantity: 5,
      });
      expect(result.success).toBe(true);
    });

    it('잘못된 productId 실패', () => {
      const result = treatmentItemSchema.safeParse({
        productId: 'invalid',
        quantity: 5,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('productId');
      }
    });

    it('수량 0 이하 실패', () => {
      const result = treatmentItemSchema.safeParse({
        productId: validUUID,
        quantity: 0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('quantity');
      }
    });

    it('소수점 수량 실패', () => {
      const result = treatmentItemSchema.safeParse({
        productId: validUUID,
        quantity: 2.5,
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 시술 항목 목록 스키마 테스트
  // ============================================================================
  describe('treatmentItemsSchema', () => {
    it('1개 이상 항목 통과', () => {
      const result = treatmentItemsSchema.safeParse([
        { productId: validUUID, quantity: 3 },
      ]);
      expect(result.success).toBe(true);
    });

    it('여러 항목 통과', () => {
      const result = treatmentItemsSchema.safeParse([
        { productId: validUUID, quantity: 3 },
        { productId: validUUID2, quantity: 5 },
      ]);
      expect(result.success).toBe(true);
    });

    it('빈 배열 실패', () => {
      const result = treatmentItemsSchema.safeParse([]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('최소 1개');
      }
    });
  });

  // ============================================================================
  // 시술 등록 스키마 테스트
  // ============================================================================
  describe('treatmentCreateSchema', () => {
    it('유효한 시술 데이터 통과', () => {
      const result = treatmentCreateSchema.safeParse({
        patientPhone: '01012345678',
        treatmentDate: '2024-01-15',
        items: [{ productId: validUUID, quantity: 2 }],
      });
      expect(result.success).toBe(true);
    });

    it('하이픈 포함 전화번호 통과', () => {
      const result = treatmentCreateSchema.safeParse({
        patientPhone: '010-1234-5678',
        treatmentDate: '2024-01-15',
        items: [{ productId: validUUID, quantity: 2 }],
      });
      expect(result.success).toBe(true);
    });

    it('잘못된 전화번호 형식 실패', () => {
      const result = treatmentCreateSchema.safeParse({
        patientPhone: '123456',
        treatmentDate: '2024-01-15',
        items: [{ productId: validUUID, quantity: 2 }],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('patientPhone');
      }
    });

    it('잘못된 날짜 형식 실패', () => {
      const result = treatmentCreateSchema.safeParse({
        patientPhone: '01012345678',
        treatmentDate: '01-15-2024',
        items: [{ productId: validUUID, quantity: 2 }],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('treatmentDate');
      }
    });

    it('빈 items 배열 실패', () => {
      const result = treatmentCreateSchema.safeParse({
        patientPhone: '01012345678',
        treatmentDate: '2024-01-15',
        items: [],
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 시술 등록 폼 스키마 테스트
  // ============================================================================
  describe('treatmentCreateFormSchema', () => {
    it('문자열 수량이 숫자로 변환되어 통과', () => {
      const result = treatmentCreateFormSchema.safeParse({
        patientPhone: '01012345678',
        items: [{ productId: validUUID, quantity: '3' }],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items[0].quantity).toBe(3);
        expect(typeof result.data.items[0].quantity).toBe('number');
      }
    });

    it('treatmentDate 옵셔널 통과', () => {
      const result = treatmentCreateFormSchema.safeParse({
        patientPhone: '01012345678',
        items: [{ productId: validUUID, quantity: '3' }],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.treatmentDate).toBeUndefined();
      }
    });

    it('빈 수량 문자열 실패', () => {
      const result = treatmentCreateFormSchema.safeParse({
        patientPhone: '01012345678',
        items: [{ productId: validUUID, quantity: '' }],
      });
      expect(result.success).toBe(false);
    });

    it('수량 0 문자열 실패', () => {
      const result = treatmentCreateFormSchema.safeParse({
        patientPhone: '01012345678',
        items: [{ productId: validUUID, quantity: '0' }],
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 시술 이력 조회 스키마 테스트
  // ============================================================================
  describe('treatmentHistoryQuerySchema', () => {
    it('기본값으로 빈 객체 통과', () => {
      const result = treatmentHistoryQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(20);
      }
    });

    it('모든 필터 옵션 통과', () => {
      const result = treatmentHistoryQuerySchema.safeParse({
        page: 2,
        pageSize: 50,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        patientPhone: '01012345678',
      });
      expect(result.success).toBe(true);
    });

    it('page 0 이하 실패', () => {
      const result = treatmentHistoryQuerySchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it('pageSize 100 초과 실패', () => {
      const result = treatmentHistoryQuerySchema.safeParse({ pageSize: 101 });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 시술 상세 조회 스키마 테스트
  // ============================================================================
  describe('treatmentDetailQuerySchema', () => {
    it('유효한 treatmentId 통과', () => {
      const result = treatmentDetailQuerySchema.safeParse({
        treatmentId: validUUID,
      });
      expect(result.success).toBe(true);
    });

    it('잘못된 treatmentId 실패', () => {
      const result = treatmentDetailQuerySchema.safeParse({
        treatmentId: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 환자 시술 이력 조회 스키마 테스트
  // ============================================================================
  describe('patientTreatmentQuerySchema', () => {
    it('유효한 환자 전화번호로 조회 통과', () => {
      const result = patientTreatmentQuerySchema.safeParse({
        patientPhone: '01012345678',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(20);
      }
    });

    it('하이픈 포함 전화번호 통과', () => {
      const result = patientTreatmentQuerySchema.safeParse({
        patientPhone: '010-1234-5678',
        page: 2,
      });
      expect(result.success).toBe(true);
    });

    it('잘못된 전화번호 실패', () => {
      const result = patientTreatmentQuerySchema.safeParse({
        patientPhone: 'not-a-phone',
      });
      expect(result.success).toBe(false);
    });

    it('빈 전화번호 실패', () => {
      const result = patientTreatmentQuerySchema.safeParse({
        patientPhone: '',
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 시술 회수 스키마 테스트
  // ============================================================================
  describe('treatmentRecallSchema', () => {
    it('유효한 회수 데이터 통과', () => {
      const result = treatmentRecallSchema.safeParse({
        treatmentId: validUUID,
        reason: '환자 요청으로 인한 회수',
      });
      expect(result.success).toBe(true);
    });

    it('빈 회수 사유 실패', () => {
      const result = treatmentRecallSchema.safeParse({
        treatmentId: validUUID,
        reason: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('reason');
      }
    });

    it('500자 초과 회수 사유 실패', () => {
      const result = treatmentRecallSchema.safeParse({
        treatmentId: validUUID,
        reason: 'a'.repeat(501),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('500자');
      }
    });

    it('정확히 500자 회수 사유 통과', () => {
      const result = treatmentRecallSchema.safeParse({
        treatmentId: validUUID,
        reason: 'a'.repeat(500),
      });
      expect(result.success).toBe(true);
    });

    it('잘못된 treatmentId 실패', () => {
      const result = treatmentRecallSchema.safeParse({
        treatmentId: 'invalid',
        reason: '회수 사유',
      });
      expect(result.success).toBe(false);
    });
  });
});
