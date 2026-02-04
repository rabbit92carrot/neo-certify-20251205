'use client';

/**
 * 출고용 제품 선택 컴포넌트
 * 12개 카드 그리드, 검색, 즐겨찾기 기능을 제공합니다.
 */

import { useState, useCallback, useTransition, useMemo, useEffect } from 'react';
import { Package, Search, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/shared/ProductCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { AllProductsDialog } from '@/components/shared/AllProductsDialog';
import { useFavoriteProducts } from '@/hooks';
import { useDebounce } from '@/hooks';
import type {
  ShipmentProductSummary,
  SelectableProduct,
  InventoryByLot,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api.types';
import type { CartItem } from '@/hooks/useCart';

/**
 * ShipmentProductSummary를 SelectableProduct로 변환하는 어댑터
 */
const toSelectableProduct = (product: ShipmentProductSummary): SelectableProduct => ({
  productId: product.productId,
  productName: product.productName,
  modelName: product.modelName,
  quantity: product.totalQuantity,
});

interface ShipmentProductSelectorProps {
  /** 조직 ID (즐겨찾기 저장용) */
  organizationId: string;
  /** 초기 제품 목록 (상위 12개) */
  initialProducts: ShipmentProductSummary[];
  /** 선택된 제품 */
  selectedProduct: ShipmentProductSummary | null;
  /** 제품 선택 핸들러 */
  onSelectProduct: (product: ShipmentProductSummary) => void;
  /** 제품 검색 액션 */
  searchProductsAction: (
    search: string,
    favoriteIds: string[]
  ) => Promise<ApiResponse<ShipmentProductSummary[]>>;
  /** Lot 조회 액션 (lazy load) */
  getProductLotsAction: (productId: string) => Promise<ApiResponse<InventoryByLot[]>>;
  /** 전체 제품 조회 액션 (다이얼로그용) */
  getAllProductsAction?: (
    page: number,
    search: string
  ) => Promise<ApiResponse<PaginatedResponse<ShipmentProductSummary>>>;
  /** 장바구니에 담긴 제품별 수량 (가용 재고 계산용) */
  cartQuantityByProduct?: Map<string, number>;
  /** 장바구니 아이템 목록 (AllProductsDialog용) */
  cartItems?: CartItem[];
  /** 장바구니에 아이템 추가 (AllProductsDialog용) */
  onAddToCart?: (item: CartItem) => void;
  /** 장바구니에서 아이템 삭제 (AllProductsDialog용) */
  onRemoveFromCart?: (productId: string, lotId?: string) => void;
}

const GRID_SIZE = 12; // 3x4 그리드

/**
 * 출고용 제품 선택 컴포넌트
 */
export function ShipmentProductSelector({
  organizationId,
  initialProducts,
  selectedProduct,
  onSelectProduct,
  searchProductsAction,
  getProductLotsAction: _getProductLotsAction,
  getAllProductsAction,
  cartQuantityByProduct = new Map(),
  cartItems = [],
  onAddToCart,
  onRemoveFromCart,
}: ShipmentProductSelectorProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState('');
  const [products, setProducts] = useState<ShipmentProductSummary[]>(initialProducts);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isAllProductsDialogOpen, setIsAllProductsDialogOpen] = useState(false);

  // 즐겨찾기 훅
  const { favorites, toggleFavorite, isFavorite, isLoaded: favoritesLoaded } = useFavoriteProducts(organizationId);

  // 디바운스된 검색어
  const debouncedSearch = useDebounce(searchInput, 300);

  // 검색 실행
  useEffect(() => {
    if (!debouncedSearch) {
      // 검색어 없으면 초기 상태로 복원
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
      const aFav = isFavorite(a.productId) ? 1 : 0;
      const bFav = isFavorite(b.productId) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;
      return b.totalQuantity - a.totalQuantity;
    });

    return sorted.slice(0, GRID_SIZE);
  }, [products, isFavorite, isSearchMode]);

  // 즐겨찾기 토글 핸들러
  const handleFavoriteToggle = useCallback(
    (productId: string) => {
      toggleFavorite(productId);
    },
    [toggleFavorite]
  );

  // 가용 재고 계산 (장바구니에 담긴 수량 제외)
  const getAvailableQuantity = useCallback(
    (product: ShipmentProductSummary): number => {
      const cartQty = cartQuantityByProduct.get(product.productId) ?? 0;
      return Math.max(0, product.totalQuantity - cartQty);
    },
    [cartQuantityByProduct]
  );

  // 로딩 스켈레톤
  if (!favoritesLoaded) {
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
            placeholder="제품명, 모델명으로 검색..."
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
          title={isSearchMode ? '검색 결과가 없습니다' : '출고 가능한 제품이 없습니다'}
          description={isSearchMode ? '다른 검색어를 입력해보세요.' : '재고가 있는 제품이 없습니다.'}
        />
      ) : (
        <div
          className={`grid grid-cols-2 md:grid-cols-3 gap-3 ${isPending ? 'opacity-50' : ''}`}
        >
          {sortedProducts.map((product) => {
            const availableQty = getAvailableQuantity(product);
            return (
              <ProductCard
                key={product.productId}
                name={product.productName}
                modelName={product.modelName}
                additionalInfo={`재고: ${availableQty}개`}
                isSelected={selectedProduct?.productId === product.productId}
                onClick={() => onSelectProduct(product)}
                disabled={availableQty === 0}
                isFavorite={isFavorite(product.productId)}
                onFavoriteToggle={() => handleFavoriteToggle(product.productId)}
                showFavoriteButton
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
          cartItems={cartItems ?? []}
          onAddToCart={onAddToCart}
          onRemoveFromCart={onRemoveFromCart}
        />
      )}
    </div>
  );
}
