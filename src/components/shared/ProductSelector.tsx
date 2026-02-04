'use client';

/**
 * 범용 제품 선택 컴포넌트
 *
 * 12개 카드 그리드, 검색, 즐겨찾기, 전체 제품 다이얼로그 기능을 제공합니다.
 * 제조사/유통사 출고, 병원 시술 등 다양한 컨텍스트에서 사용할 수 있습니다.
 *
 * @example
 * // 출고용 (Shipment)
 * <ProductSelector<ShipmentProductSummary>
 *   getProductId={(p) => p.productId}
 *   getDisplayName={(p) => p.productName}
 *   getQuantity={(p) => p.totalQuantity}
 *   ... />
 *
 * // 시술용 (Treatment)
 * <ProductSelector<ProductForTreatment>
 *   getProductId={(p) => p.productId}
 *   getDisplayName={(p) => p.alias || p.productName}
 *   getQuantity={(p) => p.availableQuantity}
 *   ... />
 */

import { useState, useCallback, useTransition, useMemo, useEffect } from 'react';
import { Package, Search, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/shared/ProductCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { AllProductsDialog } from '@/components/shared/AllProductsDialog';
import { useFavoriteProducts, useDebounce } from '@/hooks';
import type { SelectableProduct, ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { CartItem } from '@/hooks/useCart';

/**
 * ProductSelector에서 사용할 수 있는 제품 타입의 최소 요구사항
 */
export interface ProductSelectorItem {
  productId: string;
  productName: string;
  modelName: string;
}

interface ProductSelectorProps<T extends ProductSelectorItem> {
  /** 조직 ID (즐겨찾기 저장용) */
  organizationId: string;
  /** 초기 제품 목록 (상위 12개) */
  initialProducts: T[];
  /** 선택된 제품 */
  selectedProduct: T | null;
  /** 제품 선택 핸들러 */
  onSelectProduct: (product: T) => void;

  // === 필드 접근자 (제네릭 지원) ===
  /** 제품 ID 가져오기 */
  getProductId: (product: T) => string;
  /** 표시명 가져오기 (별칭 지원) */
  getDisplayName: (product: T) => string;
  /** 재고 수량 가져오기 */
  getQuantity: (product: T) => number;
  /** SelectableProduct로 변환 (AllProductsDialog용) */
  toSelectableProduct: (product: T) => SelectableProduct;

  // === 검색 기능 (선택적) ===
  /** 제품 검색 액션 */
  searchProductsAction?: (
    search: string,
    favoriteIds: string[]
  ) => Promise<ApiResponse<T[]>>;

  // === 전체 제품 다이얼로그 (선택적) ===
  /** 전체 제품 조회 액션 (다이얼로그용) */
  getAllProductsAction?: (
    page: number,
    search: string
  ) => Promise<ApiResponse<PaginatedResponse<T>>>;

  // === 장바구니 연동 ===
  /** 장바구니에 담긴 제품별 수량 (가용 재고 계산용) */
  cartQuantityByProduct?: Map<string, number>;
  /** 장바구니 아이템 목록 (AllProductsDialog용) */
  cartItems?: CartItem[];
  /** 장바구니에 아이템 추가 (AllProductsDialog용) */
  onAddToCart?: (item: CartItem) => void;
  /** 장바구니에서 아이템 삭제 (AllProductsDialog용) */
  onRemoveFromCart?: (productId: string, lotId?: string) => void;

  // === 즐겨찾기 (선택적) ===
  /** 즐겨찾기 표시 여부 (기본: true) */
  showFavorites?: boolean;

  // === 커스터마이징 ===
  /** 검색 placeholder */
  searchPlaceholder?: string;
  /** 빈 상태 메시지 (검색 결과 없음) */
  emptySearchMessage?: string;
  /** 빈 상태 메시지 (제품 없음) */
  emptyProductsMessage?: string;
}

const GRID_SIZE = 12; // 3x4 그리드

/**
 * 범용 제품 선택 컴포넌트
 */
export function ProductSelector<T extends ProductSelectorItem>({
  organizationId,
  initialProducts,
  selectedProduct,
  onSelectProduct,
  getProductId,
  getDisplayName,
  getQuantity,
  toSelectableProduct,
  searchProductsAction,
  getAllProductsAction,
  cartQuantityByProduct = new Map(),
  cartItems = [],
  onAddToCart,
  onRemoveFromCart,
  showFavorites = true,
  searchPlaceholder = '제품명, 모델명으로 검색...',
  emptySearchMessage = '검색 결과가 없습니다',
  emptyProductsMessage = '선택 가능한 제품이 없습니다',
}: ProductSelectorProps<T>): React.ReactElement {
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState('');
  const [products, setProducts] = useState<T[]>(initialProducts);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isAllProductsDialogOpen, setIsAllProductsDialogOpen] = useState(false);

  // 즐겨찾기 훅
  const {
    favorites,
    toggleFavorite,
    isFavorite,
    isLoaded: favoritesLoaded,
  } = useFavoriteProducts(organizationId);

  // 디바운스된 검색어
  const debouncedSearch = useDebounce(searchInput, 300);

  // 검색 실행
  useEffect(() => {
    if (!debouncedSearch || !searchProductsAction) {
      // 검색어 없거나 검색 기능 없으면 초기 상태로 복원
      setIsSearchMode(false);
      setProducts(initialProducts);
      return;
    }

    setIsSearchMode(true);
    startTransition(async () => {
      const result = await searchProductsAction(debouncedSearch, favorites);
      if (result.success && result.data) {
        setProducts(result.data);
      }
    });
  }, [debouncedSearch, searchProductsAction, favorites, initialProducts]);

  // 검색어 없을 때: 즐겨찾기 우선 + 재고 내림차순 정렬
  const sortedProducts = useMemo(() => {
    if (isSearchMode) {
      // 검색 모드에서는 서버 결과 그대로 사용
      return products;
    }

    // 즐겨찾기 + 재고순 정렬
    const sorted = [...products].sort((a, b) => {
      if (showFavorites) {
        const aFav = isFavorite(getProductId(a)) ? 1 : 0;
        const bFav = isFavorite(getProductId(b)) ? 1 : 0;
        if (aFav !== bFav) return bFav - aFav;
      }
      return getQuantity(b) - getQuantity(a);
    });

    return sorted.slice(0, GRID_SIZE);
  }, [products, isFavorite, isSearchMode, showFavorites, getProductId, getQuantity]);

  // 즐겨찾기 토글 핸들러
  const handleFavoriteToggle = useCallback(
    (productId: string) => {
      toggleFavorite(productId);
    },
    [toggleFavorite]
  );

  // 가용 재고 계산 (장바구니에 담긴 수량 제외)
  const getAvailableQuantity = useCallback(
    (product: T): number => {
      const productId = getProductId(product);
      const cartQty = cartQuantityByProduct.get(productId) ?? 0;
      return Math.max(0, getQuantity(product) - cartQty);
    },
    [cartQuantityByProduct, getProductId, getQuantity]
  );

  // 로딩 스켈레톤 (즐겨찾기 로드 전 또는 즐겨찾기 비활성화 시 스킵)
  if (showFavorites && !favoritesLoaded) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 검색 + 전체 버튼 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-10"
          />
        </div>
        {getAllProductsAction && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsAllProductsDialogOpen(true)}
            className="shrink-0"
          >
            <List className="h-4 w-4 mr-2" />
            전체
          </Button>
        )}
      </div>

      {/* 결과 카운트 */}
      {isSearchMode && (
        <p className="text-sm text-muted-foreground">
          {isPending ? '검색 중...' : `검색 결과: ${sortedProducts.length}개`}
        </p>
      )}

      {/* 제품 그리드 */}
      {sortedProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title={isSearchMode ? emptySearchMessage : emptyProductsMessage}
          description={isSearchMode ? '다른 검색어를 입력해보세요.' : '재고가 있는 제품이 없습니다.'}
        />
      ) : (
        <div
          className={`grid grid-cols-2 md:grid-cols-3 gap-3 ${isPending ? 'opacity-50' : ''}`}
        >
          {sortedProducts.map((product) => {
            const productId = getProductId(product);
            const availableQty = getAvailableQuantity(product);
            return (
              <ProductCard
                key={productId}
                name={getDisplayName(product)}
                modelName={product.modelName}
                additionalInfo={`재고: ${availableQty}개`}
                isSelected={!!(selectedProduct && getProductId(selectedProduct) === productId)}
                onClick={() => onSelectProduct(product)}
                disabled={availableQty === 0}
                isFavorite={showFavorites && isFavorite(productId)}
                onFavoriteToggle={showFavorites ? () => handleFavoriteToggle(productId) : undefined}
                showFavoriteButton={showFavorites}
              />
            );
          })}
        </div>
      )}

      {/* 전체 제품 다이얼로그 */}
      {getAllProductsAction && onAddToCart && onRemoveFromCart && (
        <AllProductsDialog<SelectableProduct>
          open={isAllProductsDialogOpen}
          onOpenChange={setIsAllProductsDialogOpen}
          organizationId={organizationId}
          getAllProductsAction={async (page, search) => {
            const result = await getAllProductsAction(page, search);
            if (result.success && result.data) {
              return {
                success: true as const,
                data: {
                  ...result.data,
                  items: result.data.items.map(toSelectableProduct),
                },
              };
            }
            return { success: false as const, error: result.error };
          }}
          cartItems={cartItems}
          onAddToCart={onAddToCart}
          onRemoveFromCart={onRemoveFromCart}
        />
      )}
    </div>
  );
}
