/**
 * common.ts Zod 스키마 단위 테스트
 *
 * 공통 검증 스키마 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  uuidSchema,
  emailSchema,
  passwordSchema,
  phoneNumberSchema,
  phoneNumberInputSchema,
  businessNumberSchema,
  businessNumberInputSchema,
  quantitySchema,
  productionQuantitySchema,
  quantityInputSchema,
  dateStringSchema,
  dateInputSchema,
  requiredStringSchema,
  trimmedRequiredStringSchema,
  maxLengthStringSchema,
  normalizePhoneNumber,
  normalizeBusinessNumber,
  formatBusinessNumber,
  formatPhoneNumber,
  fileUploadSchema,
  optionalFileUploadSchema,
} from '@/lib/validations/common';
import { CONFIG } from '@/constants';

describe('common.ts Zod 스키마', () => {
  // ============================================================================
  // UUID 스키마 테스트
  // ============================================================================
  describe('uuidSchema', () => {
    it('유효한 UUID 통과', () => {
      const result = uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000');
      expect(result.success).toBe(true);
    });

    it('잘못된 UUID 실패', () => {
      const result = uuidSchema.safeParse('invalid-uuid');
      expect(result.success).toBe(false);
    });

    it('빈 문자열 실패', () => {
      const result = uuidSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 이메일 스키마 테스트
  // ============================================================================
  describe('emailSchema', () => {
    it('유효한 이메일 통과', () => {
      expect(emailSchema.safeParse('test@example.com').success).toBe(true);
      expect(emailSchema.safeParse('user.name@company.co.kr').success).toBe(true);
      expect(emailSchema.safeParse('user+tag@domain.org').success).toBe(true);
    });

    it('잘못된 이메일 형식 실패', () => {
      expect(emailSchema.safeParse('notanemail').success).toBe(false);
      expect(emailSchema.safeParse('missing@').success).toBe(false);
      expect(emailSchema.safeParse('@nodomain.com').success).toBe(false);
    });

    it('빈 이메일 실패', () => {
      const result = emailSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 비밀번호 스키마 테스트
  // ============================================================================
  describe('passwordSchema', () => {
    it('6자 이상 비밀번호 통과', () => {
      expect(passwordSchema.safeParse('123456').success).toBe(true);
      expect(passwordSchema.safeParse('password123!').success).toBe(true);
    });

    it('6자 미만 비밀번호 실패', () => {
      expect(passwordSchema.safeParse('12345').success).toBe(false);
      expect(passwordSchema.safeParse('abc').success).toBe(false);
    });

    it('빈 비밀번호 실패', () => {
      expect(passwordSchema.safeParse('').success).toBe(false);
    });
  });

  // ============================================================================
  // 전화번호 스키마 테스트
  // ============================================================================
  describe('phoneNumberSchema', () => {
    it('유효한 전화번호 통과 (숫자만)', () => {
      const result = phoneNumberSchema.safeParse('01012345678');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('01012345678');
      }
    });

    it('하이픈 포함 전화번호도 정규화되어 통과', () => {
      const result = phoneNumberSchema.safeParse('010-1234-5678');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('01012345678'); // 하이픈 제거됨
      }
    });

    it('10자리 전화번호 (지역번호) 통과', () => {
      const result = phoneNumberSchema.safeParse('0212345678');
      expect(result.success).toBe(true);
    });

    it('잘못된 전화번호 실패', () => {
      expect(phoneNumberSchema.safeParse('123456789').success).toBe(false); // 0으로 시작 안함
      expect(phoneNumberSchema.safeParse('0123').success).toBe(false); // 너무 짧음
    });
  });

  describe('phoneNumberInputSchema', () => {
    it('유효한 전화번호 입력 통과', () => {
      expect(phoneNumberInputSchema.safeParse('01012345678').success).toBe(true);
      expect(phoneNumberInputSchema.safeParse('010-1234-5678').success).toBe(true);
    });

    it('빈 입력 실패', () => {
      const result = phoneNumberInputSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 사업자등록번호 스키마 테스트
  // ============================================================================
  describe('businessNumberSchema', () => {
    it('10자리 숫자 통과', () => {
      const result = businessNumberSchema.safeParse('1234567890');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('1234567890');
      }
    });

    it('하이픈 포함도 정규화되어 통과', () => {
      const result = businessNumberSchema.safeParse('123-45-67890');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('1234567890'); // 하이픈 제거됨
      }
    });

    it('잘못된 사업자등록번호 실패', () => {
      expect(businessNumberSchema.safeParse('12345').success).toBe(false); // 너무 짧음
      expect(businessNumberSchema.safeParse('12345678901').success).toBe(false); // 너무 김
    });
  });

  describe('businessNumberInputSchema', () => {
    it('유효한 사업자등록번호 입력 통과', () => {
      expect(businessNumberInputSchema.safeParse('1234567890').success).toBe(true);
      expect(businessNumberInputSchema.safeParse('123-45-67890').success).toBe(true);
    });

    it('빈 입력 실패', () => {
      expect(businessNumberInputSchema.safeParse('').success).toBe(false);
    });
  });

  // ============================================================================
  // 수량 스키마 테스트
  // ============================================================================
  describe('quantitySchema', () => {
    it('1 이상 정수 통과', () => {
      expect(quantitySchema.safeParse(1).success).toBe(true);
      expect(quantitySchema.safeParse(100).success).toBe(true);
      expect(quantitySchema.safeParse(99999).success).toBe(true);
    });

    it('0 이하 정수 실패', () => {
      expect(quantitySchema.safeParse(0).success).toBe(false);
      expect(quantitySchema.safeParse(-1).success).toBe(false);
    });

    it('소수점 실패', () => {
      expect(quantitySchema.safeParse(1.5).success).toBe(false);
    });
  });

  describe('productionQuantitySchema', () => {
    it('1 ~ 100,000 범위 통과', () => {
      expect(productionQuantitySchema.safeParse(1).success).toBe(true);
      expect(productionQuantitySchema.safeParse(50000).success).toBe(true);
      expect(productionQuantitySchema.safeParse(100000).success).toBe(true);
    });

    it('범위 초과 실패', () => {
      expect(productionQuantitySchema.safeParse(0).success).toBe(false);
      expect(productionQuantitySchema.safeParse(100001).success).toBe(false);
    });
  });

  describe('quantityInputSchema', () => {
    it('문자열 숫자 변환 및 통과', () => {
      const result = quantityInputSchema.safeParse('10');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(10); // 숫자로 변환됨
      }
    });

    it('빈 문자열 실패', () => {
      expect(quantityInputSchema.safeParse('').success).toBe(false);
    });

    it('숫자가 아닌 문자열 실패', () => {
      expect(quantityInputSchema.safeParse('abc').success).toBe(false);
    });

    it('0 이하 수량 실패', () => {
      expect(quantityInputSchema.safeParse('0').success).toBe(false);
      expect(quantityInputSchema.safeParse('-5').success).toBe(false);
    });
  });

  // ============================================================================
  // 날짜 스키마 테스트
  // ============================================================================
  describe('dateStringSchema', () => {
    it('ISO 8601 형식 통과', () => {
      expect(dateStringSchema.safeParse('2024-01-15T10:30:00.000Z').success).toBe(true);
      expect(dateStringSchema.safeParse('2024-12-31T23:59:59.999Z').success).toBe(true);
    });

    it('잘못된 형식 실패', () => {
      expect(dateStringSchema.safeParse('2024-01-15').success).toBe(false);
      expect(dateStringSchema.safeParse('invalid-date').success).toBe(false);
    });
  });

  describe('dateInputSchema', () => {
    it('YYYY-MM-DD 형식 통과', () => {
      expect(dateInputSchema.safeParse('2024-01-15').success).toBe(true);
      expect(dateInputSchema.safeParse('2024-12-31').success).toBe(true);
    });

    it('잘못된 형식 실패', () => {
      expect(dateInputSchema.safeParse('01-15-2024').success).toBe(false); // MM-DD-YYYY
      expect(dateInputSchema.safeParse('2024/01/15').success).toBe(false); // 슬래시
      expect(dateInputSchema.safeParse('20240115').success).toBe(false); // 구분자 없음
    });
  });

  // ============================================================================
  // 문자열 스키마 팩토리 테스트
  // ============================================================================
  describe('requiredStringSchema', () => {
    it('필수 필드 통과', () => {
      const schema = requiredStringSchema('이름');
      expect(schema.safeParse('홍길동').success).toBe(true);
    });

    it('빈 문자열 실패', () => {
      const schema = requiredStringSchema('이름');
      const result = schema.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  describe('trimmedRequiredStringSchema', () => {
    it('공백 트리밍 후 통과', () => {
      const schema = trimmedRequiredStringSchema('이름');
      const result = schema.safeParse('  홍길동  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('홍길동'); // 공백 제거됨
      }
    });

    it('공백만 있는 문자열 실패', () => {
      const schema = trimmedRequiredStringSchema('이름');
      expect(schema.safeParse('   ').success).toBe(false);
    });
  });

  describe('maxLengthStringSchema', () => {
    it('최대 길이 이내 통과', () => {
      const schema = maxLengthStringSchema('제목', 10);
      expect(schema.safeParse('12345').success).toBe(true);
      expect(schema.safeParse('1234567890').success).toBe(true);
    });

    it('최대 길이 초과 실패', () => {
      const schema = maxLengthStringSchema('제목', 10);
      expect(schema.safeParse('12345678901').success).toBe(false);
    });

    it('빈 문자열 실패', () => {
      const schema = maxLengthStringSchema('제목', 10);
      expect(schema.safeParse('').success).toBe(false);
    });
  });

  // ============================================================================
  // 유틸리티 함수 테스트
  // ============================================================================
  describe('normalizePhoneNumber', () => {
    it('하이픈 제거', () => {
      expect(normalizePhoneNumber('010-1234-5678')).toBe('01012345678');
    });

    it('공백 및 특수문자 제거', () => {
      expect(normalizePhoneNumber('010 1234 5678')).toBe('01012345678');
      expect(normalizePhoneNumber('(010) 1234-5678')).toBe('01012345678');
    });

    it('숫자만 있는 경우 그대로', () => {
      expect(normalizePhoneNumber('01012345678')).toBe('01012345678');
    });
  });

  describe('normalizeBusinessNumber', () => {
    it('하이픈 제거', () => {
      expect(normalizeBusinessNumber('123-45-67890')).toBe('1234567890');
    });

    it('숫자만 있는 경우 그대로', () => {
      expect(normalizeBusinessNumber('1234567890')).toBe('1234567890');
    });
  });

  describe('formatBusinessNumber', () => {
    it('10자리 숫자 포맷팅', () => {
      expect(formatBusinessNumber('1234567890')).toBe('123-45-67890');
    });

    it('이미 포맷팅된 번호도 정상 처리', () => {
      expect(formatBusinessNumber('123-45-67890')).toBe('123-45-67890');
    });

    it('잘못된 길이는 원본 반환', () => {
      expect(formatBusinessNumber('12345')).toBe('12345');
      expect(formatBusinessNumber('12345678901')).toBe('12345678901');
    });
  });

  describe('formatPhoneNumber', () => {
    it('11자리 전화번호 포맷팅', () => {
      expect(formatPhoneNumber('01012345678')).toBe('010-1234-5678');
    });

    it('10자리 전화번호 포맷팅', () => {
      // 실제 구현: 앞 3자리-중간 3자리-뒤 4자리 (021-234-5678)
      expect(formatPhoneNumber('0212345678')).toBe('021-234-5678');
    });

    it('잘못된 길이는 원본 반환', () => {
      expect(formatPhoneNumber('123456')).toBe('123456');
    });

    it('하이픈이 있는 경우 정규화 후 포맷팅', () => {
      expect(formatPhoneNumber('010-1234-5678')).toBe('010-1234-5678');
    });
  });

  // ============================================================================
  // 파일 업로드 스키마 테스트
  // ============================================================================
  describe('fileUploadSchema', () => {
    // 테스트용 파일 생성 헬퍼
    const createTestFile = (
      content: string | ArrayBuffer,
      name: string,
      type: string
    ): File => {
      const blob = new Blob([content], { type });
      return new File([blob], name, { type });
    };

    it('유효한 PDF 파일 통과', () => {
      const file = createTestFile('PDF content', 'test.pdf', 'application/pdf');
      const result = fileUploadSchema.safeParse(file);
      expect(result.success).toBe(true);
    });

    it('유효한 JPEG 파일 통과', () => {
      const file = createTestFile('JPEG content', 'test.jpg', 'image/jpeg');
      const result = fileUploadSchema.safeParse(file);
      expect(result.success).toBe(true);
    });

    it('유효한 PNG 파일 통과', () => {
      const file = createTestFile('PNG content', 'test.png', 'image/png');
      const result = fileUploadSchema.safeParse(file);
      expect(result.success).toBe(true);
    });

    it('10MB 초과 파일 실패', () => {
      // 10MB + 1 byte 크기의 데이터 생성
      const largeContent = new ArrayBuffer(CONFIG.FILE_UPLOAD.MAX_SIZE_BYTES + 1);
      const file = createTestFile(largeContent, 'large.pdf', 'application/pdf');
      const result = fileUploadSchema.safeParse(file);
      expect(result.success).toBe(false);
    });

    it('10MB 정확히 파일 통과', () => {
      // 정확히 10MB
      const content = new ArrayBuffer(CONFIG.FILE_UPLOAD.MAX_SIZE_BYTES);
      const file = createTestFile(content, 'exact10mb.pdf', 'application/pdf');
      const result = fileUploadSchema.safeParse(file);
      expect(result.success).toBe(true);
    });

    it('허용되지 않은 파일 타입 (EXE) 실패', () => {
      const file = createTestFile('EXE content', 'virus.exe', 'application/x-msdownload');
      const result = fileUploadSchema.safeParse(file);
      expect(result.success).toBe(false);
    });

    it('허용되지 않은 파일 타입 (HTML) 실패', () => {
      const file = createTestFile('<html></html>', 'page.html', 'text/html');
      const result = fileUploadSchema.safeParse(file);
      expect(result.success).toBe(false);
    });

    it('허용되지 않은 파일 타입 (JS) 실패', () => {
      const file = createTestFile('console.log("test")', 'script.js', 'application/javascript');
      const result = fileUploadSchema.safeParse(file);
      expect(result.success).toBe(false);
    });

    it('File 객체가 아닌 값 실패', () => {
      const result = fileUploadSchema.safeParse('not a file');
      expect(result.success).toBe(false);
    });

    it('null 값 실패', () => {
      const result = fileUploadSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('undefined 값 실패', () => {
      const result = fileUploadSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });
  });

  describe('optionalFileUploadSchema', () => {
    const createTestFile = (
      content: string,
      name: string,
      type: string
    ): File => {
      const blob = new Blob([content], { type });
      return new File([blob], name, { type });
    };

    it('undefined 값 통과 (옵셔널)', () => {
      const result = optionalFileUploadSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it('유효한 파일 통과', () => {
      const file = createTestFile('PDF content', 'test.pdf', 'application/pdf');
      const result = optionalFileUploadSchema.safeParse(file);
      expect(result.success).toBe(true);
    });

    it('잘못된 파일 타입 실패', () => {
      const file = createTestFile('EXE content', 'virus.exe', 'application/x-msdownload');
      const result = optionalFileUploadSchema.safeParse(file);
      expect(result.success).toBe(false);
    });
  });
});
