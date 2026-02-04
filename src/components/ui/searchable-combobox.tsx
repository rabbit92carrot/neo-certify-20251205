'use client';

/**
 * 서버 검색 지원 Combobox 컴포넌트
 * - debounced 검색으로 서버 조회
 * - 최소 2글자 이상 입력 시 검색 시작
 */

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useDebounce } from '@/hooks/useDebounce';

export interface SearchableComboboxOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

export interface SearchableComboboxProps {
  /** 현재 선택된 값 */
  value: string;
  /** 값 변경 핸들러 */
  onValueChange: (value: string) => void;
  /** 검색 함수 - 검색어를 받아서 옵션 목록 반환 */
  onSearch: (query: string) => Promise<SearchableComboboxOption[]>;
  /** 기본 옵션 (검색 전 표시, 예: '전체' 옵션) */
  defaultOption?: SearchableComboboxOption;
  /** 초기 옵션 목록 (이미 선택된 값 표시용) */
  initialOptions?: SearchableComboboxOption[];
  /** 플레이스홀더 */
  placeholder?: string;
  /** 검색 입력 플레이스홀더 */
  searchPlaceholder?: string;
  /** 검색 결과 없음 메시지 */
  emptyMessage?: string;
  /** 검색 최소 글자 수 안내 */
  minCharsMessage?: string;
  /** 비활성화 */
  disabled?: boolean;
  className?: string;
  /** 검색 대기 시간 (ms) */
  debounceMs?: number;
  /** 최소 검색 글자 수 */
  minSearchLength?: number;
}

// 안정적인 빈 배열 참조 (리렌더링 시에도 동일 참조 유지)
const EMPTY_OPTIONS: SearchableComboboxOption[] = [];

function SearchableCombobox({
  value,
  onValueChange,
  onSearch,
  defaultOption,
  initialOptions,
  placeholder = '선택하세요...',
  searchPlaceholder = '2글자 이상 입력...',
  emptyMessage = '검색 결과가 없습니다.',
  minCharsMessage = '2글자 이상 입력하세요.',
  disabled = false,
  className,
  debounceMs = 300,
  minSearchLength = 2,
}: SearchableComboboxProps) {
  // initialOptions가 undefined이면 안정적인 빈 배열 사용
  const stableInitialOptions = initialOptions ?? EMPTY_OPTIONS;

  // Hydration mismatch 방지를 위한 마운트 상태 체크
  // Radix UI가 서버/클라이언트에서 다른 ID를 생성하므로 클라이언트에서만 Popover 렌더링
  const [mounted, setMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [options, setOptions] = React.useState<SearchableComboboxOption[]>(stableInitialOptions);
  const [isLoading, setIsLoading] = React.useState(false);
  // 선택된 옵션을 별도로 저장하여 옵션 목록이 초기화되어도 표시 가능하게 함
  const [selectedOptionState, setSelectedOptionState] =
    React.useState<SearchableComboboxOption | null>(null);

  // 클라이언트 마운트 확인
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const debouncedQuery = useDebounce(searchQuery, debounceMs);

  // 검색 실행
  React.useEffect(() => {
    if (debouncedQuery.length < minSearchLength) {
      setOptions(stableInitialOptions);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    onSearch(debouncedQuery)
      .then((results) => {
        if (!cancelled) {
          setOptions(results);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOptions([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, minSearchLength, onSearch, stableInitialOptions]);

  // 외부에서 value가 초기화되면 저장된 상태도 초기화
  React.useEffect(() => {
    if (!value) {
      setSelectedOptionState(null);
    }
  }, [value]);

  // 선택된 옵션 찾기 (저장된 상태도 fallback으로 사용)
  const allOptions = defaultOption ? [defaultOption, ...options] : options;
  const selectedOption =
    allOptions.find((option) => option.value === value) ??
    stableInitialOptions.find((option) => option.value === value) ??
    (selectedOptionState?.value === value ? selectedOptionState : null);

  // 표시할 옵션 목록
  const displayOptions = defaultOption ? [defaultOption, ...options] : options;

  // 공통 버튼 콘텐츠
  const buttonContent = (
    <>
      {selectedOption ? (
        <span className="flex items-center gap-2 truncate">
          {selectedOption.icon}
          <span className="truncate">{selectedOption.label}</span>
        </span>
      ) : (
        placeholder
      )}
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </>
  );

  // 마운트 전에는 Popover 없이 버튼만 렌더링 (hydration mismatch 방지)
  if (!mounted) {
    return (
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={false}
        disabled={disabled}
        className={cn(
          'w-full justify-between font-normal',
          !selectedOption && 'text-muted-foreground',
          className
        )}
      >
        {buttonContent}
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !selectedOption && 'text-muted-foreground',
            className
          )}
        >
          {buttonContent}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="start"
        sideOffset={4}
        style={{ width: 'var(--radix-popover-trigger-width)' }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : searchQuery.length > 0 && searchQuery.length < minSearchLength ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {minCharsMessage}
              </div>
            ) : displayOptions.length === 0 ? (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            ) : (
              <CommandGroup>
                {displayOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      const isDeselecting = option.value === value;
                      // 선택 시 옵션 정보 저장 (선택 해제 시 null)
                      setSelectedOptionState(isDeselecting ? null : option);
                      onValueChange(isDeselecting ? '' : option.value);
                      setOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4 shrink-0',
                        value === option.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {option.icon}
                      <span className="truncate">{option.label}</span>
                    </div>
                    {option.description && (
                      <span className="ml-auto text-xs text-muted-foreground truncate max-w-[40%]">
                        {option.description}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { SearchableCombobox };
