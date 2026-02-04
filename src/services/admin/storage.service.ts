/**
 * 스토리지 서비스
 *
 * Supabase Storage 관련 작업을 처리합니다.
 * - 사업자등록증 Signed URL 생성
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';
import { createErrorResponse, createSuccessResponse } from '../common.service';
import type { ApiResponse } from '@/types/api.types';

const logger = createLogger('storage.service');

// ============================================================================
// 상수
// ============================================================================

const BUSINESS_LICENSES_BUCKET = 'business-licenses';
const SIGNED_URL_EXPIRY_SECONDS = 300; // 5분

// ============================================================================
// 타입
// ============================================================================

export interface SignedUrlResult {
  signedUrl: string;
  expiresAt: string;
}

// ============================================================================
// 서비스 함수
// ============================================================================

/**
 * 사업자등록증 Signed URL 생성
 *
 * Private bucket의 파일에 접근하기 위한 임시 URL을 생성합니다.
 * Service Role 키를 사용하므로 RLS를 우회합니다.
 *
 * @param filePath 파일 경로 (예: "userId/business_license.pdf")
 * @returns Signed URL 및 만료 시간
 */
export async function getBusinessLicenseSignedUrl(
  filePath: string
): Promise<ApiResponse<SignedUrlResult>> {
  if (!filePath) {
    return createErrorResponse('VALIDATION_ERROR', '파일 경로가 필요합니다.');
  }

  const adminClient = createAdminClient();

  // Signed URL 생성
  const { data, error } = await adminClient.storage
    .from(BUSINESS_LICENSES_BUCKET)
    .createSignedUrl(filePath, SIGNED_URL_EXPIRY_SECONDS);

  if (error) {
    logger.error('Signed URL 생성 실패', {
      filePath,
      error: error.message,
    });
    return createErrorResponse(
      'STORAGE_ERROR',
      '파일 URL 생성에 실패했습니다. 파일이 존재하지 않을 수 있습니다.'
    );
  }

  if (!data?.signedUrl) {
    return createErrorResponse('STORAGE_ERROR', '파일 URL을 생성할 수 없습니다.');
  }

  const expiresAt = new Date(
    Date.now() + SIGNED_URL_EXPIRY_SECONDS * 1000
  ).toISOString();

  logger.debug('Signed URL 생성 성공', { filePath, expiresAt });

  return createSuccessResponse({
    signedUrl: data.signedUrl,
    expiresAt,
  });
}
