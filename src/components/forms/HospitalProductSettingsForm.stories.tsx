'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect } from 'react';
import { Search, X, Settings, Package, Check, Save, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

/**
 * HospitalProductSettingsForm은 Server Actions에 의존합니다.
 * Storybook에서는 Mock 컴포넌트로 UI를 시뮬레이션합니다.
 */

interface MockHospitalProduct {
  productId: string;
  productName: string;
  modelName: string;
  alias: string | null;
  isActive: boolean;
  manufacturerName: string;
}

type AliasFilter = 'all' | 'with_alias' | 'without_alias';
type ActiveFilter = 'all' | 'active' | 'inactive';

const mockProducts: MockHospitalProduct[] = [
  { productId: 'prod-001', productName: 'PDO Thread Type A', modelName: 'PDO-A-100', alias: '타입A', isActive: true, manufacturerName: '네오메디컬' },
  { productId: 'prod-002', productName: 'PDO Thread Type B', modelName: 'PDO-B-200', alias: null, isActive: true, manufacturerName: '네오메디컬' },
  { productId: 'prod-003', productName: 'PDO Thread Premium', modelName: 'PDO-P-500', alias: '프리미엄', isActive: true, manufacturerName: '네오메디컬' },
  { productId: 'prod-004', productName: 'PDO Thread Economy', modelName: 'PDO-E-100', alias: null, isActive: false, manufacturerName: '네오메디컬' },
  { productId: 'prod-005', productName: 'PDO Thread Special', modelName: 'PDO-S-300', alias: '스페셜', isActive: false, manufacturerName: '네오메디컬' },
];

function MockSearchAndFilterSection({
  searchTerm,
  onSearchChange,
  aliasFilter,
  onAliasFilterChange,
  activeFilter,
  onActiveFilterChange,
  productCount,
}: {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  aliasFilter: AliasFilter;
  onAliasFilterChange: (value: AliasFilter) => void;
  activeFilter: ActiveFilter;
  onActiveFilterChange: (value: ActiveFilter) => void;
  productCount: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="제품명, 모델명, 별칭 검색..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchTerm && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => onSearchChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Badge variant="secondary">{productCount}개 제품</Badge>
      </div>

      <div className="flex items-center gap-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">별칭 필터</Label>
          <Tabs value={aliasFilter} onValueChange={(v) => onAliasFilterChange(v as AliasFilter)}>
            <TabsList>
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="with_alias">별칭 있음</TabsTrigger>
              <TabsTrigger value="without_alias">별칭 없음</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">상태 필터</Label>
          <Tabs value={activeFilter} onValueChange={(v) => onActiveFilterChange(v as ActiveFilter)}>
            <TabsList>
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="active">활성</TabsTrigger>
              <TabsTrigger value="inactive">비활성</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function MockProductListPanel({
  products,
  selectedProduct,
  onProductSelect,
  onToggleActive,
  isLoading,
  getDisplayName,
}: {
  products: MockHospitalProduct[];
  selectedProduct: MockHospitalProduct | null;
  onProductSelect: (product: MockHospitalProduct) => void;
  onToggleActive: (product: MockHospitalProduct, e: React.MouseEvent) => void;
  isLoading: boolean;
  getDisplayName: (product: MockHospitalProduct) => string;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">제품 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">제품 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-30 text-gray-400" />
            <p className="text-gray-500">조건에 맞는 제품이 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">제품 목록</CardTitle>
        <CardDescription>제품을 선택하여 설정을 변경하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {products.map((product) => (
            <div
              key={product.productId}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedProduct?.productId === product.productId
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-muted/50'
              } ${!product.isActive ? 'opacity-60' : ''}`}
              onClick={() => onProductSelect(product)}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{getDisplayName(product)}</span>
                    {product.alias && (
                      <Badge variant="outline" className="text-xs">
                        별칭
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {product.productName} · {product.modelName}
                  </p>
                </div>
                <Switch
                  checked={product.isActive}
                  onClick={(e) => onToggleActive(product, e)}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MockProductSettingsPanel({
  selectedProduct,
  alias,
  onAliasChange,
  aliasError,
  isActive,
  onActiveChange,
  isSaving,
  onSave,
  onDeleteAlias,
}: {
  selectedProduct: MockHospitalProduct | null;
  alias: string;
  onAliasChange: (value: string) => void;
  aliasError: string | null;
  isActive: boolean;
  onActiveChange: (value: boolean) => void;
  isSaving: boolean;
  onSave: () => void;
  onDeleteAlias: () => void;
}) {
  if (!selectedProduct) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            제품 설정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Settings className="h-12 w-12 mx-auto mb-3 opacity-30 text-gray-400" />
            <p className="text-gray-500">제품을 선택해주세요</p>
            <p className="text-gray-400 text-sm mt-1">
              왼쪽 목록에서 제품을 선택하면 설정을 변경할 수 있습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="h-5 w-5" />
          제품 설정
        </CardTitle>
        <CardDescription>
          {selectedProduct.productName} ({selectedProduct.modelName})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 별칭 설정 */}
        <div className="space-y-2">
          <Label htmlFor="alias">별칭</Label>
          <div className="flex gap-2">
            <Input
              id="alias"
              placeholder="제품 별칭 입력..."
              value={alias}
              onChange={(e) => onAliasChange(e.target.value)}
              className={aliasError ? 'border-red-500' : ''}
            />
            {selectedProduct.alias && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onDeleteAlias}
                disabled={isSaving}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          {aliasError && <p className="text-sm text-red-500">{aliasError}</p>}
          <p className="text-xs text-muted-foreground">
            별칭을 설정하면 시술 등록 시 이 이름으로 표시됩니다.
          </p>
        </div>

        {/* 활성화 설정 */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-0.5">
            <Label>활성화 상태</Label>
            <p className="text-xs text-muted-foreground">
              비활성화하면 시술 등록에서 숨겨집니다.
            </p>
          </div>
          <Switch checked={isActive} onCheckedChange={onActiveChange} />
        </div>

        {/* 저장 버튼 */}
        <Button
          className="w-full"
          onClick={onSave}
          disabled={isSaving || !!aliasError}
        >
          {isSaving ? (
            <>저장 중...</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              설정 저장
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function MockHospitalProductSettingsForm() {
  const [products, setProducts] = useState<MockHospitalProduct[]>(mockProducts);
  const [selectedProduct, setSelectedProduct] = useState<MockHospitalProduct | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [aliasFilter, setAliasFilter] = useState<AliasFilter>('all');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');

  const [alias, setAlias] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [aliasError, setAliasError] = useState<string | null>(null);

  // 필터링된 제품 목록
  const filteredProducts = products.filter((product) => {
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      const matches =
        product.productName.toLowerCase().includes(query) ||
        product.modelName.toLowerCase().includes(query) ||
        (product.alias?.toLowerCase().includes(query) ?? false);
      if (!matches) return false;
    }

    if (aliasFilter === 'with_alias' && !product.alias) return false;
    if (aliasFilter === 'without_alias' && product.alias) return false;

    if (activeFilter === 'active' && !product.isActive) return false;
    if (activeFilter === 'inactive' && product.isActive) return false;

    return true;
  });

  // 제품 선택 시 폼 초기화
  useEffect(() => {
    if (selectedProduct) {
      setAlias(selectedProduct.alias || '');
      setIsActive(selectedProduct.isActive);
      setAliasError(null);
    }
  }, [selectedProduct]);

  // 별칭 중복 체크
  useEffect(() => {
    if (!selectedProduct || !alias || alias === selectedProduct.alias) {
      setAliasError(null);
      return;
    }

    const exists = products.some(
      (p) => p.productId !== selectedProduct.productId && p.alias === alias
    );
    setAliasError(exists ? '이미 사용 중인 별칭입니다.' : null);
  }, [alias, selectedProduct, products]);

  const handleSave = async () => {
    if (!selectedProduct || aliasError) return;

    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    setProducts(products.map((p) =>
      p.productId === selectedProduct.productId
        ? { ...p, alias: alias || null, isActive }
        : p
    ));

    setSelectedProduct((prev) =>
      prev ? { ...prev, alias: alias || null, isActive } : null
    );

    toast.success('설정이 저장되었습니다.');
    setIsSaving(false);
  };

  const handleDeleteAlias = async () => {
    if (!selectedProduct) return;

    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    setProducts(products.map((p) =>
      p.productId === selectedProduct.productId ? { ...p, alias: null } : p
    ));

    setAlias('');
    setSelectedProduct((prev) => (prev ? { ...prev, alias: null } : null));

    toast.success('별칭이 삭제되었습니다.');
    setIsSaving(false);
  };

  const handleToggleActive = async (product: MockHospitalProduct, e: React.MouseEvent) => {
    e.stopPropagation();

    const newValue = !product.isActive;

    setProducts(products.map((p) =>
      p.productId === product.productId ? { ...p, isActive: newValue } : p
    ));

    if (selectedProduct?.productId === product.productId) {
      setSelectedProduct((prev) => (prev ? { ...prev, isActive: newValue } : null));
      setIsActive(newValue);
    }

    toast.success(newValue ? '제품이 활성화되었습니다.' : '제품이 비활성화되었습니다.');
  };

  const getDisplayName = (product: MockHospitalProduct) => {
    if (product.alias) return product.alias;
    return product.modelName
      ? `${product.productName} (${product.modelName})`
      : product.productName;
  };

  return (
    <div className="space-y-6">
      <MockSearchAndFilterSection
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        aliasFilter={aliasFilter}
        onAliasFilterChange={setAliasFilter}
        activeFilter={activeFilter}
        onActiveFilterChange={setActiveFilter}
        productCount={filteredProducts.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MockProductListPanel
          products={filteredProducts}
          selectedProduct={selectedProduct}
          onProductSelect={setSelectedProduct}
          onToggleActive={handleToggleActive}
          isLoading={isLoading}
          getDisplayName={getDisplayName}
        />

        <MockProductSettingsPanel
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

const meta = {
  title: 'Forms/Hospital/HospitalProductSettingsForm',
  component: MockHospitalProductSettingsForm,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
} satisfies Meta<typeof MockHospitalProductSettingsForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
