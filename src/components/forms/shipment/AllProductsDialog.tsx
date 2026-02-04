'use client';

/**
 * 전체 제품 다이얼로그
 * 출고 페이지에서 모든 제품을 검색하고 선택할 수 있는 다이얼로그
 */

import { useState, useCallback, useTransition, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
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
import { EmptyState } from '@/components/shared/EmptyState';
import { useDebounce, useFavoriteProducts } from '@/hooks';
import type { ShipmentProductSummary, ApiResponse, PaginatedResponse } from '@/types/api.types';

interface AllProductsDialogProps {
  /** 다이얼로그 열림 상태 */
  open: boolean;
  /** 다이얼로그 닫기 핸들러 */
  onOpenChange: (open: boolean) => void;
  /** 조직 ID (즐겨찾기용) */
  organizationId: string;
  /** 제품 선택 핸들러 */
  onSelectProduct: (product: ShipmentProductSummary) => void;
  /** 전체 제품 검색 액션 */
  getAllProductsAction: (
    page: number,
    search: string
  ) => Promise<ApiResponse<PaginatedResponse<ShipmentProductSummary>>>;
  /** 장바구니에 담긴 제품별 수량 (가용 재고 계산용) */
  cartQuantityByProduct?: Map<string, number>;
}

/**
 * 전체 제품 다이얼로그 컴포넌트
 */
export function AllProductsDialog({
  open,
  onOpenChange,
  organizationId,
  onSelectProduct,
  getAllProductsAction,
  cartQuantityByProduct = new Map(),
}: AllProductsDialogProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState('');
  const [products, setProducts] = useState<ShipmentProductSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // 즐겨찾기 훅
  const { toggleFavorite, isFavorite } = useFavoriteProducts(organizationId);

  // 디바운스된 검색어
  const debouncedSearch = useDebounce(searchInput, 300);

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
    }
  }, [open]);

  // 제품 선택 핸들러
  const handleSelectProduct = (product: ShipmentProductSummary) => {
    onSelectProduct(product);
    onOpenChange(false);
  };

  // 가용 재고 계산
  const getAvailableQuantity = (product: ShipmentProductSummary): number => {
    const cartQty = cartQuantityByProduct.get(product.productId) ?? 0;
    return Math.max(0, product.totalQuantity - cartQty);
  };

  // 페이지 변경
  const handlePageChange = (newPage: number) => {
    loadProducts(newPage, debouncedSearch);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>전체 제품</DialogTitle>
        </DialogHeader>

        {/* 검색 */}
        <div className="relative">
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
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {isPending ? '검색 중...' : `총 ${total}개 제품`}
          </span>
          {totalPages > 1 && (
            <span>
              {page} / {totalPages} 페이지
            </span>
          )}
        </div>

        {/* 제품 목록 - 고정 높이 컨테이너로 스크롤 영역 제한 */}
        <div className="relative h-[350px] border rounded-md overflow-hidden">
          <ScrollArea className="h-full">
            {!isInitialized ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={Search}
                  title={searchInput ? '검색 결과가 없습니다' : '출고 가능한 제품이 없습니다'}
                  description={searchInput ? '다른 검색어를 입력해보세요.' : '재고가 있는 제품이 없습니다.'}
                />
              </div>
            ) : (
              <div className={`space-y-1 p-2 ${isPending ? 'opacity-50' : ''}`}>
                {products.map((product) => {
                  const availableQty = getAvailableQuantity(product);
                  return (
                    <ProductCompactItem
                      key={product.productId}
                      name={product.productName}
                      modelName={product.modelName}
                      quantity={availableQty}
                      onClick={() => handleSelectProduct(product)}
                      disabled={availableQty === 0}
                      isFavorite={isFavorite(product.productId)}
                      onFavoriteToggle={() => toggleFavorite(product.productId)}
                    />
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* 로딩 오버레이 - 스크롤 영역 내부에 배치 */}
          {isPending && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* 페이지네이션 - 스크롤 영역 외부에 고정 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2 border-t">
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
      </DialogContent>
    </Dialog>
  );
}
