/**
 * auth.ts Zod 스키마 단위 테스트
 *
 * 인증 관련 검증 스키마 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerCredentialsSchema,
  changePasswordSchema,
} from '@/lib/validations/auth';

describe('auth.ts Zod 스키마', () => {
  // ============================================================================
  // 로그인 스키마 테스트
  // ============================================================================
  describe('loginSchema', () => {
    it('유효한 로그인 데이터 통과', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('잘못된 이메일 형식 실패', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email');
      }
    });

    it('빈 이메일 실패', () => {
      const result = loginSchema.safeParse({
        email: '',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('빈 비밀번호 실패', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('password');
      }
    });

    it('누락된 필드 실패', () => {
      expect(loginSchema.safeParse({ email: 'test@example.com' }).success).toBe(false);
      expect(loginSchema.safeParse({ password: 'password123' }).success).toBe(false);
      expect(loginSchema.safeParse({}).success).toBe(false);
    });
  });

  // ============================================================================
  // 회원가입 스키마 테스트
  // ============================================================================
  describe('registerCredentialsSchema', () => {
    it('유효한 회원가입 데이터 통과', () => {
      const result = registerCredentialsSchema.safeParse({
        email: 'newuser@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('비밀번호 불일치 실패', () => {
      const result = registerCredentialsSchema.safeParse({
        email: 'newuser@example.com',
        password: 'password123',
        confirmPassword: 'differentpassword',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('confirmPassword');
        expect(result.error.issues[0].message).toContain('일치');
      }
    });

    it('비밀번호 길이 부족 실패 (6자 미만)', () => {
      const result = registerCredentialsSchema.safeParse({
        email: 'newuser@example.com',
        password: '12345',
        confirmPassword: '12345',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('password');
      }
    });

    it('잘못된 이메일 형식 실패', () => {
      const result = registerCredentialsSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
        confirmPassword: 'password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email');
      }
    });

    it('빈 confirmPassword 실패', () => {
      const result = registerCredentialsSchema.safeParse({
        email: 'newuser@example.com',
        password: 'password123',
        confirmPassword: '',
      });
      expect(result.success).toBe(false);
    });

    it('정확히 6자 비밀번호 통과', () => {
      const result = registerCredentialsSchema.safeParse({
        email: 'newuser@example.com',
        password: '123456',
        confirmPassword: '123456',
      });
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // 비밀번호 변경 스키마 테스트
  // ============================================================================
  describe('changePasswordSchema', () => {
    it('유효한 비밀번호 변경 데이터 통과', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmNewPassword: 'newpassword123',
      });
      expect(result.success).toBe(true);
    });

    it('새 비밀번호 불일치 실패', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmNewPassword: 'differentpassword',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('confirmNewPassword');
      }
    });

    it('현재 비밀번호와 동일한 새 비밀번호 실패', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'samepassword',
        newPassword: 'samepassword',
        confirmNewPassword: 'samepassword',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const newPasswordError = result.error.issues.find(
          (issue) => issue.path.includes('newPassword')
        );
        expect(newPasswordError?.message).toContain('달라야');
      }
    });

    it('빈 현재 비밀번호 실패', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: '',
        newPassword: 'newpassword123',
        confirmNewPassword: 'newpassword123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('currentPassword');
      }
    });

    it('새 비밀번호 길이 부족 실패', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'oldpassword',
        newPassword: '12345',
        confirmNewPassword: '12345',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('newPassword');
      }
    });

    it('빈 confirmNewPassword 실패', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmNewPassword: '',
      });
      expect(result.success).toBe(false);
    });
  });
});
