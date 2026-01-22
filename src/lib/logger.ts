/**
 * 환경별 로깅 유틸리티
 *
 * 프로덕션에서는 민감한 정보를 제거하고 최소한의 정보만 로깅합니다.
 * 개발 환경에서는 상세한 디버깅 정보를 제공합니다.
 *
 * SSOT: 모든 로깅은 이 유틸리티를 통해 수행되어야 합니다.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  level: LogLevel;
  isDevelopment: boolean;
}

// 환경 변수에서 설정 읽기
const config: LoggerConfig = {
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
  isDevelopment: process.env.NODE_ENV === 'development',
};

// 로그 레벨 우선순위
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// 민감한 키 목록 (O(1) 탐색을 위한 Set)
const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'secret',
  'apikey',
  'authorization',
]);

/**
 * 민감한 정보 제거 (프로덕션용)
 */
function sanitizeForProduction(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    let sanitized = data;

    // 이메일 마스킹 (user@example.com → u***@example.com)
    sanitized = sanitized.replace(
      /([a-zA-Z0-9._-]+)@([a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi,
      (_, local, domain) => `${local.charAt(0)}***@${domain}`
    );

    // 전화번호 마스킹 (010-1234-5678 → 010-****-5678)
    sanitized = sanitized.replace(
      /01[0-9][-\s]?[0-9]{3,4}[-\s]?[0-9]{4}/g,
      (match) => {
        const digits = match.replace(/[-\s]/g, '');
        return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
      }
    );

    // UUID 축약 (550e8400-e29b-41d4-a716-446655440000 → 550e8400...440000)
    sanitized = sanitized.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      (match) => `${match.slice(0, 8)}...${match.slice(-6)}`
    );

    return sanitized;
  }

  if (data instanceof Error) {
    return {
      name: data.name,
      message: sanitizeForProduction(data.message),
      // stack은 프로덕션에서 제외
    };
  }

  if (typeof data === 'object') {
    // PostgrestError 처리
    if ('code' in data && 'message' in data) {
      const obj = data as Record<string, unknown>;
      return {
        code: obj.code,
        message: sanitizeForProduction(obj.message),
        // details, hint 등은 프로덕션에서 제외
      };
    }

    // 배열 처리
    if (Array.isArray(data)) {
      return data.map(sanitizeForProduction);
    }

    // 일반 객체 처리
    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      // 민감한 키는 제외
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        sanitizedObj[key] = '[REDACTED]';
      } else {
        sanitizedObj[key] = sanitizeForProduction(value);
      }
    }
    return sanitizedObj;
  }

  return data;
}

/**
 * 로그 출력 여부 확인
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[config.level];
}

/**
 * 로그 포맷팅
 */
function formatLog(level: LogLevel, context: string, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${context}]`;

  if (data === undefined) {
    return `${prefix} ${message}`;
  }

  const sanitizedData = config.isDevelopment ? data : sanitizeForProduction(data);

  try {
    return `${prefix} ${message} ${JSON.stringify(sanitizedData, null, config.isDevelopment ? 2 : 0)}`;
  } catch {
    return `${prefix} ${message} [Serialization Error]`;
  }
}

/**
 * Logger 인터페이스
 */
export interface Logger {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
}

/**
 * Logger 인스턴스 생성
 *
 * @param context 로깅 컨텍스트 (예: 'auth.service', 'common.service')
 * @returns Logger 인스턴스
 *
 * @example
 * ```typescript
 * const logger = createLogger('auth.service');
 * logger.error('로그인 실패', { email: 'user@example.com', error });
 * ```
 */
export function createLogger(context: string): Logger {
  return {
    debug(message: string, data?: unknown): void {
      if (shouldLog('debug')) {
        console.debug(formatLog('debug', context, message, data));
      }
    },

    info(message: string, data?: unknown): void {
      if (shouldLog('info')) {
        console.info(formatLog('info', context, message, data));
      }
    },

    warn(message: string, data?: unknown): void {
      if (shouldLog('warn')) {
        console.warn(formatLog('warn', context, message, data));
      }
    },

    error(message: string, data?: unknown): void {
      if (shouldLog('error')) {
        // 개발 환경에서는 상세 정보 출력
        if (config.isDevelopment) {
          console.error(formatLog('error', context, message, data));
          if (data instanceof Error && data.stack) {
            console.error(data.stack);
          }
        } else {
          // 프로덕션에서는 sanitize된 정보만 출력
          console.error(formatLog('error', context, message, data));
        }
      }
    },
  };
}

/**
 * 기본 logger 인스턴스 (범용)
 */
export const logger = createLogger('app');
