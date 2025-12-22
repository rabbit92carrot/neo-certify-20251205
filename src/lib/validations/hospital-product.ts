/**
 * 병원 제품 관리 관련 Zod 검증 스키마
 */

import { z } from 'zod';
import { uuidSchema } from './common';

// ============================================================================
// 병원 제품 별칭 스키마
// ============================================================================

/**
 * 별칭 스키마
 * - 최대 100자
 * - 빈 문자열은 null로 변환
 * - 앞뒤 공백 제거
 */
export const hospitalProductAliasSchema = z
  .string()
  .max(100, '별칭은 100자를 초과할 수 없습니다.')
  .optional()
  .transform((val) => {
    const trimmed = val?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : null;
  });

// ============================================================================
// 제품 설정 업데이트 스키마
// ============================================================================

/**
 * 제품 설정 업데이트 스키마
 */
export const hospitalProductSettingsSchema = z.object({
  productId: uuidSchema,
  alias: hospitalProductAliasSchema,
  isActive: z.boolean().optional(),
});

export type HospitalProductSettingsData = z.infer<typeof hospitalProductSettingsSchema>;

// ============================================================================
// 쿼리 파라미터 스키마
// ============================================================================

/**
 * Known Products 조회 쿼리 스키마
 */
export const hospitalKnownProductsQuerySchema = z.object({
  search: z.string().optional(),
  aliasFilter: z.enum(['with_alias', 'without_alias']).optional(),
  activeFilter: z.boolean().optional(),
});

export type HospitalKnownProductsQueryData = z.infer<typeof hospitalKnownProductsQuerySchema>;
