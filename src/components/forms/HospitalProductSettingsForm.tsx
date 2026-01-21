'use client';

/**
 * 병원 제품 관리 폼
 *
 * 2컬럼 레이아웃:
 * - 상단: 검색창 + Segmented Control 필터 (별칭/상태)
 * - 왼쪽: 제품 목록 (토글 스위치 포함)
 * - 오른쪽: 선택된 제품 설정 (별칭 입력 + 활성화 토글)
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import {
  getHospitalKnownProductsAction,
  updateHospitalProductSettingsAction,
  checkAliasExistsAction,
} from '@/app/(dashboard)/hospital/actions';
import {
  SearchAndFilterSection,
  ProductListPanel,
  ProductSettingsPanel,
} from './hospital-product';
import type { AliasFilter, ActiveFilter } from './hospital-product';
import type { HospitalKnownProduct } from '@/types/api.types';

interface HospitalProductSettingsFormProps {
  /** Preview 모드 여부 (true면 초기 데이터 로드 스킵) */
  isPreview?: boolean;
}

export function HospitalProductSettingsForm({
  isPreview = false,
}: HospitalProductSettingsFormProps): React.ReactElement {
  // 제품 목록 상태
  const [products, setProducts] = useState<HospitalKnownProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<HospitalKnownProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [aliasFilter, setAliasFilter] = useState<AliasFilter>('all');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // 설정 폼 상태
  const [alias, setAlias] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [aliasError, setAliasError] = useState<string | null>(null);
  const debouncedAlias = useDebounce(alias, 500);

  // ============================================================================
  // 제품 목록 로드
  // ============================================================================

  const loadProducts = useCallback(async () => {
    setIsLoading(true);

    const query: {
      search?: string;
      aliasFilter?: 'with_alias' | 'without_alias';
      activeFilter?: boolean;
    } = {};

    if (debouncedSearch) {
      query.search = debouncedSearch;
    }

    if (aliasFilter !== 'all') {
      query.aliasFilter = aliasFilter;
    }

    if (activeFilter === 'active') {
      query.activeFilter = true;
    } else if (activeFilter === 'inactive') {
      query.activeFilter = false;
    }

    const result = await getHospitalKnownProductsAction(query);

    if (result.success && result.data) {
      setProducts(result.data);
    } else {
      toast.error(result.error?.message || '제품 목록을 불러오는데 실패했습니다.');
    }

    setIsLoading(false);
  }, [debouncedSearch, aliasFilter, activeFilter]);

  useEffect(() => {
    if (!isPreview) {
      loadProducts();
    } else {
      setIsLoading(false);
    }
  }, [loadProducts, isPreview]);

  // ============================================================================
  // 제품 선택 시 폼 초기화
  // ============================================================================

  useEffect(() => {
    if (selectedProduct) {
      setAlias(selectedProduct.alias || '');
      setIsActive(selectedProduct.isActive);
      setAliasError(null);
    }
  }, [selectedProduct]);

  // ============================================================================
  // 별칭 중복 체크
  // ============================================================================

  useEffect(() => {
    if (!selectedProduct || !debouncedAlias || debouncedAlias === selectedProduct.alias) {
      setAliasError(null);
      return;
    }

    checkAliasExistsAction(debouncedAlias, selectedProduct.productId).then((exists) => {
      setAliasError(exists ? '이미 사용 중인 별칭입니다.' : null);
    });
  }, [debouncedAlias, selectedProduct]);

  // ============================================================================
  // 핸들러
  // ============================================================================

  const handleSave = useCallback(async () => {
    if (!selectedProduct || aliasError) {return;}

    setIsSaving(true);

    const result = await updateHospitalProductSettingsAction(selectedProduct.productId, {
      alias: alias || null,
      isActive,
    });

    if (result.success) {
      toast.success('설정이 저장되었습니다.');
      await loadProducts();
      setSelectedProduct((prev) =>
        prev ? { ...prev, alias: alias || null, isActive } : null
      );
    } else {
      toast.error(result.error?.message || '설정 저장에 실패했습니다.');
    }

    setIsSaving(false);
  }, [selectedProduct, aliasError, alias, isActive, loadProducts]);

  const handleDeleteAlias = useCallback(async () => {
    if (!selectedProduct) {return;}

    setIsSaving(true);

    const result = await updateHospitalProductSettingsAction(selectedProduct.productId, {
      alias: null,
    });

    if (result.success) {
      toast.success('별칭이 삭제되었습니다.');
      setAlias('');
      await loadProducts();
      setSelectedProduct((prev) => (prev ? { ...prev, alias: null } : null));
    } else {
      toast.error(result.error?.message || '별칭 삭제에 실패했습니다.');
    }

    setIsSaving(false);
  }, [selectedProduct, loadProducts]);

  const handleToggleActive = useCallback(
    async (product: HospitalKnownProduct, e: React.MouseEvent) => {
      e.stopPropagation();

      const newValue = !product.isActive;

      const result = await updateHospitalProductSettingsAction(product.productId, {
        isActive: newValue,
      });

      if (result.success) {
        toast.success(newValue ? '제품이 활성화되었습니다.' : '제품이 비활성화되었습니다.');
        await loadProducts();

        if (selectedProduct?.productId === product.productId) {
          setSelectedProduct((prev) => (prev ? { ...prev, isActive: newValue } : null));
          setIsActive(newValue);
        }
      } else {
        toast.error(result.error?.message || '상태 변경에 실패했습니다.');
      }
    },
    [selectedProduct, loadProducts]
  );

  const getDisplayName = useCallback((product: HospitalKnownProduct) => {
    if (product.alias) {
      return product.alias;
    }
    return product.modelName
      ? `${product.productName} (${product.modelName})`
      : product.productName;
  }, []);

  // ============================================================================
  // 렌더링
  // ============================================================================

  return (
    <div className="space-y-6">
      <SearchAndFilterSection
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        aliasFilter={aliasFilter}
        onAliasFilterChange={setAliasFilter}
        activeFilter={activeFilter}
        onActiveFilterChange={setActiveFilter}
        productCount={products.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductListPanel
          products={products}
          selectedProduct={selectedProduct}
          onProductSelect={setSelectedProduct}
          onToggleActive={handleToggleActive}
          isLoading={isLoading}
          getDisplayName={getDisplayName}
        />

        <ProductSettingsPanel
          selectedProduct={selectedProduct}
          alias={alias}
          onAliasChange={setAlias}
          aliasError={aliasError}
          isActive={isActive}
          onActiveChange={setIsActive}
          isSaving={isSaving}
          onSave={handleSave}
          onDeleteAlias={handleDeleteAlias}
        />
      </div>
    </div>
  );
}
