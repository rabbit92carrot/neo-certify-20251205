/**
 * API 오류 코드 상수
 * SSOT 원칙에 따라 모든 오류 코드를 이 파일에서 관리합니다.
 */

/**
 * 오류 코드 정의
 */
export const ERROR_CODES = {
  // 인증 관련
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // 조직 관련
  ORGANIZATION_NOT_FOUND: 'ORGANIZATION_NOT_FOUND',
  ORGANIZATION_INACTIVE: 'ORGANIZATION_INACTIVE',
  ORGANIZATION_PENDING: 'ORGANIZATION_PENDING',
  DUPLICATE_BUSINESS_NUMBER: 'DUPLICATE_BUSINESS_NUMBER',

  // 재고 관련
  INSUFFICIENT_INVENTORY: 'INSUFFICIENT_INVENTORY',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  LOT_NOT_FOUND: 'LOT_NOT_FOUND',

  // 회수 관련 (시술 회수용 - 병원 주도, 24시간 제한)
  RECALL_TIME_EXCEEDED: 'RECALL_TIME_EXCEEDED',
  RECALL_NOT_ALLOWED: 'RECALL_NOT_ALLOWED',
  ALREADY_RECALLED: 'ALREADY_RECALLED',

  // 반품 관련 (출고 반품용 - 수신자 주도, 시간 제한 없음)
  RETURN_NOT_ALLOWED: 'RETURN_NOT_ALLOWED',
  ALREADY_RETURNED: 'ALREADY_RETURNED',
  NOT_RECEIVER: 'NOT_RECEIVER',
  CODES_NOT_OWNED: 'CODES_NOT_OWNED',

  // 시술 관련
  TREATMENT_NOT_FOUND: 'TREATMENT_NOT_FOUND',
  PATIENT_NOT_FOUND: 'PATIENT_NOT_FOUND',

  // 출고 관련
  SHIPMENT_NOT_FOUND: 'SHIPMENT_NOT_FOUND',
  INVALID_RECIPIENT: 'INVALID_RECIPIENT',

  // 데이터 관련
  QUERY_ERROR: 'QUERY_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

  // 일반
  UNKNOWN: 'UNKNOWN_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
} as const;

/**
 * 오류 코드 타입
 */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * 오류 코드별 기본 메시지 매핑
 */
export const ERROR_CODE_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.UNAUTHORIZED]: '인증이 필요합니다.',
  [ERROR_CODES.FORBIDDEN]: '해당 기능에 대한 접근 권한이 없습니다.',
  [ERROR_CODES.SESSION_EXPIRED]: '세션이 만료되었습니다. 다시 로그인해주세요.',
  [ERROR_CODES.INVALID_CREDENTIALS]: '이메일 또는 비밀번호가 올바르지 않습니다.',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',

  [ERROR_CODES.ORGANIZATION_NOT_FOUND]: '조직을 찾을 수 없습니다.',
  [ERROR_CODES.ORGANIZATION_INACTIVE]: '비활성화된 조직입니다.',
  [ERROR_CODES.ORGANIZATION_PENDING]: '승인 대기 중인 조직입니다.',
  [ERROR_CODES.DUPLICATE_BUSINESS_NUMBER]: '이미 등록된 사업자등록번호입니다.',

  [ERROR_CODES.INSUFFICIENT_INVENTORY]: '재고가 부족합니다.',
  [ERROR_CODES.PRODUCT_NOT_FOUND]: '제품을 찾을 수 없습니다.',
  [ERROR_CODES.LOT_NOT_FOUND]: 'Lot을 찾을 수 없습니다.',

  [ERROR_CODES.RECALL_TIME_EXCEEDED]:
    '24시간 경과하여 처리할 수 없습니다. 관리자에게 연락해주세요.',
  [ERROR_CODES.RECALL_NOT_ALLOWED]: '회수할 수 없는 상태입니다.',
  [ERROR_CODES.ALREADY_RECALLED]: '이미 회수된 건입니다.',

  [ERROR_CODES.RETURN_NOT_ALLOWED]: '반품할 수 없는 상태입니다.',
  [ERROR_CODES.ALREADY_RETURNED]: '이미 반품된 건입니다.',
  [ERROR_CODES.NOT_RECEIVER]: '수신 조직만 반품을 요청할 수 있습니다.',
  [ERROR_CODES.CODES_NOT_OWNED]:
    '일부 제품이 더 이상 현재 조직 소유가 아닙니다. 하위 조직에서 먼저 반품해야 합니다.',

  [ERROR_CODES.TREATMENT_NOT_FOUND]: '시술 기록을 찾을 수 없습니다.',
  [ERROR_CODES.PATIENT_NOT_FOUND]: '환자를 찾을 수 없습니다.',

  [ERROR_CODES.SHIPMENT_NOT_FOUND]: '출고 내역을 찾을 수 없습니다.',
  [ERROR_CODES.INVALID_RECIPIENT]: '유효하지 않은 수신자입니다.',

  [ERROR_CODES.QUERY_ERROR]: '데이터 조회 중 오류가 발생했습니다.',
  [ERROR_CODES.DUPLICATE_ENTRY]: '중복된 데이터가 존재합니다.',

  [ERROR_CODES.UNKNOWN]: '알 수 없는 오류가 발생했습니다.',
  [ERROR_CODES.VALIDATION_ERROR]: '입력값이 올바르지 않습니다.',
  [ERROR_CODES.SERVER_ERROR]: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  [ERROR_CODES.NOT_FOUND]: '요청한 리소스를 찾을 수 없습니다.',
  [ERROR_CODES.BAD_REQUEST]: '잘못된 요청입니다.',
};

/**
 * 오류 코드에 해당하는 메시지 반환
 */
export function getErrorMessage(code: ErrorCode): string {
  return ERROR_CODE_MESSAGES[code] || ERROR_CODE_MESSAGES[ERROR_CODES.SERVER_ERROR];
}
