import { useState, useEffect } from 'react';

/**
 * 값을 지정된 시간만큼 지연시키는 훅
 * 주로 검색 입력 등에서 API 호출 횟수를 줄이기 위해 사용
 *
 * @param value 디바운스할 값
 * @param delay 지연 시간 (ms)
 * @returns 디바운스된 값
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
