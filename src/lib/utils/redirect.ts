/**
 * Redirect 경로 검증 유틸리티
 *
 * Open Redirect 취약점 방지를 위해 redirect 경로를 검증합니다.
 */

import { PROTECTED_ROUTES } from '@/constants/routes';

/**
 * 허용된 redirect 경로 접두사
 * 보호된 라우트(대시보드)만 허용합니다.
 */
const ALLOWED_PREFIXES = [
  PROTECTED_ROUTES.MANUFACTURER,
  PROTECTED_ROUTES.DISTRIBUTOR,
  PROTECTED_ROUTES.HOSPITAL,
  PROTECTED_ROUTES.ADMIN,
] as const;

/**
 * Redirect 경로 검증
 *
 * 악의적인 redirect를 방지하기 위해 경로를 검증합니다.
 *
 * @param path 검증할 경로
 * @returns 유효한 경로면 경로 반환, 아니면 null
 *
 * @example
 * ```ts
 * validateRedirectPath('/manufacturer/dashboard') // '/manufacturer/dashboard'
 * validateRedirectPath('https://evil.com')        // null
 * validateRedirectPath('//evil.com')              // null
 * validateRedirectPath('/login')                  // null (허용된 접두사 아님)
 * ```
 */
export function validateRedirectPath(path: string | null): string | null {
  if (!path) {
    return null;
  }

  // 1. '/'로 시작해야 함 (상대 경로)
  if (!path.startsWith('/')) {
    return null;
  }

  // 2. '//'로 시작하면 안 됨 (프로토콜 상대 URL)
  if (path.startsWith('//')) {
    return null;
  }

  // 3. 프로토콜이 포함된 URL 거부 (예: /javascript:, /data:)
  if (/^\/[a-z]+:/i.test(path)) {
    return null;
  }

  // 4. 경로 탐색 방지
  if (path.includes('..') || path.includes('%2e%2e') || path.includes('%2E%2E')) {
    return null;
  }

  // 5. 허용된 접두사로 시작하는지 확인
  const isAllowed = ALLOWED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );

  if (!isAllowed) {
    return null;
  }

  return path;
}

/**
 * 안전한 redirect 경로 반환
 *
 * 검증된 경로 또는 기본 경로를 반환합니다.
 *
 * @param requestedPath 요청된 redirect 경로
 * @param defaultPath 기본 경로 (검증 실패 시)
 * @returns 안전한 redirect 경로
 *
 * @example
 * ```ts
 * getSafeRedirectPath('/manufacturer/dashboard', '/default')
 * // '/manufacturer/dashboard'
 *
 * getSafeRedirectPath('https://evil.com', '/default')
 * // '/default'
 * ```
 */
export function getSafeRedirectPath(
  requestedPath: string | null,
  defaultPath: string
): string {
  const validated = validateRedirectPath(requestedPath);
  return validated ?? defaultPath;
}
