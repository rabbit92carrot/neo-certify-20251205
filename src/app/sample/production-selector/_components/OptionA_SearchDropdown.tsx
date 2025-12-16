'use client';

/**
 * 옵션 A: 검색 + 2단계 드롭다운
 * 검색 가능한 Combobox로 제품명 선택 → 모델명 선택
 */

import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ProductionForm } from './ProductionForm';
import {
  MOCK_PRODUCTS,
  getUniqueProductNames,
  getModelsByProductName,
  type MockProduct,
} from '../_data/mock-products';

export function OptionA_SearchDropdown(): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductName, setSelectedProductName] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<MockProduct | null>(null);
  const [productNameOpen, setProductNameOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);

  const productNames = useMemo(() => getUniqueProductNames(MOCK_PRODUCTS), []);
  const models = useMemo(
    () => (selectedProductName ? getModelsByProductName(MOCK_PRODUCTS, selectedProductName) : []),
    [selectedProductName]
  );

  // 검색어로 필터링된 결과
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return MOCK_PRODUCTS;
    }
    const query = searchQuery.toLowerCase();
    return MOCK_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.model_name.toLowerCase().includes(query) ||
        p.udi_di.includes(query)
    );
  }, [searchQuery]);

  // 검색 결과에서 직접 선택
  const handleSearchSelect = (product: MockProduct) => {
    setSelectedProductName(product.name);
    setSelectedProduct(product);
    setSearchQuery('');
  };

  // 제품명 선택
  const handleProductNameSelect = (name: string) => {
    setSelectedProductName(name);
    setSelectedProduct(null); // 모델 선택 초기화
    setProductNameOpen(false);
    setModelOpen(true); // 모델 선택 팝오버 자동 열기
  };

  // 모델 선택
  const handleModelSelect = (product: MockProduct) => {
    setSelectedProduct(product);
    setModelOpen(false);
  };

  const handleClearSelection = () => {
    setSelectedProductName(null);
    setSelectedProduct(null);
  };

  return (
    <div className="space-y-6">
      {/* 제품 선택 영역 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">제품 선택</CardTitle>
          <CardDescription>생산할 제품을 선택하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 검색 입력 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="제품명 또는 모델명 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 검색 결과 표시 */}
          {searchQuery.trim() && (
            <div className="border rounded-md max-h-48 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  검색 결과가 없습니다
                </div>
              ) : (
                <div className="p-1">
                  {filteredProducts.slice(0, 10).map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleSearchSelect(product)}
                      className="w-full text-left p-2 rounded hover:bg-accent text-sm"
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-muted-foreground text-xs">
                        {product.model_name} · UDI: {product.udi_di}
                      </div>
                    </button>
                  ))}
                  {filteredProducts.length > 10 && (
                    <div className="p-2 text-xs text-muted-foreground text-center">
                      외 {filteredProducts.length - 10}개 더 있음
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2단계 드롭다운 */}
          {!searchQuery.trim() && (
            <div className="flex flex-col sm:flex-row gap-3">
              {/* 제품명 선택 */}
              <Popover open={productNameOpen} onOpenChange={setProductNameOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={productNameOpen}
                    className="flex-1 justify-between"
                  >
                    {selectedProductName || '제품명 선택'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0">
                  <Command>
                    <CommandInput placeholder="제품명 검색..." />
                    <CommandList>
                      <CommandEmpty>제품을 찾을 수 없습니다.</CommandEmpty>
                      <CommandGroup>
                        {productNames.map((name) => (
                          <CommandItem
                            key={name}
                            value={name}
                            onSelect={() => handleProductNameSelect(name)}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedProductName === name ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {name}
                            <span className="ml-auto text-xs text-muted-foreground">
                              ({getModelsByProductName(MOCK_PRODUCTS, name).length}개)
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* 모델명 선택 */}
              <Popover open={modelOpen} onOpenChange={setModelOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={modelOpen}
                    className="flex-1 justify-between"
                    disabled={!selectedProductName}
                  >
                    {selectedProduct?.model_name || '모델명 선택'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0">
                  <Command>
                    <CommandInput placeholder="모델명 검색..." />
                    <CommandList>
                      <CommandEmpty>모델을 찾을 수 없습니다.</CommandEmpty>
                      <CommandGroup>
                        {models.map((model) => (
                          <CommandItem
                            key={model.id}
                            value={model.model_name}
                            onSelect={() => handleModelSelect(model)}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedProduct?.id === model.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <div className="flex-1">
                              <div>{model.model_name}</div>
                              <div className="text-xs text-muted-foreground">
                                UDI: {model.udi_di}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 생산 정보 폼 */}
      <ProductionForm
        selectedProduct={selectedProduct}
        onClearSelection={handleClearSelection}
      />
    </div>
  );
}
