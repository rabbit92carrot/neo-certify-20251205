'use client';

/**
 * 즐겨찾기 제품 관리 훅
 * localStorage를 사용하여 조직별 즐겨찾기 제품 목록을 관리합니다.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY_PREFIX = 'favoriteProducts';

/**
 * 조직별 localStorage 키 생성
 */
const getStorageKey = (organizationId: string): string =>
  `${STORAGE_KEY_PREFIX}:${organizationId}`;

/**
 * useFavoriteProducts 훅 반환 타입
 */
export interface UseFavoriteProductsReturn {
  /** 즐겨찾기 제품 ID 배열 */
  favorites: string[];
  /** 즐겨찾기 추가 */
  addFavorite: (productId: string) => void;
  /** 즐겨찾기 제거 */
  removeFavorite: (productId: string) => void;
  /** 즐겨찾기 토글 */
  toggleFavorite: (productId: string) => void;
  /** 즐겨찾기 여부 확인 */
  isFavorite: (productId: string) => boolean;
  /** 로딩 완료 여부 (SSR 호환성) */
  isLoaded: boolean;
}

/**
 * 즐겨찾기 제품 관리 훅
 *
 * @param organizationId 조직 ID
 * @returns 즐겨찾기 관리 함수들
 *
 * @example
 * ```tsx
 * const { favorites, toggleFavorite, isFavorite } = useFavoriteProducts(orgId);
 *
 * // 즐겨찾기 토글
 * <button onClick={() => toggleFavorite(productId)}>
 *   {isFavorite(productId) ? '⭐' : '☆'}
 * </button>
 * ```
 */
export function useFavoriteProducts(organizationId: string): UseFavoriteProductsReturn {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 클라이언트에서만 localStorage 접근 (SSR 호환성)
  useEffect(() => {
    if (typeof window === 'undefined') {return;}

    try {
      const key = getStorageKey(organizationId);
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        }
      }
    } catch (error) {
      // localStorage 접근 실패 시 빈 배열 유지
      console.warn('Failed to load favorites from localStorage:', error);
    }
    setIsLoaded(true);
  }, [organizationId]);

  // localStorage에 저장
  const saveFavorites = useCallback(
    (newFavorites: string[]) => {
      if (typeof window === 'undefined') {return;}

      try {
        const key = getStorageKey(organizationId);
        localStorage.setItem(key, JSON.stringify(newFavorites));
      } catch (error) {
        console.warn('Failed to save favorites to localStorage:', error);
      }
    },
    [organizationId]
  );

  // 즐겨찾기 추가
  const addFavorite = useCallback(
    (productId: string) => {
      setFavorites((prev) => {
        if (prev.includes(productId)) {return prev;}
        const newFavorites = [...prev, productId];
        saveFavorites(newFavorites);
        return newFavorites;
      });
    },
    [saveFavorites]
  );

  // 즐겨찾기 제거
  const removeFavorite = useCallback(
    (productId: string) => {
      setFavorites((prev) => {
        if (!prev.includes(productId)) {return prev;}
        const newFavorites = prev.filter((id) => id !== productId);
        saveFavorites(newFavorites);
        return newFavorites;
      });
    },
    [saveFavorites]
  );

  // 즐겨찾기 토글
  const toggleFavorite = useCallback(
    (productId: string) => {
      setFavorites((prev) => {
        const newFavorites = prev.includes(productId)
          ? prev.filter((id) => id !== productId)
          : [...prev, productId];
        saveFavorites(newFavorites);
        return newFavorites;
      });
    },
    [saveFavorites]
  );

  // 즐겨찾기 여부 확인
  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
  const isFavorite = useCallback(
    (productId: string) => favoriteSet.has(productId),
    [favoriteSet]
  );

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    isLoaded,
  };
}
