/**
 * admin.ts Zod 스키마 단위 테스트
 *
 * 관리자 기능 검증 스키마 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  adminOrganizationQuerySchema,
  adminOrganizationStatusUpdateSchema,
  adminOrganizationRejectSchema,
  adminHistoryQuerySchema,
  adminHistoryQueryFormSchema,
  adminRecallQuerySchema,
  adminRecallQueryFormSchema,
} from '@/lib/validations/admin';

describe('admin.ts Zod 스키마', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  // ============================================================================
  // 조직 관리 스키마 테스트
  // ============================================================================
  describe('adminOrganizationQuerySchema', () => {
    it('기본값이 적용된 빈 객체 통과', () => {
      const result = adminOrganizationQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(20);
      }
    });

    it('z.coerce로 문자열→숫자 변환', () => {
      const result = adminOrganizationQuerySchema.safeParse({
        page: '5',
        pageSize: '30',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
        expect(result.data.pageSize).toBe(30);
      }
    });

    it('page 최소값 1 검증', () => {
      const result = adminOrganizationQuerySchema.safeParse({
        page: 0,
      });
      expect(result.success).toBe(false);
    });

    it('pageSize 최대값 100 검증', () => {
      const result = adminOrganizationQuerySchema.safeParse({
        pageSize: 101,
      });
      expect(result.success).toBe(false);
    });

    it('유효한 status 필터 통과', () => {
      const statuses = ['PENDING_APPROVAL', 'ACTIVE', 'INACTIVE', 'DELETED'];
      statuses.forEach((status) => {
        const result = adminOrganizationQuerySchema.safeParse({ status });
        expect(result.success).toBe(true);
      });
    });

    it('유효한 type 필터 통과 (ADMIN 제외)', () => {
      const types = ['MANUFACTURER', 'DISTRIBUTOR', 'HOSPITAL'];
      types.forEach((type) => {
        const result = adminOrganizationQuerySchema.safeParse({ type });
        expect(result.success).toBe(true);
      });
    });

    it('ADMIN type은 실패', () => {
      const result = adminOrganizationQuerySchema.safeParse({
        type: 'ADMIN',
      });
      expect(result.success).toBe(false);
    });

    it('검색어 필터 통과', () => {
      const result = adminOrganizationQuerySchema.safeParse({
        search: '테스트 회사',
      });
      expect(result.success).toBe(true);
    });

    it('모든 필터 조합 통과', () => {
      const result = adminOrganizationQuerySchema.safeParse({
        page: 2,
        pageSize: 50,
        status: 'ACTIVE',
        type: 'MANUFACTURER',
        search: '제조',
      });
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // 조직 상태 변경 스키마 테스트
  // ============================================================================
  describe('adminOrganizationStatusUpdateSchema', () => {
    it('ACTIVE 상태 변경 통과', () => {
      const result = adminOrganizationStatusUpdateSchema.safeParse({
        organizationId: validUUID,
        status: 'ACTIVE',
      });
      expect(result.success).toBe(true);
    });

    it('INACTIVE 상태 변경 통과', () => {
      const result = adminOrganizationStatusUpdateSchema.safeParse({
        organizationId: validUUID,
        status: 'INACTIVE',
      });
      expect(result.success).toBe(true);
    });

    it('DELETED 상태 변경 통과', () => {
      const result = adminOrganizationStatusUpdateSchema.safeParse({
        organizationId: validUUID,
        status: 'DELETED',
      });
      expect(result.success).toBe(true);
    });

    it('PENDING_APPROVAL 상태로 변경 실패 (승인 대기는 허용 안됨)', () => {
      const result = adminOrganizationStatusUpdateSchema.safeParse({
        organizationId: validUUID,
        status: 'PENDING_APPROVAL',
      });
      expect(result.success).toBe(false);
    });

    it('잘못된 UUID 형식 실패', () => {
      const result = adminOrganizationStatusUpdateSchema.safeParse({
        organizationId: 'invalid-uuid',
        status: 'ACTIVE',
      });
      expect(result.success).toBe(false);
    });

    it('누락된 필드 실패', () => {
      const result = adminOrganizationStatusUpdateSchema.safeParse({
        organizationId: validUUID,
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 조직 거부 스키마 테스트
  // ============================================================================
  describe('adminOrganizationRejectSchema', () => {
    it('사유 없이 거부 통과', () => {
      const result = adminOrganizationRejectSchema.safeParse({
        organizationId: validUUID,
      });
      expect(result.success).toBe(true);
    });

    it('사유와 함께 거부 통과', () => {
      const result = adminOrganizationRejectSchema.safeParse({
        organizationId: validUUID,
        reason: '서류 미비',
      });
      expect(result.success).toBe(true);
    });

    it('500자 초과 사유 실패', () => {
      const result = adminOrganizationRejectSchema.safeParse({
        organizationId: validUUID,
        reason: 'a'.repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it('500자 사유 통과', () => {
      const result = adminOrganizationRejectSchema.safeParse({
        organizationId: validUUID,
        reason: 'a'.repeat(500),
      });
      expect(result.success).toBe(true);
    });

    it('잘못된 UUID 실패', () => {
      const result = adminOrganizationRejectSchema.safeParse({
        organizationId: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 전체 이력 조회 스키마 테스트
  // ============================================================================
  describe('adminHistoryQuerySchema', () => {
    it('기본값이 적용된 빈 객체 통과', () => {
      const result = adminHistoryQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(50);
        expect(result.data.includeRecalled).toBe(true);
      }
    });

    it('z.coerce로 문자열→숫자 변환', () => {
      const result = adminHistoryQuerySchema.safeParse({
        page: '3',
        pageSize: '25',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.pageSize).toBe(25);
      }
    });

    it('기간 필터 통과', () => {
      const result = adminHistoryQuerySchema.safeParse({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });
      expect(result.success).toBe(true);
    });

    it('유효한 currentStatus 필터 통과', () => {
      const statuses = ['IN_STOCK', 'USED', 'DISPOSED'];
      statuses.forEach((status) => {
        const result = adminHistoryQuerySchema.safeParse({ currentStatus: status });
        expect(result.success).toBe(true);
      });
    });

    it('잘못된 currentStatus 실패', () => {
      const result = adminHistoryQuerySchema.safeParse({
        currentStatus: 'INVALID_STATUS',
      });
      expect(result.success).toBe(false);
    });

    it('UUID 필터 통과', () => {
      const result = adminHistoryQuerySchema.safeParse({
        currentOwnerId: validUUID,
        originalProducerId: validUUID,
        productId: validUUID,
      });
      expect(result.success).toBe(true);
    });

    it('잘못된 UUID 필터 실패', () => {
      const result = adminHistoryQuerySchema.safeParse({
        currentOwnerId: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('includeRecalled 불리언 변환', () => {
      const result = adminHistoryQuerySchema.safeParse({
        includeRecalled: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeRecalled).toBe(false);
      }
    });

    it('모든 필터 조합 통과', () => {
      const result = adminHistoryQuerySchema.safeParse({
        page: 2,
        pageSize: 100,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        currentStatus: 'IN_STOCK',
        currentOwnerId: validUUID,
        originalProducerId: validUUID,
        productId: validUUID,
        includeRecalled: false,
      });
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // 전체 이력 조회 폼 스키마 테스트
  // ============================================================================
  describe('adminHistoryQueryFormSchema', () => {
    it('기본값이 적용된 빈 객체 통과', () => {
      const result = adminHistoryQueryFormSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(50);
        expect(result.data.includeRecalled).toBe(true);
      }
    });

    it('문자열 필드 그대로 유지', () => {
      const result = adminHistoryQueryFormSchema.safeParse({
        currentStatus: 'IN_STOCK',
        currentOwnerId: validUUID,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currentStatus).toBe('IN_STOCK');
      }
    });

    it('includeRecalled "false" 문자열 → false 변환', () => {
      const result = adminHistoryQueryFormSchema.safeParse({
        includeRecalled: 'false',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeRecalled).toBe(false);
      }
    });

    it('includeRecalled "true" 문자열 → true 변환', () => {
      const result = adminHistoryQueryFormSchema.safeParse({
        includeRecalled: 'true',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeRecalled).toBe(true);
      }
    });

    it('includeRecalled 빈 문자열 → true 변환', () => {
      const result = adminHistoryQueryFormSchema.safeParse({
        includeRecalled: '',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeRecalled).toBe(true);
      }
    });
  });

  // ============================================================================
  // 회수 모니터링 스키마 테스트
  // ============================================================================
  describe('adminRecallQuerySchema', () => {
    it('기본값이 적용된 빈 객체 통과', () => {
      const result = adminRecallQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(20);
        expect(result.data.type).toBe('all');
      }
    });

    it('z.coerce로 문자열→숫자 변환', () => {
      const result = adminRecallQuerySchema.safeParse({
        page: '10',
        pageSize: '50',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(10);
        expect(result.data.pageSize).toBe(50);
      }
    });

    it('기간 필터 통과', () => {
      const result = adminRecallQuerySchema.safeParse({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });
      expect(result.success).toBe(true);
    });

    it('유형 필터 "shipment" 통과', () => {
      const result = adminRecallQuerySchema.safeParse({
        type: 'shipment',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('shipment');
      }
    });

    it('유형 필터 "treatment" 통과', () => {
      const result = adminRecallQuerySchema.safeParse({
        type: 'treatment',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('treatment');
      }
    });

    it('유형 필터 "all" 통과', () => {
      const result = adminRecallQuerySchema.safeParse({
        type: 'all',
      });
      expect(result.success).toBe(true);
    });

    it('잘못된 유형 필터 실패', () => {
      const result = adminRecallQuerySchema.safeParse({
        type: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('모든 필터 조합 통과', () => {
      const result = adminRecallQuerySchema.safeParse({
        page: 3,
        pageSize: 25,
        startDate: '2024-06-01',
        endDate: '2024-06-30',
        type: 'shipment',
      });
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // 회수 모니터링 폼 스키마 테스트
  // ============================================================================
  describe('adminRecallQueryFormSchema', () => {
    it('기본값이 적용된 빈 객체 통과', () => {
      const result = adminRecallQueryFormSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(20);
        expect(result.data.type).toBe('all');
      }
    });

    it('type 문자열 그대로 유지', () => {
      const result = adminRecallQueryFormSchema.safeParse({
        type: 'shipment',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('shipment');
      }
    });

    it('모든 필드 통과', () => {
      const result = adminRecallQueryFormSchema.safeParse({
        page: '2',
        pageSize: '30',
        startDate: '2024-01-01',
        endDate: '2024-06-30',
        type: 'treatment',
      });
      expect(result.success).toBe(true);
    });
  });
});
