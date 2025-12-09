/**
 * 인증 관련 Zod 유효성 검사 스키마
 */

import { z } from 'zod';
import { emailSchema, passwordSchema } from './common';
import { ERROR_MESSAGES } from '@/constants';

// ============================================================================
// 로그인 스키마
// ============================================================================

/**
 * 로그인 폼 스키마
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, ERROR_MESSAGES.GENERAL.REQUIRED_FIELD('비밀번호')),
});

// ============================================================================
// 회원가입 스키마
// ============================================================================

/**
 * 회원가입 기본 스키마 (이메일, 비밀번호)
 */
export const registerCredentialsSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, ERROR_MESSAGES.GENERAL.REQUIRED_FIELD('비밀번호 확인')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  });

// ============================================================================
// 비밀번호 변경 스키마 (2차 개발용)
// ============================================================================

/**
 * 비밀번호 변경 스키마
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, ERROR_MESSAGES.GENERAL.REQUIRED_FIELD('현재 비밀번호')),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, ERROR_MESSAGES.GENERAL.REQUIRED_FIELD('새 비밀번호 확인')),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: '새 비밀번호가 일치하지 않습니다.',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
    path: ['newPassword'],
  });

// ============================================================================
// 타입 추출
// ============================================================================

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterCredentialsData = z.infer<typeof registerCredentialsSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
