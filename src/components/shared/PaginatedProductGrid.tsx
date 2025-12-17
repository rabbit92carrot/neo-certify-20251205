'use client';

/**
 * 페이지네이션이 적용된 제품 그리드 컴포넌트
 * 모바일: 4개/페이지, PC: 12개/페이지로 반응형 동작
 * 숫자 + 화살표 스타일의 페이지네이션 UI 제공
 */

import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { ProductCard } from './ProductCard';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import type { Product } from '@/types/api.types';

interface ProductWithInventory extends Product {
  availableQuantity: number;
}

interface PaginatedProductGridProps {
  /** 제품 목록 */
  products: ProductWithInventory[];
  /** 선택된 제품 ID */
  selectedProductId?: string;
  /** 제품 선택 핸들러 */
  onSelect: (product: ProductWithInventory) => void;
  /** 가용 수량 계산 함수 */
  getAvailableQuantity: (product: ProductWithInventory) => number;
  /** 카드 최소 너비 (px) */
  minCardWidth?: number;
  /** 모바일 페이지당 항목 수 */
  mobileItemsPerPage?: number;
  /** PC 페이지당 항목 수 */
  desktopItemsPerPage?: number;
}

/**
 * 페이지네이션이 적용된 제품 그리드
 * - 반응형 페이지 사이즈 (모바일 4개, PC 12개)
 * - 숫자 + 화살표 페이지네이션 UI
 * - 검색/필터 변경 시 자동으로 첫 페이지로 이동
 */
export const PaginatedProductGrid = memo(function PaginatedProductGrid({
  products,
  selectedProductId,
  onSelect,
  getAvailableQuantity,
  minCardWidth = 240,
  mobileItemsPerPage = 4,
  desktopItemsPerPage = 12,
}: PaginatedProductGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  // SSR에서는 null, 클라이언트에서 실제 값 설정
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  // 반응형 감지 (768px 기준)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // SSR/hydration 중에는 로딩 표시 없이 모바일 우선 레이아웃 사용
  const isMobileLayout = isMobile ?? true;

  // 페이지당 항목 수 결정
  const itemsPerPage = isMobileLayout ? mobileItemsPerPage : desktopItemsPerPage;

  // 총 페이지 수
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(products.length / itemsPerPage));
  }, [products.length, itemsPerPage]);

  // 제품 목록이나 페이지 크기 변경 시 페이지 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [products.length, itemsPerPage]);

  // 현재 페이지가 총 페이지 수를 초과하면 조정
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // 현재 페이지에 표시할 제품들
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return products.slice(startIndex, startIndex + itemsPerPage);
  }, [products, currentPage, itemsPerPage]);

  // 안정적인 onSelect 핸들러
  const handleSelect = useCallback(
    (product: ProductWithInventory) => {
      onSelect(product);
    },
    [onSelect]
  );

  // 페이지 변경 핸들러
  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  // 표시할 페이지 번호 계산 (최대 5개)
  const pageNumbers = useMemo(() => {
    const maxVisible = isMobileLayout ? 3 : 5;
    const pages: (number | 'ellipsis')[] = [];

    if (totalPages <= maxVisible) {
      // 전체 페이지가 적으면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 첫 페이지는 항상 표시
      pages.push(1);

      if (currentPage <= 2) {
        // 현재 페이지가 앞쪽
        for (let i = 2; i <= Math.min(maxVisible - 1, totalPages - 1); i++) {
          pages.push(i);
        }
        if (totalPages > maxVisible) pages.push('ellipsis');
      } else if (currentPage >= totalPages - 1) {
        // 현재 페이지가 뒤쪽
        if (totalPages > maxVisible) pages.push('ellipsis');
        for (let i = Math.max(2, totalPages - maxVisible + 2); i <= totalPages - 1; i++) {
          pages.push(i);
        }
      } else {
        // 현재 페이지가 중간
        pages.push('ellipsis');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        if (currentPage + 1 < totalPages - 1) pages.push('ellipsis');
      }

      // 마지막 페이지는 항상 표시
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  }, [totalPages, currentPage, isMobileLayout]);

  // 제품이 없으면 빈 상태 (부모 컴포넌트에서 처리)
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* 제품 그리드 - 모바일/PC 모두 동적 그리드 */}
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${minCardWidth}px, 1fr))`,
        }}
      >
        {paginatedProducts.map((product) => {
          const availableQty = getAvailableQuantity(product);
          return (
            <ProductCard
              key={product.id}
              name={product.name}
              modelName={product.model_name}
              additionalInfo={`재고: ${availableQty}개`}
              isSelected={selectedProductId === product.id}
              onClick={() => handleSelect(product)}
              disabled={availableQty === 0}
            />
          );
        })}
      </div>

      {/* 페이지네이션 (2페이지 이상일 때만 표시) */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {/* 이전 버튼 */}
            <PaginationItem>
              <PaginationPrevious
                onClick={() => goToPage(currentPage - 1)}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                aria-disabled={currentPage === 1}
              />
            </PaginationItem>

            {/* 페이지 번호 */}
            {pageNumbers.map((page, index) =>
              page === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => goToPage(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            {/* 다음 버튼 */}
            <PaginationItem>
              <PaginationNext
                onClick={() => goToPage(currentPage + 1)}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                aria-disabled={currentPage === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* 페이지 정보 (디버그용, 필요 시 주석 해제) */}
      {/* <p className="text-xs text-muted-foreground text-center">
        {products.length}개 중 {(currentPage - 1) * itemsPerPage + 1}-
        {Math.min(currentPage * itemsPerPage, products.length)}개 표시
      </p> */}
    </div>
  );
});
