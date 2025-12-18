/**
 * 공통 서비스 (SSOT - Single Source of Truth)
 *
 * 여러 서비스에서 공통으로 사용되는 유틸리티 함수들을 중앙화합니다.
 * 이 파일의 함수들은 다른 서비스에서 import하여 사용해야 합니다.
 */

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types/api.types';
import type { PostgrestError } from '@supabase/supabase-js';

// ============================================================================
// 상수
// ============================================================================

const MIN_PHONE_LENGTH = 4;
const DEFAULT_MASKED_PHONE = '****';

// ============================================================================
// 에러 처리 유틸리티 (ApiResponse 표준화)
// ============================================================================

/**
 * 표준 에러 코드
 */
export const ERROR_CODES = {
  // 일반 에러
  UNKNOWN: 'UNKNOWN_ERROR',
  QUERY_ERROR: 'QUERY_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // 인증/권한 에러
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // 비즈니스 로직 에러
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  RECALL_WINDOW_EXPIRED: 'RECALL_WINDOW_EXPIRED',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * 성공 응답 생성
 */
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * 실패 응답 생성
 */
export function createErrorResponse<T = never>(
  code: ErrorCode | string,
  message: string,
  details?: Record<string, string[]>
): ApiResponse<T> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

/**
 * PostgrestError를 ApiResponse로 변환
 */
export function handlePostgrestError<T = never>(
  error: PostgrestError,
  defaultMessage = '데이터 처리 중 오류가 발생했습니다.'
): ApiResponse<T> {
  console.error('Postgrest 에러:', error);

  // 특정 에러 코드 매핑
  if (error.code === '23505') {
    return createErrorResponse(ERROR_CODES.DUPLICATE_ENTRY, '중복된 데이터가 존재합니다.');
  }
  if (error.code === '23503') {
    return createErrorResponse(ERROR_CODES.NOT_FOUND, '참조된 데이터를 찾을 수 없습니다.');
  }
  if (error.code === 'PGRST116') {
    return createErrorResponse(ERROR_CODES.NOT_FOUND, '데이터를 찾을 수 없습니다.');
  }

  return createErrorResponse(
    ERROR_CODES.QUERY_ERROR,
    error.message || defaultMessage
  );
}

/**
 * 일반 에러를 ApiResponse로 변환
 */
export function handleGenericError<T = never>(
  error: unknown,
  defaultMessage = '알 수 없는 오류가 발생했습니다.'
): ApiResponse<T> {
  console.error('일반 에러:', error);

  if (error instanceof Error) {
    return createErrorResponse(ERROR_CODES.UNKNOWN, error.message);
  }

  return createErrorResponse(ERROR_CODES.UNKNOWN, defaultMessage);
}

/**
 * 권한 없음 응답
 */
export function createUnauthorizedResponse<T = never>(
  message = '로그인이 필요합니다.'
): ApiResponse<T> {
  return createErrorResponse(ERROR_CODES.UNAUTHORIZED, message);
}

/**
 * 접근 거부 응답
 */
export function createForbiddenResponse<T = never>(
  message = '접근 권한이 없습니다.'
): ApiResponse<T> {
  return createErrorResponse(ERROR_CODES.FORBIDDEN, message);
}

/**
 * 데이터 없음 응답
 */
export function createNotFoundResponse<T = never>(
  message = '데이터를 찾을 수 없습니다.'
): ApiResponse<T> {
  return createErrorResponse(ERROR_CODES.NOT_FOUND, message);
}

// ============================================================================
// 조직 관련 유틸리티
// ============================================================================

/**
 * 조직 이름 조회 (캐시 활용)
 *
 * @param supabase Supabase 클라이언트
 * @param orgId 조직 ID
 * @param cache 캐시 Map (선택, 동일 요청 내 재사용)
 * @returns 조직 이름 또는 '알 수 없음'
 */
export async function getOrganizationName(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  cache?: Map<string, string>
): Promise<string> {
  // 캐시 확인
  if (cache?.has(orgId)) {
    return cache.get(orgId)!;
  }

  const { data } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single();

  const name = data?.name || '알 수 없음';

  // 캐시에 저장
  if (cache) {
    cache.set(orgId, name);
  }

  return name;
}

/**
 * 여러 조직 이름 일괄 조회
 * 많은 조직을 조회할 때 사용하면 효율적입니다.
 *
 * @param orgIds 조직 ID 배열
 * @returns 조직 ID -> 이름 Map
 */
export async function getOrganizationNames(
  orgIds: string[]
): Promise<Map<string, string>> {
  if (orgIds.length === 0) {
    return new Map();
  }

  const supabase = await createClient();
  const uniqueIds = [...new Set(orgIds)];

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name')
    .in('id', uniqueIds);

  if (error) {
    console.error('조직 이름 일괄 조회 실패:', error);
    return new Map();
  }

  const result = new Map<string, string>();
  for (const row of data || []) {
    result.set(row.id, row.name);
  }

  return result;
}

/**
 * 조직 이름 캐시 생성
 * 동일 요청 내에서 여러 번 조직 이름을 조회할 때 사용합니다.
 *
 * @returns 빈 캐시 Map
 */
export function createOrganizationNameCache(): Map<string, string> {
  return new Map<string, string>();
}

// ============================================================================
// 개인정보 마스킹 유틸리티
// ============================================================================

/**
 * 전화번호 마스킹
 * 마지막 4자리만 표시하고 나머지는 마스킹합니다.
 *
 * @param phone 원본 전화번호
 * @returns 마스킹된 전화번호 (예: ***-****-1234)
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < MIN_PHONE_LENGTH) {
    return DEFAULT_MASKED_PHONE;
  }
  return `***-****-${phone.slice(-MIN_PHONE_LENGTH)}`;
}

/**
 * 이메일 마스킹
 * @ 앞부분의 일부만 표시합니다.
 *
 * @param email 원본 이메일
 * @returns 마스킹된 이메일 (예: te***@example.com)
 */
export function maskEmail(email: string): string {
  if (!email?.includes('@')) {
    return '***@***';
  }

  const parts = email.split('@');
  const local = parts[0] || '';
  const domain = parts[1] || '';

  if (local.length <= 2) {
    return `${local[0] || '*'}***@${domain}`;
  }

  return `${local.slice(0, 2)}***@${domain}`;
}

// ============================================================================
// 소유자 정보 포맷팅
// ============================================================================

/**
 * 소유자 타입에 따른 이름 반환
 *
 * @param ownerType 소유자 타입 ('ORGANIZATION' | 'PATIENT')
 * @param ownerId 소유자 ID
 * @param supabase Supabase 클라이언트 (조직 조회용)
 * @param cache 조직 이름 캐시
 * @returns 포맷팅된 소유자 이름
 */
export async function getOwnerDisplayName(
  ownerType: 'ORGANIZATION' | 'PATIENT' | string,
  ownerId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  cache?: Map<string, string>
): Promise<string> {
  if (ownerType === 'PATIENT') {
    return maskPhoneNumber(ownerId);
  }

  return getOrganizationName(supabase, ownerId, cache);
}

/**
 * 소유자 정보 객체 생성
 *
 * @param ownerType 소유자 타입
 * @param ownerId 소유자 ID
 * @param supabase Supabase 클라이언트
 * @param cache 조직 이름 캐시
 * @returns 소유자 정보 객체 또는 undefined
 */
export async function formatOwnerInfo(
  ownerType: string | null,
  ownerId: string | null,
  supabase: Awaited<ReturnType<typeof createClient>>,
  cache?: Map<string, string>
): Promise<{ type: 'ORGANIZATION' | 'PATIENT'; id: string; name: string } | undefined> {
  if (!ownerType || !ownerId) {
    return undefined;
  }

  const type = ownerType as 'ORGANIZATION' | 'PATIENT';
  const name = await getOwnerDisplayName(type, ownerId, supabase, cache);

  return { type, id: ownerId, name };
}

// ============================================================================
// 액션 타입 라벨
// ============================================================================

/**
 * 이력 액션 타입 라벨
 */
export const ACTION_TYPE_LABELS: Record<string, string> = {
  PRODUCED: '생산',
  SHIPPED: '출고',
  RECEIVED: '입고',
  TREATED: '시술',
  RECALLED: '회수',
  DISPOSED: '폐기',
};

/**
 * 액션 타입에 대한 한글 라벨 반환
 *
 * @param actionType 액션 타입
 * @returns 한글 라벨
 */
export function getActionTypeLabel(actionType: string): string {
  return ACTION_TYPE_LABELS[actionType] || actionType;
}

// ============================================================================
// 날짜/시간 유틸리티
// ============================================================================

/**
 * 분 단위 그룹 키 생성
 * 이력 그룹화에 사용됩니다.
 *
 * @param timestamp ISO 타임스탬프
 * @returns 분 단위로 잘린 문자열 (YYYY-MM-DDTHH:mm)
 */
export function getMinuteGroupKey(timestamp: string): string {
  return timestamp.slice(0, 16); // YYYY-MM-DDTHH:mm
}

// ============================================================================
// RPC 결과 Zod 검증 유틸리티
// ============================================================================

/**
 * RPC 검증 결과 타입
 */
export type RpcValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * RPC 결과를 Zod 스키마로 검증
 *
 * @param schema Zod 스키마
 * @param data RPC 반환 데이터
 * @param context 로깅용 컨텍스트 문자열
 * @returns 검증 성공 시 data, 실패 시 error 메시지
 *
 * @example
 * const parsed = parseRpcResult(ManufacturerStatsRowSchema.array(), data, 'get_dashboard_stats_manufacturer');
 * if (!parsed.success) {
 *   return createErrorResponse('VALIDATION_ERROR', parsed.error);
 * }
 * const typedData = parsed.data;
 */
export function parseRpcResult<T>(
  schema: z.ZodType<T>,
  data: unknown,
  context: string
): RpcValidationResult<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const issues = result.error.issues;
    const firstIssue = issues[0];
    const errorPath = firstIssue?.path?.join('.') || 'root';
    const errorMessage = firstIssue?.message || 'Unknown validation error';

    console.error(`[RPC Validation] ${context} failed at '${errorPath}':`, errorMessage);
    console.error('[RPC Validation] Full issues:', JSON.stringify(issues, null, 2));

    return {
      success: false,
      error: `RPC 검증 실패 (${context}): ${errorPath} - ${errorMessage}`,
    };
  }

  return { success: true, data: result.data };
}

/**
 * RPC 배열 결과를 Zod 스키마로 검증 (편의 함수)
 *
 * @param schema 단일 항목 Zod 스키마
 * @param data RPC 반환 데이터 배열
 * @param context 로깅용 컨텍스트 문자열
 * @returns 검증된 배열 또는 에러
 */
export function parseRpcArray<T>(
  schema: z.ZodType<T>,
  data: unknown,
  context: string
): RpcValidationResult<T[]> {
  return parseRpcResult(z.array(schema), data, context);
}

/**
 * RPC 단일 결과를 Zod 스키마로 검증 (배열의 첫 번째 요소)
 *
 * @param schema 단일 항목 Zod 스키마
 * @param data RPC 반환 데이터 배열
 * @param context 로깅용 컨텍스트 문자열
 * @returns 검증된 첫 번째 항목 또는 null
 */
export function parseRpcSingle<T>(
  schema: z.ZodType<T>,
  data: unknown,
  context: string
): RpcValidationResult<T | null> {
  const arrayResult = parseRpcArray(schema, data, context);

  if (!arrayResult.success) {
    return arrayResult;
  }

  return { success: true, data: arrayResult.data[0] ?? null };
}
