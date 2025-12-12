/**
 * organization.ts Zod 스키마 단위 테스트
 *
 * 조직 관련 검증 스키마 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  organizationTypeSchema,
  allOrganizationTypeSchema,
  organizationInfoSchema,
  organizationRegisterSchema,
  organizationUpdateSchema,
  expiryMonthsSchema,
  manufacturerSettingsSchema,
  manufacturerSettingsUpdateSchema,
  organizationApprovalSchema,
  organizationStatusChangeSchema,
} from '@/lib/validations/organization';

describe('organization.ts Zod 스키마', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  // ============================================================================
  // 조직 유형 스키마 테스트
  // ============================================================================
  describe('organizationTypeSchema', () => {
    it('MANUFACTURER 통과', () => {
      const result = organizationTypeSchema.safeParse('MANUFACTURER');
      expect(result.success).toBe(true);
    });

    it('DISTRIBUTOR 통과', () => {
      const result = organizationTypeSchema.safeParse('DISTRIBUTOR');
      expect(result.success).toBe(true);
    });

    it('HOSPITAL 통과', () => {
      const result = organizationTypeSchema.safeParse('HOSPITAL');
      expect(result.success).toBe(true);
    });

    it('ADMIN은 일반 스키마에서 실패', () => {
      const result = organizationTypeSchema.safeParse('ADMIN');
      expect(result.success).toBe(false);
    });

    it('잘못된 유형 실패', () => {
      const result = organizationTypeSchema.safeParse('INVALID');
      expect(result.success).toBe(false);
    });
  });

  describe('allOrganizationTypeSchema', () => {
    it('모든 유형 통과 (ADMIN 포함)', () => {
      expect(allOrganizationTypeSchema.safeParse('MANUFACTURER').success).toBe(true);
      expect(allOrganizationTypeSchema.safeParse('DISTRIBUTOR').success).toBe(true);
      expect(allOrganizationTypeSchema.safeParse('HOSPITAL').success).toBe(true);
      expect(allOrganizationTypeSchema.safeParse('ADMIN').success).toBe(true);
    });

    it('잘못된 유형 실패', () => {
      const result = allOrganizationTypeSchema.safeParse('UNKNOWN');
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 조직 정보 스키마 테스트
  // ============================================================================
  describe('organizationInfoSchema', () => {
    it('유효한 조직 정보 통과', () => {
      const result = organizationInfoSchema.safeParse({
        name: '테스트 회사',
        businessNumber: '123-45-67890',
        representativeName: '홍길동',
        representativeContact: '010-1234-5678',
        address: '서울시 강남구',
      });
      expect(result.success).toBe(true);
    });

    it('빈 조직명 실패', () => {
      const result = organizationInfoSchema.safeParse({
        name: '',
        businessNumber: '1234567890',
        representativeName: '홍길동',
        representativeContact: '01012345678',
        address: '서울시 강남구',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name');
      }
    });

    it('100자 초과 조직명 실패', () => {
      const result = organizationInfoSchema.safeParse({
        name: 'a'.repeat(101),
        businessNumber: '1234567890',
        representativeName: '홍길동',
        representativeContact: '01012345678',
        address: '서울시 강남구',
      });
      expect(result.success).toBe(false);
    });

    it('잘못된 사업자등록번호 실패', () => {
      const result = organizationInfoSchema.safeParse({
        name: '테스트 회사',
        businessNumber: '12345',
        representativeName: '홍길동',
        representativeContact: '01012345678',
        address: '서울시 강남구',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('businessNumber');
      }
    });

    it('잘못된 전화번호 실패', () => {
      const result = organizationInfoSchema.safeParse({
        name: '테스트 회사',
        businessNumber: '1234567890',
        representativeName: '홍길동',
        representativeContact: 'not-a-phone',
        address: '서울시 강남구',
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 조직 회원가입 스키마 테스트
  // ============================================================================
  describe('organizationRegisterSchema', () => {
    const validRegisterData = {
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      organizationType: 'MANUFACTURER',
      name: '테스트 제조사',
      businessNumber: '123-45-67890',
      representativeName: '김철수',
      representativeContact: '010-1234-5678',
      address: '서울시 강남구 테스트동 123',
    };

    it('유효한 회원가입 데이터 통과', () => {
      const result = organizationRegisterSchema.safeParse(validRegisterData);
      expect(result.success).toBe(true);
    });

    it('비밀번호 불일치 실패', () => {
      const result = organizationRegisterSchema.safeParse({
        ...validRegisterData,
        confirmPassword: 'differentpassword',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('confirmPassword');
        expect(result.error.issues[0].message).toContain('일치');
      }
    });

    it('잘못된 이메일 형식 실패', () => {
      const result = organizationRegisterSchema.safeParse({
        ...validRegisterData,
        email: 'invalid-email',
      });
      expect(result.success).toBe(false);
    });

    it('짧은 비밀번호 실패 (6자 미만)', () => {
      const result = organizationRegisterSchema.safeParse({
        ...validRegisterData,
        password: '12345',
        confirmPassword: '12345',
      });
      expect(result.success).toBe(false);
    });

    it('ADMIN 조직 유형 실패', () => {
      const result = organizationRegisterSchema.safeParse({
        ...validRegisterData,
        organizationType: 'ADMIN',
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 조직 정보 수정 스키마 테스트
  // ============================================================================
  describe('organizationUpdateSchema', () => {
    it('빈 객체 통과 (모든 필드 옵셔널)', () => {
      const result = organizationUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('일부 필드만 수정 통과', () => {
      const result = organizationUpdateSchema.safeParse({
        name: '수정된 회사명',
      });
      expect(result.success).toBe(true);
    });

    it('모든 필드 수정 통과', () => {
      const result = organizationUpdateSchema.safeParse({
        name: '수정된 회사명',
        representativeName: '김영희',
        representativeContact: '010-9876-5432',
        address: '부산시 해운대구',
      });
      expect(result.success).toBe(true);
    });

    it('빈 문자열 조직명 실패', () => {
      const result = organizationUpdateSchema.safeParse({
        name: '',
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 사용기한 개월 수 스키마 테스트
  // ============================================================================
  describe('expiryMonthsSchema', () => {
    it('허용된 개월 수 통과', () => {
      // CONFIG.EXPIRY_MONTH_OPTIONS: [6, 12, 18, 24, 30, 36]
      expect(expiryMonthsSchema.safeParse(6).success).toBe(true);
      expect(expiryMonthsSchema.safeParse(12).success).toBe(true);
      expect(expiryMonthsSchema.safeParse(18).success).toBe(true);
      expect(expiryMonthsSchema.safeParse(24).success).toBe(true);
      expect(expiryMonthsSchema.safeParse(30).success).toBe(true);
      expect(expiryMonthsSchema.safeParse(36).success).toBe(true);
    });

    it('허용되지 않은 개월 수 실패', () => {
      // CONFIG.EXPIRY_MONTH_OPTIONS: [6, 12, 18, 24, 30, 36]
      expect(expiryMonthsSchema.safeParse(3).success).toBe(false);
      expect(expiryMonthsSchema.safeParse(15).success).toBe(false);
      expect(expiryMonthsSchema.safeParse(48).success).toBe(false);
    });

    it('소수점 실패', () => {
      const result = expiryMonthsSchema.safeParse(12.5);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 제조사 설정 스키마 테스트
  // ============================================================================
  describe('manufacturerSettingsSchema', () => {
    it('유효한 설정 데이터 통과', () => {
      const result = manufacturerSettingsSchema.safeParse({
        lotPrefix: 'ABC',
        lotModelDigits: 3,
        lotDateFormat: 'YYMMDD',
        expiryMonths: 24,
      });
      expect(result.success).toBe(true);
    });

    it('빈 lotPrefix 실패', () => {
      const result = manufacturerSettingsSchema.safeParse({
        lotPrefix: '',
        lotModelDigits: 3,
        lotDateFormat: 'YYMMDD',
        expiryMonths: 24,
      });
      expect(result.success).toBe(false);
    });

    it('10자 초과 lotPrefix 실패', () => {
      const result = manufacturerSettingsSchema.safeParse({
        lotPrefix: 'ABCDEFGHIJK',
        lotModelDigits: 3,
        lotDateFormat: 'YYMMDD',
        expiryMonths: 24,
      });
      expect(result.success).toBe(false);
    });

    it('소문자 lotPrefix 실패', () => {
      const result = manufacturerSettingsSchema.safeParse({
        lotPrefix: 'abc',
        lotModelDigits: 3,
        lotDateFormat: 'YYMMDD',
        expiryMonths: 24,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('대문자');
      }
    });

    it('숫자 포함 lotPrefix 실패', () => {
      const result = manufacturerSettingsSchema.safeParse({
        lotPrefix: 'ABC123',
        lotModelDigits: 3,
        lotDateFormat: 'YYMMDD',
        expiryMonths: 24,
      });
      expect(result.success).toBe(false);
    });

    it('lotModelDigits 범위 (1-10) 검증', () => {
      expect(
        manufacturerSettingsSchema.safeParse({
          lotPrefix: 'ABC',
          lotModelDigits: 0,
          lotDateFormat: 'YYMMDD',
          expiryMonths: 24,
        }).success
      ).toBe(false);

      expect(
        manufacturerSettingsSchema.safeParse({
          lotPrefix: 'ABC',
          lotModelDigits: 11,
          lotDateFormat: 'YYMMDD',
          expiryMonths: 24,
        }).success
      ).toBe(false);

      expect(
        manufacturerSettingsSchema.safeParse({
          lotPrefix: 'ABC',
          lotModelDigits: 1,
          lotDateFormat: 'YYMMDD',
          expiryMonths: 24,
        }).success
      ).toBe(true);

      expect(
        manufacturerSettingsSchema.safeParse({
          lotPrefix: 'ABC',
          lotModelDigits: 10,
          lotDateFormat: 'YYMMDD',
          expiryMonths: 24,
        }).success
      ).toBe(true);
    });

    it('빈 lotDateFormat 실패', () => {
      const result = manufacturerSettingsSchema.safeParse({
        lotPrefix: 'ABC',
        lotModelDigits: 3,
        lotDateFormat: '',
        expiryMonths: 24,
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 제조사 설정 수정 스키마 테스트
  // ============================================================================
  describe('manufacturerSettingsUpdateSchema', () => {
    it('빈 객체 통과 (모든 필드 옵셔널)', () => {
      const result = manufacturerSettingsUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('일부 필드만 수정 통과', () => {
      const result = manufacturerSettingsUpdateSchema.safeParse({
        expiryMonths: 36,
      });
      expect(result.success).toBe(true);
    });

    it('잘못된 값은 부분 수정에서도 실패', () => {
      const result = manufacturerSettingsUpdateSchema.safeParse({
        lotPrefix: 'abc', // 소문자 - 실패
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 조직 승인 스키마 테스트
  // ============================================================================
  describe('organizationApprovalSchema', () => {
    it('유효한 organizationId 통과', () => {
      const result = organizationApprovalSchema.safeParse({
        organizationId: validUUID,
      });
      expect(result.success).toBe(true);
    });

    it('잘못된 organizationId 실패', () => {
      const result = organizationApprovalSchema.safeParse({
        organizationId: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 조직 상태 변경 스키마 테스트
  // ============================================================================
  describe('organizationStatusChangeSchema', () => {
    it('ACTIVE 상태 변경 통과', () => {
      const result = organizationStatusChangeSchema.safeParse({
        organizationId: validUUID,
        status: 'ACTIVE',
      });
      expect(result.success).toBe(true);
    });

    it('INACTIVE 상태 변경 통과', () => {
      const result = organizationStatusChangeSchema.safeParse({
        organizationId: validUUID,
        status: 'INACTIVE',
      });
      expect(result.success).toBe(true);
    });

    it('DELETED 상태 변경 통과', () => {
      const result = organizationStatusChangeSchema.safeParse({
        organizationId: validUUID,
        status: 'DELETED',
      });
      expect(result.success).toBe(true);
    });

    it('잘못된 상태 실패', () => {
      const result = organizationStatusChangeSchema.safeParse({
        organizationId: validUUID,
        status: 'PENDING',
      });
      expect(result.success).toBe(false);
    });

    it('잘못된 organizationId 실패', () => {
      const result = organizationStatusChangeSchema.safeParse({
        organizationId: 'invalid',
        status: 'ACTIVE',
      });
      expect(result.success).toBe(false);
    });
  });
});
