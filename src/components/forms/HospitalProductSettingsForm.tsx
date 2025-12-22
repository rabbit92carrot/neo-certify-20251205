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
import { Search, Package, Settings } from 'lucide-react';
import { cn } from '@/lib/utils/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/shared/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';
import {
  getHospitalKnownProductsAction,
  updateHospitalProductSettingsAction,
  checkAliasExistsAction,
} from '@/app/(dashboard)/hospital/actions';
import type { HospitalKnownProduct } from '@/types/api.types';

// ============================================================================
// 타입 정의
// ============================================================================

type AliasFilter = 'all' | 'with_alias' | 'without_alias';
type ActiveFilter = 'all' | 'active' | 'inactive';

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export function HospitalProductSettingsForm(): React.ReactElement {
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

    // 쿼리 파라미터 구성
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
    loadProducts();
  }, [loadProducts]);

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
    // 조건: 선택된 제품이 있고, 별칭이 입력되었고, 기존 값과 다른 경우
    if (!selectedProduct || !debouncedAlias || debouncedAlias === selectedProduct.alias) {
      setAliasError(null);
      return;
    }

    // 중복 체크 실행
    checkAliasExistsAction(debouncedAlias, selectedProduct.productId).then((exists) => {
      setAliasError(exists ? '이미 사용 중인 별칭입니다.' : null);
    });
  }, [debouncedAlias, selectedProduct]);

  // ============================================================================
  // 설정 저장
  // ============================================================================

  const handleSave = async () => {
    if (!selectedProduct || aliasError) return;

    setIsSaving(true);

    const result = await updateHospitalProductSettingsAction(selectedProduct.productId, {
      alias: alias || null,
      isActive,
    });

    if (result.success) {
      toast.success('설정이 저장되었습니다.');
      await loadProducts();

      // 선택된 제품 정보 갱신
      setSelectedProduct((prev) =>
        prev ? { ...prev, alias: alias || null, isActive } : null
      );
    } else {
      toast.error(result.error?.message || '설정 저장에 실패했습니다.');
    }

    setIsSaving(false);
  };

  // ============================================================================
  // 별칭 삭제
  // ============================================================================

  const handleDeleteAlias = async () => {
    if (!selectedProduct) return;

    setIsSaving(true);

    const result = await updateHospitalProductSettingsAction(selectedProduct.productId, {
      alias: null,
    });

    if (result.success) {
      toast.success('별칭이 삭제되었습니다.');
      setAlias('');
      await loadProducts();

      // 선택된 제품 정보 갱신
      setSelectedProduct((prev) => (prev ? { ...prev, alias: null } : null));
    } else {
      toast.error(result.error?.message || '별칭 삭제에 실패했습니다.');
    }

    setIsSaving(false);
  };

  // ============================================================================
  // 활성화 토글 (목록에서 즉시 변경)
  // ============================================================================

  const handleToggleActive = async (product: HospitalKnownProduct, e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 선택 방지

    const newValue = !product.isActive;

    const result = await updateHospitalProductSettingsAction(product.productId, {
      isActive: newValue,
    });

    if (result.success) {
      toast.success(newValue ? '제품이 활성화되었습니다.' : '제품이 비활성화되었습니다.');
      await loadProducts();

      // 선택된 제품이 변경된 제품이면 상태 갱신
      if (selectedProduct?.productId === product.productId) {
        setSelectedProduct((prev) => (prev ? { ...prev, isActive: newValue } : null));
        setIsActive(newValue);
      }
    } else {
      toast.error(result.error?.message || '상태 변경에 실패했습니다.');
    }
  };

  // ============================================================================
  // 제품 표시명 (별칭 우선)
  // ============================================================================

  const getDisplayName = useCallback((product: HospitalKnownProduct) => {
    if (product.alias) {
      return product.alias;
    }
    return product.modelName
      ? `${product.productName} (${product.modelName})`
      : product.productName;
  }, []);

  // ============================================================================
  // 필터링된 제품 수
  // ============================================================================

  const filteredCount = products.length;

  // ============================================================================
  // 렌더링
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* 검색 및 필터 */}
      <div className="space-y-4">
        {/* 검색창 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="제품명, 모델명, 별칭으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 필터 */}
        <div className="flex flex-wrap items-center gap-4">
          {/* 별칭 필터 */}
          <Tabs value={aliasFilter} onValueChange={(v) => setAliasFilter(v as AliasFilter)}>
            <TabsList>
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="with_alias">별칭 있음</TabsTrigger>
              <TabsTrigger value="without_alias">별칭 없음</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* 상태 필터 */}
          <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as ActiveFilter)}>
            <TabsList>
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="active">활성</TabsTrigger>
              <TabsTrigger value="inactive">비활성</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* 제품 수 표시 */}
          <span className="text-sm text-muted-foreground ml-auto">
            {filteredCount}개 제품
          </span>
        </div>
      </div>

      {/* 2컬럼 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 왼쪽: 제품 목록 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              제품 목록
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
            ) : products.length === 0 ? (
              <EmptyState
                icon={Package}
                title="등록된 제품이 없습니다"
                description="입고받은 제품이 자동으로 등록됩니다."
              />
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                      selectedProduct?.id === product.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50',
                      !product.isActive && 'opacity-60'
                    )}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="font-medium truncate">{getDisplayName(product)}</p>
                      {product.alias && (
                        <p className="text-xs text-muted-foreground truncate">
                          {product.productName} · {product.modelName}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        재고: {product.currentInventory}개
                      </p>
                    </div>
                    <Switch
                      checked={product.isActive}
                      onCheckedChange={() => {}}
                      onClick={(e) => handleToggleActive(product, e)}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 오른쪽: 설정 패널 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              제품 설정
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedProduct ? (
              <div className="space-y-6">
                {/* 선택된 제품 정보 */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium">{selectedProduct.productName}</h4>
                  {selectedProduct.modelName && (
                    <p className="text-sm text-muted-foreground">
                      모델: {selectedProduct.modelName}
                    </p>
                  )}
                  {selectedProduct.udiDi && (
                    <p className="text-xs text-muted-foreground mt-1">
                      UDI: {selectedProduct.udiDi}
                    </p>
                  )}
                </div>

                {/* 별칭 설정 */}
                <div className="space-y-2">
                  <Label htmlFor="alias">별칭</Label>
                  <div className="relative">
                    <Input
                      id="alias"
                      placeholder="예: 볼, 이마, 코"
                      value={alias}
                      onChange={(e) => setAlias(e.target.value)}
                      maxLength={100}
                      className={cn(aliasError && 'border-destructive')}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {alias.length}/100
                    </span>
                  </div>
                  {aliasError && (
                    <p className="text-sm text-destructive">{aliasError}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    시술 등록 시 이 별칭으로 표시됩니다.
                  </p>
                </div>

                {/* 활성화 설정 */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>시술 등록 활성화</Label>
                    <p className="text-xs text-muted-foreground">
                      비활성화 시 시술 등록에서 숨겨집니다.
                    </p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>

                {/* 버튼 */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || !!aliasError}
                    className="flex-1"
                  >
                    {isSaving ? '저장 중...' : '설정 저장'}
                  </Button>
                  {selectedProduct.alias && (
                    <Button
                      variant="outline"
                      onClick={handleDeleteAlias}
                      disabled={isSaving}
                    >
                      별칭 삭제
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Settings}
                title="제품을 선택하세요"
                description="왼쪽 목록에서 설정할 제품을 선택하세요."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
