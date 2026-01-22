'use client';

/**
 * 장바구니 훅
 * 출고/시술 등록에서 사용하는 장바구니 상태를 관리합니다.
 * PRD 15.6: 영속성 없이 해당 페이지 세션 내에서만 일시 유지
 */

import { useCallback, useMemo, useState } from 'react';

/**
 * 장바구니 아이템 타입
 */
export interface CartItem {
  /** 제품 ID */
  productId: string;
  /** 제품명 */
  productName: string;
  /** 수량 */
  quantity: number;
  /** Lot ID (제조사 Lot 선택 옵션) */
  lotId?: string;
  /** Lot 번호 */
  lotNumber?: string;
}

interface UseCartReturn {
  /** 장바구니 아이템 목록 */
  items: CartItem[];
  /** 아이템 추가 (같은 제품은 수량 합산) */
  addItem: (item: CartItem) => void;
  /** 아이템 수량 업데이트 */
  updateQuantity: (productId: string, quantity: number, lotId?: string) => void;
  /** 아이템 삭제 */
  removeItem: (productId: string, lotId?: string) => void;
  /** 장바구니 전체 비우기 */
  clearCart: () => void;
  /** 총 아이템 수 */
  totalItems: number;
  /** 총 제품 종류 수 */
  totalProducts: number;
  /** 아이템 존재 여부 확인 */
  hasItem: (productId: string, lotId?: string) => boolean;
  /** 특정 아이템 가져오기 */
  getItem: (productId: string, lotId?: string) => CartItem | undefined;
}

/**
 * 아이템의 고유 키 생성 (productId + lotId)
 */
function getItemKey(productId: string, lotId?: string): string {
  return lotId ? `${productId}-${lotId}` : productId;
}

/**
 * 장바구니 훅
 *
 * @example
 * ```tsx
 * function ShipmentPage() {
 *   const {
 *     items,
 *     addItem,
 *     updateQuantity,
 *     removeItem,
 *     clearCart,
 *     totalItems,
 *   } = useCart();
 *
 *   const handleAddProduct = (product: Product) => {
 *     addItem({
 *       productId: product.id,
 *       productName: product.name,
 *       quantity: 1,
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <ProductList onSelect={handleAddProduct} />
 *       <CartDisplay items={items} onUpdateQuantity={updateQuantity} onRemove={removeItem} />
 *       <Button onClick={clearCart}>장바구니 비우기</Button>
 *       <span>총 {totalItems}개</span>
 *     </div>
 *   );
 * }
 * ```
 */
export function useCart(): UseCartReturn {
  const [items, setItems] = useState<CartItem[]>([]);

  /**
   * O(1) 조회를 위한 Map 캐시 (items 변경 시 재생성)
   */
  const itemsMap = useMemo(() => {
    const map = new Map<string, CartItem>();
    for (const item of items) {
      const key = getItemKey(item.productId, item.lotId);
      map.set(key, item);
    }
    return map;
  }, [items]);

  /**
   * 아이템 추가 (같은 제품은 수량 합산)
   */
  const addItem = useCallback((newItem: CartItem) => {
    setItems((prev) => {
      const key = getItemKey(newItem.productId, newItem.lotId);
      // 기존 아이템 검색을 위한 인덱스 맵 생성
      let existingIndex = -1;
      for (let i = 0; i < prev.length; i++) {
        if (getItemKey(prev[i]!.productId, prev[i]!.lotId) === key) {
          existingIndex = i;
          break;
        }
      }

      if (existingIndex >= 0) {
        // 기존 아이템 수량 합산
        const updated = [...prev];
        const existingItem = updated[existingIndex];
        if (existingItem) {
          updated[existingIndex] = {
            ...existingItem,
            quantity: existingItem.quantity + newItem.quantity,
          };
        }
        return updated;
      }

      // 새 아이템 추가
      return [...prev, newItem];
    });
  }, []);

  /**
   * 아이템 삭제
   */
  const removeItem = useCallback((productId: string, lotId?: string) => {
    setItems((prev) => {
      const key = getItemKey(productId, lotId);
      return prev.filter((item) => getItemKey(item.productId, item.lotId) !== key);
    });
  }, []);

  /**
   * 아이템 수량 업데이트
   */
  const updateQuantity = useCallback(
    (productId: string, quantity: number, lotId?: string) => {
      if (quantity <= 0) {
        removeItem(productId, lotId);
        return;
      }

      setItems((prev) => {
        const key = getItemKey(productId, lotId);
        return prev.map((item) =>
          getItemKey(item.productId, item.lotId) === key ? { ...item, quantity } : item
        );
      });
    },
    [removeItem]
  );

  /**
   * 장바구니 전체 비우기
   */
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  /**
   * 아이템 존재 여부 확인 (O(1) Map 조회)
   */
  const hasItem = useCallback(
    (productId: string, lotId?: string): boolean => {
      const key = getItemKey(productId, lotId);
      return itemsMap.has(key);
    },
    [itemsMap]
  );

  /**
   * 특정 아이템 가져오기 (O(1) Map 조회)
   */
  const getItem = useCallback(
    (productId: string, lotId?: string): CartItem | undefined => {
      const key = getItemKey(productId, lotId);
      return itemsMap.get(key);
    },
    [itemsMap]
  );

  /**
   * 총 아이템 수 (모든 수량 합계)
   */
  const totalItems = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  /**
   * 총 제품 종류 수
   */
  const totalProducts = items.length;

  return {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    totalItems,
    totalProducts,
    hasItem,
    getItem,
  };
}
