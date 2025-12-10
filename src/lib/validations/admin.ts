/**
 * 관리자 기능 스키마
 * 조직 관리, 전체 이력, 회수 모니터링용 스키마
 */

import { z } from 'zod';
import { ORGANIZATION_TYPES, ORGANIZATION_STATUSES } from '@/constants/organization';
import { VIRTUAL_CODE_STATUSES } from '@/constants/product';

// ============================================================================
// 조직 관리 스키마
// ============================================================================

/**
 * 관리자 조직 조회 쿼리 스키마
 */
export const adminOrganizationQuerySchema = z.object({
  // 페이지네이션
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),

  // 상태 필터
  status: z
    .enum([
      ORGANIZATION_STATUSES.PENDING_APPROVAL,
      ORGANIZATION_STATUSES.ACTIVE,
      ORGANIZATION_STATUSES.INACTIVE,
      ORGANIZATION_STATUSES.DELETED,
    ])
    .optional(),

  // 타입 필터 (관리자 제외)
  type: z
    .enum([
      ORGANIZATION_TYPES.MANUFACTURER,
      ORGANIZATION_TYPES.DISTRIBUTOR,
      ORGANIZATION_TYPES.HOSPITAL,
    ])
    .optional(),

  // 검색 (조직명, 이메일)
  search: z.string().optional(),
});

/**
 * 조직 상태 변경 스키마
 */
export const adminOrganizationStatusUpdateSchema = z.object({
  organizationId: z.string().uuid(),
  status: z.enum([
    ORGANIZATION_STATUSES.ACTIVE,
    ORGANIZATION_STATUSES.INACTIVE,
    ORGANIZATION_STATUSES.DELETED,
  ]),
});

/**
 * 조직 거부 스키마 (선택적 사유)
 */
export const adminOrganizationRejectSchema = z.object({
  organizationId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

// ============================================================================
// 전체 이력 스키마
// ============================================================================

/**
 * 관리자 전체 이력 조회 쿼리 스키마
 */
export const adminHistoryQuerySchema = z.object({
  // 페이지네이션
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),

  // 기간 필터
  startDate: z.string().optional(),
  endDate: z.string().optional(),

  // 현재 상태 필터
  currentStatus: z
    .enum([
      VIRTUAL_CODE_STATUSES.IN_STOCK,
      VIRTUAL_CODE_STATUSES.USED,
      VIRTUAL_CODE_STATUSES.DISPOSED,
    ])
    .optional(),

  // 현재 소유자 필터
  currentOwnerId: z.string().uuid().optional(),

  // 최초 생산자 필터
  originalProducerId: z.string().uuid().optional(),

  // 제품 종류 필터
  productId: z.string().uuid().optional(),

  // 회수 이력 포함 여부 (기본: true)
  includeRecalled: z.coerce.boolean().optional().default(true),
});

/**
 * 관리자 전체 이력 조회 쿼리 (폼용 - 문자열 변환 포함)
 */
export const adminHistoryQueryFormSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  currentStatus: z.string().optional(),
  currentOwnerId: z.string().optional(),
  originalProducerId: z.string().optional(),
  productId: z.string().optional(),
  includeRecalled: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'false') return false;
      return true;
    }),
});

// ============================================================================
// 회수 모니터링 스키마
// ============================================================================

/**
 * 관리자 회수 조회 쿼리 스키마
 */
export const adminRecallQuerySchema = z.object({
  // 페이지네이션
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),

  // 기간 필터
  startDate: z.string().optional(),
  endDate: z.string().optional(),

  // 유형 필터 (출고 회수 / 시술 회수)
  type: z.enum(['shipment', 'treatment', 'all']).optional().default('all'),
});

/**
 * 관리자 회수 조회 쿼리 (폼용)
 */
export const adminRecallQueryFormSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  type: z.string().optional().default('all'),
});

// ============================================================================
// 타입 추출
// ============================================================================

export type AdminOrganizationQueryData = z.infer<typeof adminOrganizationQuerySchema>;
export type AdminOrganizationStatusUpdateData = z.infer<typeof adminOrganizationStatusUpdateSchema>;
export type AdminOrganizationRejectData = z.infer<typeof adminOrganizationRejectSchema>;
export type AdminHistoryQueryData = z.infer<typeof adminHistoryQuerySchema>;
export type AdminHistoryQueryFormData = z.infer<typeof adminHistoryQueryFormSchema>;
export type AdminRecallQueryData = z.infer<typeof adminRecallQuerySchema>;
export type AdminRecallQueryFormData = z.infer<typeof adminRecallQueryFormSchema>;
