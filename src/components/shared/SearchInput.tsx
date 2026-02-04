'use client';

/**
 * 검색 입력 컴포넌트
 * debounce 기능과 clear 버튼이 포함된 검색 입력 필드
 */

import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks';

export interface SearchInputProps {
  /** 현재 검색어 (외부 제어) */
  value?: string;
  /** 디바운스된 값 변경 콜백 */
  onChange: (value: string) => void;
  /** 플레이스홀더 텍스트 */
  placeholder?: string;
  /** 디바운스 지연 시간 (ms), 기본 300ms */
  debounceMs?: number;
  /** 추가 클래스명 */
  className?: string;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** aria-label */
  ariaLabel?: string;
}

/**
 * 검색 입력 컴포넌트
 * debounce 기능이 내장되어 있어 검색어 입력 시 API 호출을 줄일 수 있습니다.
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState('');
 *
 * <SearchInput
 *   value={search}
 *   onChange={setSearch}
 *   placeholder="검색어를 입력하세요"
 * />
 * ```
 */
export function SearchInput({
  value: externalValue,
  onChange,
  placeholder = '검색...',
  debounceMs = 300,
  className,
  disabled = false,
  ariaLabel = '검색',
}: SearchInputProps): React.ReactElement {
  // 내부 상태 (즉시 반응)
  const [internalValue, setInternalValue] = useState(externalValue ?? '');

  // 외부 값이 변경되면 내부 상태 동기화
  useEffect(() => {
    if (externalValue !== undefined && externalValue !== internalValue) {
      setInternalValue(externalValue);
    }
  }, [externalValue, internalValue]);

  // 디바운스된 값
  const debouncedValue = useDebounce(internalValue, debounceMs);

  // 디바운스된 값이 변경되면 외부로 전달
  useEffect(() => {
    onChange(debouncedValue);
  }, [debouncedValue, onChange]);

  // 입력 핸들러
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
  }, []);

  // 클리어 버튼 핸들러
  const handleClear = useCallback(() => {
    setInternalValue('');
    onChange('');
  }, [onChange]);

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="pl-10 pr-10"
        aria-label={ariaLabel}
      />
      {internalValue && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={handleClear}
          disabled={disabled}
          aria-label="검색어 지우기"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
