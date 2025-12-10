import { describe, it, expect } from 'vitest';
import {
  cn,
  normalizePhoneNumber,
  isValidPhoneNumber,
  isValidBusinessNumber,
  formatBusinessNumber,
  formatDate,
  formatDateKorean,
  toISODateString,
  isWithin24Hours,
  formatNumber,
  formatFileSize,
  getTimeDifferenceMs,
  getKoreaToday,
  getKoreaTodayStart,
  getKoreaTodayEnd,
  getHoursDifference,
  formatDateTimeKorea,
  maskPhoneNumber,
  formatPhoneNumber,
} from '@/lib/utils';

describe('cn (Tailwind class merge)', () => {
  it('should merge classes correctly', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    expect(cn('base', isActive && 'active')).toBe('base active');
  });

  it('should override conflicting Tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('should handle undefined and false values', () => {
    expect(cn('base', undefined, false, 'another')).toBe('base another');
  });
});

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

describe('formatDateKorean', () => {
  it('should format date in Korean style', () => {
    const date = new Date('2024-12-25T12:00:00Z');
    expect(formatDateKorean(date)).toMatch(/2024년 12월 25일/);
  });

  it('should handle string input', () => {
    expect(formatDateKorean('2024-12-25T12:00:00Z')).toMatch(/2024년 12월 25일/);
  });
});

describe('toISODateString', () => {
  it('should convert date to ISO string', () => {
    const date = new Date('2024-12-25T12:00:00Z');
    expect(toISODateString(date)).toBe('2024-12-25T12:00:00.000Z');
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

  it('should handle string input', () => {
    const recentDateStr = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    expect(isWithin24Hours(recentDateStr)).toBe(true);
  });

  it('should return true for exactly 23 hours ago', () => {
    const date = new Date(Date.now() - 1000 * 60 * 60 * 23);
    expect(isWithin24Hours(date)).toBe(true);
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

  it('should handle negative numbers', () => {
    expect(formatNumber(-1000)).toBe('-1,000');
  });
});

describe('formatFileSize', () => {
  it('should format bytes correctly', () => {
    expect(formatFileSize(500)).toBe('500.0 B');
    expect(formatFileSize(1024)).toBe('1.0 KB');
  });

  it('should format kilobytes correctly', () => {
    expect(formatFileSize(1024 * 512)).toBe('512.0 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
  });

  it('should format megabytes correctly', () => {
    expect(formatFileSize(1024 * 1024 * 5)).toBe('5.0 MB');
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
  });

  it('should format gigabytes correctly', () => {
    expect(formatFileSize(1024 * 1024 * 1024 * 2)).toBe('2.0 GB');
  });
});

describe('getTimeDifferenceMs', () => {
  it('should calculate time difference in milliseconds', () => {
    const from = new Date('2024-12-25T10:00:00Z');
    const to = new Date('2024-12-25T11:00:00Z');
    expect(getTimeDifferenceMs(from, to)).toBe(1000 * 60 * 60); // 1시간
  });

  it('should default to current time for "to" parameter', () => {
    const from = new Date(Date.now() - 1000);
    const diff = getTimeDifferenceMs(from);
    expect(diff).toBeGreaterThanOrEqual(1000);
    expect(diff).toBeLessThan(2000);
  });
});

describe('getKoreaToday', () => {
  it('should return date in YYYY-MM-DD format', () => {
    const today = getKoreaToday();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('getKoreaTodayStart', () => {
  it('should return ISO string for start of day in Korea timezone', () => {
    const start = getKoreaTodayStart();
    expect(start).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
  });
});

describe('getKoreaTodayEnd', () => {
  it('should return ISO string for end of day in Korea timezone', () => {
    const end = getKoreaTodayEnd();
    expect(end).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
  });

  it('should be after start of day', () => {
    const start = new Date(getKoreaTodayStart());
    const end = new Date(getKoreaTodayEnd());
    expect(end.getTime()).toBeGreaterThan(start.getTime());
  });
});

describe('getHoursDifference', () => {
  it('should calculate hours difference correctly', () => {
    const from = new Date('2024-12-25T10:00:00Z');
    const to = new Date('2024-12-25T13:00:00Z');
    expect(getHoursDifference(from, to)).toBe(3);
  });

  it('should handle string inputs', () => {
    expect(getHoursDifference('2024-12-25T10:00:00Z', '2024-12-25T12:00:00Z')).toBe(2);
  });

  it('should handle fractional hours', () => {
    const from = new Date('2024-12-25T10:00:00Z');
    const to = new Date('2024-12-25T10:30:00Z');
    expect(getHoursDifference(from, to)).toBe(0.5);
  });
});

describe('formatDateTimeKorea', () => {
  it('should format date and time in Korean timezone', () => {
    const date = new Date('2024-12-25T12:00:00Z');
    const formatted = formatDateTimeKorea(date);
    // 한국 시간이므로 UTC+9 (21:00)
    expect(formatted).toMatch(/2024\.\s*12\.\s*25\.?\s*21:00/);
  });

  it('should handle string input', () => {
    const formatted = formatDateTimeKorea('2024-12-25T00:00:00Z');
    // 한국 시간이므로 UTC+9 (09:00)
    expect(formatted).toMatch(/2024\.\s*12\.\s*25\.?\s*09:00/);
  });
});

describe('maskPhoneNumber', () => {
  it('should mask middle digits of phone number', () => {
    expect(maskPhoneNumber('01012345678')).toBe('010****5678');
  });

  it('should handle hyphenated phone numbers', () => {
    expect(maskPhoneNumber('010-1234-5678')).toBe('010****5678');
  });

  it('should return original for short phone numbers', () => {
    expect(maskPhoneNumber('123456')).toBe('123456');
  });
});

describe('formatPhoneNumber', () => {
  it('should format 11-digit phone number correctly', () => {
    expect(formatPhoneNumber('01012345678')).toBe('010-1234-5678');
  });

  it('should format 10-digit phone number correctly', () => {
    expect(formatPhoneNumber('0101234567')).toBe('010-123-4567');
  });

  it('should return original for invalid length', () => {
    expect(formatPhoneNumber('123456')).toBe('123456');
    expect(formatPhoneNumber('012345678901')).toBe('012345678901');
  });

  it('should handle already formatted phone numbers', () => {
    expect(formatPhoneNumber('010-1234-5678')).toBe('010-1234-5678');
  });
});
