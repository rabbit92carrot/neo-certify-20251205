'use client';

/**
 * 출고용 제품 선택 컴포넌트
 *
 * ProductSelector를 기반으로 출고 전용 기능(Lot 조회)을 추가한 컴포넌트입니다.
 * 제조사/유통사 출고 페이지에서 사용됩니다.
 *
 * SSOT: 공통 제품 선택 로직은 ProductSelector에 위임
 */

import { ProductSelector } from '@/components/shared/ProductSelector';
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
  /** Lot 조회 액션 (lazy load) - ShipmentFormV2에서 사용 */
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

/**
 * 출고용 제품 선택 컴포넌트
 */
export function ShipmentProductSelector({
  organizationId,
  initialProducts,
  selectedProduct,
  onSelectProduct,
  searchProductsAction,
  getProductLotsAction: _getProductLotsAction, // ShipmentFormV2에서 별도 사용
  getAllProductsAction,
  cartQuantityByProduct = new Map(),
  cartItems = [],
  onAddToCart,
  onRemoveFromCart,
}: ShipmentProductSelectorProps): React.ReactElement {
  return (
    <ProductSelector<ShipmentProductSummary>
      organizationId={organizationId}
      initialProducts={initialProducts}
      selectedProduct={selectedProduct}
      onSelectProduct={onSelectProduct}
      // 필드 접근자
      getProductId={(p) => p.productId}
      getDisplayName={(p) => p.productName}
      getQuantity={(p) => p.totalQuantity}
      toSelectableProduct={toSelectableProduct}
      // 검색 기능
      searchProductsAction={searchProductsAction}
      getAllProductsAction={getAllProductsAction}
      // 장바구니 연동
      cartQuantityByProduct={cartQuantityByProduct}
      cartItems={cartItems}
      onAddToCart={onAddToCart}
      onRemoveFromCart={onRemoveFromCart}
      // 커스터마이징
      showFavorites={true}
      searchPlaceholder="제품명, 모델명으로 검색..."
      emptySearchMessage="검색 결과가 없습니다"
      emptyProductsMessage="출고 가능한 제품이 없습니다"
    />
  );
}
