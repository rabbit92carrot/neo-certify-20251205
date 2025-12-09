import { describe, it, expect } from 'vitest';
import {
  normalizePhoneNumber,
  isValidPhoneNumber,
  isValidBusinessNumber,
  formatBusinessNumber,
  formatDate,
  isWithin24Hours,
  formatNumber,
} from '@/lib/utils';

describe('normalizePhoneNumber', () => {
  it('should remove hyphens from phone number', () => {
    expect(normalizePhoneNumber('010-1234-5678')).toBe('01012345678');
  });

  it('should handle phone number without hyphens', () => {
    expect(normalizePhoneNumber('01012345678')).toBe('01012345678');
  });

  it('should remove spaces', () => {
    expect(normalizePhoneNumber('010 1234 5678')).toBe('01012345678');
  });

  it('should remove mixed hyphens and spaces', () => {
    expect(normalizePhoneNumber('010-1234 5678')).toBe('01012345678');
  });
});

describe('isValidPhoneNumber', () => {
  it('should return true for valid phone numbers', () => {
    expect(isValidPhoneNumber('01012345678')).toBe(true);
    expect(isValidPhoneNumber('010-1234-5678')).toBe(true);
    expect(isValidPhoneNumber('01112345678')).toBe(true);
  });

  it('should return false for invalid phone numbers', () => {
    expect(isValidPhoneNumber('123')).toBe(false);
    expect(isValidPhoneNumber('abcdefghijk')).toBe(false);
    expect(isValidPhoneNumber('02012345678')).toBe(false);
    // 010으로 시작하는 9자리는 유효 (구형 번호 010-XXX-XXXX)
    // 8자리 미만은 무효
    expect(isValidPhoneNumber('010123456')).toBe(false);
  });
});

describe('isValidBusinessNumber', () => {
  it('should return true for valid business numbers', () => {
    expect(isValidBusinessNumber('1234567890')).toBe(true);
    expect(isValidBusinessNumber('123-45-67890')).toBe(true);
  });

  it('should return false for invalid business numbers', () => {
    expect(isValidBusinessNumber('123456789')).toBe(false);
    expect(isValidBusinessNumber('12345678901')).toBe(false);
    expect(isValidBusinessNumber('abcdefghij')).toBe(false);
  });
});

describe('formatBusinessNumber', () => {
  it('should format business number correctly', () => {
    expect(formatBusinessNumber('1234567890')).toBe('123-45-67890');
  });

  it('should return original string for invalid length', () => {
    expect(formatBusinessNumber('123456789')).toBe('123456789');
    expect(formatBusinessNumber('12345678901')).toBe('12345678901');
  });
});

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-12-25T12:00:00Z');
    expect(formatDate(date)).toBe('2024-12-25');
  });

  it('should handle string input', () => {
    expect(formatDate('2024-12-25T12:00:00Z')).toBe('2024-12-25');
  });
});

describe('isWithin24Hours', () => {
  it('should return true for recent dates', () => {
    const recentDate = new Date(Date.now() - 1000 * 60 * 60); // 1시간 전
    expect(isWithin24Hours(recentDate)).toBe(true);
  });

  it('should return false for old dates', () => {
    const oldDate = new Date(Date.now() - 1000 * 60 * 60 * 25); // 25시간 전
    expect(isWithin24Hours(oldDate)).toBe(false);
  });
});

describe('formatNumber', () => {
  it('should format numbers with commas', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1000000)).toBe('1,000,000');
  });

  it('should handle small numbers', () => {
    expect(formatNumber(100)).toBe('100');
    expect(formatNumber(0)).toBe('0');
  });
});
