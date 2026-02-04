'use client';

/**
 * 전체 제품 다이얼로그 V2
 * 출고 페이지에서 모든 제품을 검색하고 여러 제품을 장바구니에 추가할 수 있는 다이얼로그
 *
 * 주요 기능:
 * - 좌우 분할 레이아웃 (좌: 제품 목록 | 우: 수량 입력 + 미니 장바구니)
 * - 다이얼로그 내에서 여러 제품 추가 가능
 * - 부모 컴포넌트의 장바구니와 실시간 동기화
 */

import { useState, useCallback, useTransition, useEffect, useMemo } from 'react';
import { Search, Loader2, Minus, Plus, Package } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCompactItem } from '@/components/shared/ProductCompactItem';
import { MiniCartDisplay } from '@/components/shared/MiniCartDisplay';
import { EmptyState } from '@/components/shared/EmptyState';
import { useDebounce, useFavoriteProducts } from '@/hooks';
import type { ShipmentProductSummary, ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { CartItem } from '@/hooks/useCart';

interface AllProductsDialogProps {
  /** 다이얼로그 열림 상태 */
  open: boolean;
  /** 다이얼로그 닫기 핸들러 */
  onOpenChange: (open: boolean) => void;
  /** 조직 ID (즐겨찾기용) */
  organizationId: string;
  /** 전체 제품 검색 액션 */
  getAllProductsAction: (
    page: number,
    search: string
  ) => Promise<ApiResponse<PaginatedResponse<ShipmentProductSummary>>>;
  /** 장바구니 아이템 목록 */
  cartItems: CartItem[];
  /** 장바구니에 아이템 추가 */
  onAddToCart: (item: CartItem) => void;
  /** 장바구니에서 아이템 삭제 */
  onRemoveFromCart: (productId: string, lotId?: string) => void;
}

/**
 * 전체 제품 다이얼로그 컴포넌트 V2
 */
export function AllProductsDialog({
  open,
  onOpenChange,
  organizationId,
  getAllProductsAction,
  cartItems,
  onAddToCart,
  onRemoveFromCart,
}: AllProductsDialogProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState('');
  const [products, setProducts] = useState<ShipmentProductSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // 다이얼로그 내 선택된 제품 상태
  const [selectedProduct, setSelectedProduct] = useState<ShipmentProductSummary | null>(null);
  const [quantityInput, setQuantityInput] = useState<string>('1');

  // 즐겨찾기 훅
  const { toggleFavorite, isFavorite } = useFavoriteProducts(organizationId);

  // 디바운스된 검색어
  const debouncedSearch = useDebounce(searchInput, 300);

  // 장바구니에 담긴 제품별 수량 계산 (O(1) 조회용)
  const cartQuantityByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of cartItems) {
      const current = map.get(item.productId) ?? 0;
      map.set(item.productId, current + item.quantity);
    }
    return map;
  }, [cartItems]);

  // 제품 목록 로드
  const loadProducts = useCallback(
    (pageNum: number, search: string) => {
      startTransition(async () => {
        const result = await getAllProductsAction(pageNum, search);
        if (result.success && result.data) {
          setProducts(result.data.items);
          setPage(result.data.meta.page);
          setTotalPages(result.data.meta.totalPages);
          setTotal(result.data.meta.total);
        }
        setIsInitialized(true);
      });
    },
    [getAllProductsAction]
  );

  // 다이얼로그 열릴 때 초기 로드
  useEffect(() => {
    if (open && !isInitialized) {
      loadProducts(1, '');
    }
  }, [open, isInitialized, loadProducts]);

  // 검색어 변경 시 재검색
  useEffect(() => {
    if (open && isInitialized) {
      loadProducts(1, debouncedSearch);
    }
  }, [debouncedSearch, open, isInitialized, loadProducts]);

  // 다이얼로그 닫힐 때 상태 초기화
  useEffect(() => {
    if (!open) {
      setSearchInput('');
      setPage(1);
      setIsInitialized(false);
      setSelectedProduct(null);
      setQuantityInput('1');
    }
  }, [open]);

  // 가용 재고 계산
  const getAvailableQuantity = useCallback(
    (product: ShipmentProductSummary): number => {
      const cartQty = cartQuantityByProduct.get(product.productId) ?? 0;
      return Math.max(0, product.totalQuantity - cartQty);
    },
    [cartQuantityByProduct]
  );

  // 현재 선택된 제품의 가용 재고
  const selectedAvailableQty = selectedProduct
    ? getAvailableQuantity(selectedProduct)
    : 0;

  // 제품 선택 핸들러 (다이얼로그 닫지 않음)
  const handleSelectProduct = (product: ShipmentProductSummary) => {
    setSelectedProduct(product);
    setQuantityInput('1');
  };

  // 수량 조절
  const adjustQuantity = (delta: number) => {
    const current = parseInt(quantityInput) || 1;
    const newQty = Math.max(1, Math.min(selectedAvailableQty, current + delta));
    setQuantityInput(String(newQty));
  };

  // 장바구니에 추가
  const handleAddToCart = () => {
    if (!selectedProduct) return;

    const qty = parseInt(quantityInput) || 1;
    if (qty <= 0 || qty > selectedAvailableQty) return;

    onAddToCart({
      productId: selectedProduct.productId,
      productName: selectedProduct.productName,
      quantity: qty,
    });

    // 추가 후 선택 초기화
    setSelectedProduct(null);
    setQuantityInput('1');
  };

  // 페이지 변경
  const handlePageChange = (newPage: number) => {
    loadProducts(newPage, debouncedSearch);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[calc(100vw-4rem)] !max-w-[1600px] sm:!max-w-[1600px] !h-[calc(100vh-4rem)] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-4 pb-3 border-b shrink-0">
          <DialogTitle>전체 제품</DialogTitle>
        </DialogHeader>

        {/* 메인 컨텐츠: 좌우 분할 (7:3 비율) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-10 gap-6 p-6 min-h-0 overflow-hidden">
          {/* 좌측: 제품 목록 (7/10) */}
          <div className="lg:col-span-7 flex flex-col min-h-0 gap-3">
            {/* 검색 */}
            <div className="relative shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="제품명, 모델명으로 검색..."
                className="pl-10"
              />
            </div>

            {/* 결과 카운트 */}
            <div className="flex items-center justify-between text-sm text-muted-foreground shrink-0">
              <span>{isPending ? '검색 중...' : `총 ${total}개 제품`}</span>
              {totalPages > 1 && (
                <span>
                  {page} / {totalPages} 페이지
                </span>
              )}
            </div>

            {/* 제품 목록 */}
            <div className="relative flex-1 border rounded-md overflow-hidden min-h-0">
              <ScrollArea className="h-full">
                {!isInitialized ? (
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 p-3">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full" />
                    ))}
                  </div>
                ) : products.length === 0 ? (
                  <div className="p-4">
                    <EmptyState
                      icon={Search}
                      title={
                        searchInput
                          ? '검색 결과가 없습니다'
                          : '출고 가능한 제품이 없습니다'
                      }
                      description={
                        searchInput
                          ? '다른 검색어를 입력해보세요.'
                          : '재고가 있는 제품이 없습니다.'
                      }
                    />
                  </div>
                ) : (
                  <div
                    className={`grid grid-cols-2 xl:grid-cols-3 gap-2 p-3 ${isPending ? 'opacity-50' : ''}`}
                  >
                    {products.map((product) => {
                      const availableQty = getAvailableQuantity(product);
                      const isSelected =
                        selectedProduct?.productId === product.productId;
                      return (
                        <ProductCompactItem
                          key={product.productId}
                          name={product.productName}
                          modelName={product.modelName}
                          quantity={availableQty}
                          onClick={() => handleSelectProduct(product)}
                          disabled={availableQty === 0}
                          isSelected={isSelected}
                          isFavorite={isFavorite(product.productId)}
                          onFavoriteToggle={() =>
                            toggleFavorite(product.productId)
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              {/* 로딩 오버레이 */}
              {isPending && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1 || isPending}
                >
                  이전
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages || isPending}
                >
                  다음
                </Button>
              </div>
            )}
          </div>

          {/* 우측: 수량 입력 + 미니 장바구니 (3/10) */}
          <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
            {/* 수량 입력 패널 */}
            {selectedProduct ? (
              <div className="border rounded-lg p-4 space-y-4 shrink-0">
                <div>
                  <h3 className="font-medium text-base">
                    {selectedProduct.productName}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedProduct.modelName && (
                      <span>{selectedProduct.modelName} &bull; </span>
                    )}
                    재고: <strong>{selectedAvailableQty}개</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => adjustQuantity(-1)}
                    disabled={parseInt(quantityInput) <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    max={selectedAvailableQty}
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(e.target.value)}
                    className="w-24 text-center text-lg font-medium"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => adjustQuantity(1)}
                    disabled={parseInt(quantityInput) >= selectedAvailableQty}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    / {selectedAvailableQty}개
                  </span>
                </div>

                <Button
                  onClick={handleAddToCart}
                  className="w-full"
                  disabled={
                    selectedAvailableQty === 0 ||
                    parseInt(quantityInput) <= 0 ||
                    parseInt(quantityInput) > selectedAvailableQty
                  }
                >
                  장바구니에 추가
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground shrink-0 min-h-[180px]">
                <Package className="h-10 w-10 mb-3 opacity-50" />
                <p className="text-sm text-center">
                  좌측에서 제품을 선택하세요
                </p>
              </div>
            )}

            {/* 미니 장바구니 */}
            <MiniCartDisplay
              items={cartItems}
              onRemove={onRemoveFromCart}
              maxHeight="calc(100% - 220px)"
              className="flex-1 min-h-0"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
