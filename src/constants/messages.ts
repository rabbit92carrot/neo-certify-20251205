/**
 * 에러 및 성공 메시지 상수 정의
 * SSOT 원칙에 따라 모든 메시지를 이 파일에서 정의합니다.
 */

export const ERROR_MESSAGES = {
  // 인증
  AUTH: {
    LOGIN_FAILED: '이메일 또는 비밀번호가 올바르지 않습니다.',
    UNAUTHORIZED: '해당 기능에 대한 접근 권한이 없습니다.',
    SESSION_EXPIRED: '세션이 만료되었습니다. 다시 로그인해주세요.',
    INVALID_EMAIL: '올바른 이메일 형식이 아닙니다.',
    PASSWORD_TOO_SHORT: '비밀번호는 최소 6자 이상이어야 합니다.',
  },

  // 재고
  INVENTORY: {
    INSUFFICIENT: (current: number): string => `재고가 부족합니다. 현재 재고: ${current}개`,
    EXCEEDED: (max: number): string => `보유 수량을 초과할 수 없습니다. 현재 재고: ${max}개`,
    ZERO: '재고가 부족합니다. 현재 재고: 0개',
  },

  // 수량
  QUANTITY: {
    MIN: '수량은 최소 1개 이상이어야 합니다.',
    MAX_PRODUCTION: '생산 수량은 최대 100,000개까지 입력 가능합니다.',
    INVALID: '올바른 수량을 입력해주세요.',
  },

  // 조직
  ORGANIZATION: {
    DUPLICATE_BUSINESS_NUMBER: '이미 등록된 사업자등록번호입니다.',
    DUPLICATE_NAME: '이미 등록된 조직명입니다. 다른 이름을 사용해주세요.',
    INVALID_BUSINESS_NUMBER: '사업자등록번호 형식이 올바르지 않습니다.',
    NOT_FOUND: '조직을 찾을 수 없습니다.',
  },

  // 회수 (시술 회수용 - 병원 주도, 24시간 제한)
  RECALL: {
    TIME_EXCEEDED: '24시간 경과하여 처리할 수 없습니다. 관리자에게 연락해주세요.',
    REASON_REQUIRED: '회수 사유를 입력해주세요.',
    REASON_MAX_LENGTH: '회수 사유는 500자를 초과할 수 없습니다.',
    ALREADY_RECALLED: '이미 회수된 이관입니다.',
  },

  // 반품 (출고 반품용 - 수신자 주도, 시간 제한 없음)
  RETURN: {
    REASON_REQUIRED: '반품 사유를 입력해주세요.',
    REASON_MAX_LENGTH: '반품 사유는 500자를 초과할 수 없습니다.',
    ALREADY_RETURNED: '이미 반품된 출고입니다.',
    NOT_RECEIVER: '수신 조직만 반품을 요청할 수 있습니다.',
    CODES_NOT_OWNED: '일부 제품이 더 이상 현재 조직 소유가 아닙니다.',
  },

  // 폐기 (병원 자발적 폐기)
  DISPOSAL: {
    ITEMS_MIN: '최소 1개 이상의 제품을 선택해야 합니다.',
    REASON_MAX_LENGTH: '기타 사유는 500자를 초과할 수 없습니다.',
    REASON_REQUIRED: '기타 사유를 입력해주세요.',
  },

  // 파일
  FILE: {
    SIZE_EXCEEDED: '파일 크기는 10MB를 초과할 수 없습니다.',
    INVALID_TYPE: 'PDF, JPG, PNG 파일만 업로드 가능합니다.',
    UPLOAD_FAILED: '파일 업로드에 실패했습니다.',
  },

  // 제품
  PRODUCT: {
    NOT_FOUND: '제품을 찾을 수 없습니다.',
    DUPLICATE: '이미 등록된 제품입니다.',
  },

  // 일반
  GENERAL: {
    INVALID_INPUT: (field: string): string => `${field}을(를) 올바르게 입력해주세요.`,
    REQUIRED_FIELD: (field: string): string => `${field}은(는) 필수 입력 항목입니다.`,
    SERVER_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
    NOT_FOUND: '요청하신 정보를 찾을 수 없습니다.',
  },
} as const;

export const SUCCESS_MESSAGES = {
  AUTH: {
    LOGIN: '로그인되었습니다.',
    LOGOUT: '로그아웃되었습니다.',
    REGISTER: '회원가입이 완료되었습니다. 관리자 승인 후 이용 가능합니다.',
  },
  PRODUCT: {
    CREATED: '제품이 등록되었습니다.',
    UPDATED: '제품이 수정되었습니다.',
    DEACTIVATED: '제품이 비활성화되었습니다.',
  },
  LOT: {
    CREATED: 'Lot이 생산 등록되었습니다.',
  },
  SHIPMENT: {
    CREATED: '출고가 완료되었습니다.',
    RECALLED: '회수가 완료되었습니다.',
    RETURNED: '반품이 완료되었습니다.',
  },
  TREATMENT: {
    CREATED: '시술이 등록되었습니다.',
  },
  ORGANIZATION: {
    APPROVED: '조직이 승인되었습니다.',
    DEACTIVATED: '조직이 비활성화되었습니다.',
  },
} as const;
