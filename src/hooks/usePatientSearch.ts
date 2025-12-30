/**
 * 환자 전화번호 검색 훅
 *
 * 병원에서 기존 환자를 검색하기 위한 훅입니다.
 * debounce가 적용된 검색과 자동 포맷팅을 제공합니다.
 *
 * @example
 * ```typescript
 * const {
 *   phoneInputValue,
 *   patientSuggestions,
 *   isSearching,
 *   isPopoverOpen,
 *   setIsPopoverOpen,
 *   handlePhoneInputChange,
 *   handlePatientSelect,
 * } = usePatientSearch({
 *   searchFn: searchHospitalPatientsAction,
 * });
 * ```
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { formatPhoneNumber, normalizePhoneNumber } from '@/lib/validations/common';

export interface UsePatientSearchOptions {
  /** 환자 검색 함수 */
  searchFn: (query: string) => Promise<{ success: boolean; data?: string[] }>;
  /** 디바운스 시간 (ms) */
  debounceMs?: number;
  /** 검색 최소 입력 길이 */
  minLength?: number;
}

export interface UsePatientSearchReturn {
  /** 포맷팅된 전화번호 입력값 */
  phoneInputValue: string;
  /** 선택된 환자 전화번호 */
  patientPhone: string;
  /** 검색 결과 (환자 전화번호 목록) */
  patientSuggestions: string[];
  /** 검색 중 여부 */
  isSearching: boolean;
  /** 팝오버 열림 상태 */
  isPopoverOpen: boolean;
  /** 팝오버 상태 설정 */
  setIsPopoverOpen: (open: boolean) => void;
  /** 전화번호 입력 핸들러 */
  handlePhoneInputChange: (value: string) => void;
  /** 환자 선택 핸들러 */
  handlePatientSelect: (phone: string) => void;
  /** 상태 초기화 */
  reset: () => void;
}

export function usePatientSearch({
  searchFn,
  debounceMs = 300,
  minLength = 3,
}: UsePatientSearchOptions): UsePatientSearchReturn {
  const [phoneInputValue, setPhoneInputValue] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientSuggestions, setPatientSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // 환자 검색 핸들러 (debounce)
  const handlePatientSearch = useCallback(
    (value: string) => {
      // 기존 타이머 취소
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      const normalized = normalizePhoneNumber(value);

      // 최소 길이 미만이면 검색하지 않음
      if (normalized.length < minLength) {
        setPatientSuggestions([]);
        return;
      }

      // debounce 후 검색 실행
      debounceRef.current = setTimeout(async () => {
        setIsSearching(true);
        const result = await searchFn(normalized);
        if (result.success && result.data) {
          setPatientSuggestions(result.data);
        } else {
          setPatientSuggestions([]);
        }
        setIsSearching(false);
      }, debounceMs);
    },
    [searchFn, debounceMs, minLength]
  );

  // 환자 선택 핸들러
  const handlePatientSelect = useCallback((phone: string) => {
    const formatted = formatPhoneNumber(phone);
    setPatientPhone(formatted);
    setPhoneInputValue(formatted);
    setIsPopoverOpen(false);
    setPatientSuggestions([]);
  }, []);

  // 전화번호 입력 핸들러 (자동 포맷팅 + 검색)
  const handlePhoneInputChange = useCallback(
    (value: string) => {
      const digitsOnly = value.replace(/[^0-9]/g, '');
      if (digitsOnly.length <= 11) {
        const formatted = formatPhoneNumber(digitsOnly);
        setPhoneInputValue(formatted);
        setPatientPhone(formatted);
        handlePatientSearch(digitsOnly);

        // 입력값이 최소 길이 이상이면 팝오버 열기
        if (digitsOnly.length >= minLength) {
          setIsPopoverOpen(true);
        }
      }
    },
    [handlePatientSearch, minLength]
  );

  // 상태 초기화
  const reset = useCallback(() => {
    setPhoneInputValue('');
    setPatientPhone('');
    setPatientSuggestions([]);
    setIsSearching(false);
    setIsPopoverOpen(false);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    phoneInputValue,
    patientPhone,
    patientSuggestions,
    isSearching,
    isPopoverOpen,
    setIsPopoverOpen,
    handlePhoneInputChange,
    handlePatientSelect,
    reset,
  };
}
