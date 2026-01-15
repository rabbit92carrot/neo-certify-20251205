'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Package, Send, Hospital, Building2 } from 'lucide-react';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductCard } from '@/components/shared/ProductCard';
import { CartDisplay } from '@/components/shared/CartDisplay';
import { EmptyState } from '@/components/shared/EmptyState';
import { QuantityInputPanel } from '@/components/shared/QuantityInputPanel';
import { SearchableCombobox, type SearchableComboboxOption } from '@/components/ui/searchable-combobox';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

/**
 * ShipmentForm은 Server Actions와 Hooks에 의존합니다.
 * Storybook에서는 Mock 컴포넌트로 UI를 시뮬레이션합니다.
 */

interface MockProduct {
  productId: string;
  productName: string;
  modelName: string;
  availableQuantity: number;
  lots?: { lotId: string; lotNumber: string; quantity: number; expiryDate: string }[];
}

interface MockCartItem {
  productId: string;
  productName: string;
  quantity: number;
  lotId?: string;
  lotNumber?: string;
}

const mockProducts: MockProduct[] = [
  {
    productId: 'prod-001',
    productName: 'PDO Thread Type A',
    modelName: 'PDO-A-100',
    availableQuantity: 100,
    lots: [
      { lotId: 'lot-001', lotNumber: 'ND00001241201', quantity: 50, expiryDate: '2026-12-01' },
      { lotId: 'lot-002', lotNumber: 'ND00001241215', quantity: 50, expiryDate: '2026-12-15' },
    ],
  },
  {
    productId: 'prod-002',
    productName: 'PDO Thread Type B',
    modelName: 'PDO-B-200',
    availableQuantity: 60,
    lots: [
      { lotId: 'lot-003', lotNumber: 'ND00002241201', quantity: 60, expiryDate: '2026-12-01' },
    ],
  },
  {
    productId: 'prod-003',
    productName: 'PDO Thread Premium',
    modelName: 'PDO-P-500',
    availableQuantity: 30,
    lots: [
      { lotId: 'lot-004', lotNumber: 'ND00003241201', quantity: 30, expiryDate: '2026-12-01' },
    ],
  },
];

const mockOrganizations: SearchableComboboxOption[] = [
  { value: 'org-001', label: '강남메디컬센터', icon: <Hospital className="h-4 w-4" />, description: '병원' },
  { value: 'org-002', label: '서울피부과의원', icon: <Hospital className="h-4 w-4" />, description: '병원' },
  { value: 'org-003', label: '메디컬유통', icon: <Building2 className="h-4 w-4" />, description: '유통사' },
  { value: 'org-004', label: '부산의료유통', icon: <Building2 className="h-4 w-4" />, description: '유통사' },
];

function MockShipmentForm({ canSelectLot = false }: { canSelectLot?: boolean }) {
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<MockProduct | null>(null);
  const [selectedLotId, setSelectedLotId] = useState<string>('auto');
  const [quantity, setQuantity] = useState<string>('1');
  const [items, setItems] = useState<MockCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getAvailableQuantity = (product: MockProduct, lotId?: string): number => {
    const cartQuantity = items
      .filter((item) => {
        if (lotId && lotId !== 'auto') {
          return item.productId === product.productId && item.lotId === lotId;
        }
        return item.productId === product.productId && !item.lotId;
      })
      .reduce((sum, item) => sum + item.quantity, 0);

    if (lotId && lotId !== 'auto' && product.lots) {
      const lot = product.lots.find((l) => l.lotId === lotId);
      return (lot?.quantity ?? 0) - cartQuantity;
    }

    const totalCartQuantity = items
      .filter((item) => item.productId === product.productId)
      .reduce((sum, item) => sum + item.quantity, 0);

    return product.availableQuantity - totalCartQuantity;
  };

  const handleSearchOrganizations = async (query: string): Promise<SearchableComboboxOption[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockOrganizations.filter((org) =>
      org.label.toLowerCase().includes(query.toLowerCase())
    );
  };

  const handleAddToCart = () => {
    if (!selectedProduct) {
      toast.error('제품을 선택해주세요.');
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      toast.error('올바른 수량을 입력해주세요.');
      return;
    }

    const availableQty = getAvailableQuantity(selectedProduct, selectedLotId === 'auto' ? undefined : selectedLotId);
    if (qty > availableQty) {
      toast.error(`재고가 부족합니다. 현재 재고: ${availableQty}개`);
      return;
    }

    let lotNumber: string | undefined;
    if (selectedLotId !== 'auto' && selectedProduct.lots) {
      const lot = selectedProduct.lots.find((l) => l.lotId === selectedLotId);
      lotNumber = lot?.lotNumber;
    }

    setItems([...items, {
      productId: selectedProduct.productId,
      productName: selectedProduct.productName,
      quantity: qty,
      lotId: selectedLotId === 'auto' ? undefined : selectedLotId,
      lotNumber,
    }]);

    toast.success('장바구니에 추가되었습니다.');
    setQuantity('1');
    setSelectedLotId('auto');
  };

  const handleUpdateQuantity = (productId: string, qty: number, lotId?: string) => {
    setItems(items.map(item =>
      item.productId === productId && item.lotId === lotId ? { ...item, quantity: qty } : item
    ));
  };

  const handleRemove = (productId: string, lotId?: string) => {
    setItems(items.filter(item => !(item.productId === productId && item.lotId === lotId)));
  };

  const handleSubmit = async () => {
    if (!selectedOrganizationId) {
      toast.error('출고 대상을 선택해주세요.');
      return;
    }

    if (items.length === 0) {
      toast.error('장바구니가 비어있습니다.');
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    toast.success(`${totalItems}개 제품이 출고되었습니다.`);
    setItems([]);
    setSelectedOrganizationId('');
    setSelectedProduct(null);
    setIsLoading(false);
  };

  const lotOptions: ComboboxOption[] = selectedProduct?.lots
    ? [
        { value: 'auto', label: '자동 선택 (FIFO)' },
        ...selectedProduct.lots.map((lot) => ({
          value: lot.lotId,
          label: `${lot.lotNumber} (재고: ${getAvailableQuantity(selectedProduct, lot.lotId)}개)`,
          description: `유효기한: ${lot.expiryDate}`,
        })),
      ]
    : [];

  const currentAvailableQty = selectedProduct
    ? getAvailableQuantity(selectedProduct, selectedLotId === 'auto' ? undefined : selectedLotId)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* 출고 대상 선택 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">출고 대상</CardTitle>
          </CardHeader>
          <CardContent>
            <SearchableCombobox
              value={selectedOrganizationId}
              onValueChange={setSelectedOrganizationId}
              onSearch={handleSearchOrganizations}
              placeholder="출고 대상을 검색하세요"
              searchPlaceholder="조직명 검색 (2자 이상)..."
              emptyMessage="검색 결과가 없습니다."
              minCharsMessage="2글자 이상 입력하세요."
              debounceMs={300}
              minSearchLength={2}
            />
          </CardContent>
        </Card>

        {/* 제품 선택 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">제품 선택</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {mockProducts.map((product) => {
                const availableQty = getAvailableQuantity(product);
                return (
                  <ProductCard
                    key={product.productId}
                    name={product.productName}
                    modelName={product.modelName}
                    additionalInfo={`재고: ${availableQty}개`}
                    isSelected={selectedProduct?.productId === product.productId}
                    onClick={() => {
                      setSelectedProduct(product);
                      setSelectedLotId('auto');
                    }}
                    disabled={availableQty === 0}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 오른쪽: 수량 입력 + 장바구니 */}
      <div className="lg:col-span-1 space-y-4">
        <QuantityInputPanel
          selectedProduct={selectedProduct ? {
            productId: selectedProduct.productId,
            displayName: selectedProduct.productName,
          } : null}
          availableQuantity={currentAvailableQty}
          quantity={quantity}
          onQuantityChange={setQuantity}
          onAddToCart={handleAddToCart}
          lotSelector={
            canSelectLot && selectedProduct?.lots && selectedProduct.lots.length > 0 ? (
              <div className="space-y-2">
                <Label>Lot 선택 (선택사항)</Label>
                <Combobox
                  options={lotOptions}
                  value={selectedLotId}
                  onValueChange={setSelectedLotId}
                  placeholder="자동 선택 (FIFO)"
                  searchPlaceholder="Lot 번호 검색..."
                  emptyMessage="검색 결과가 없습니다."
                />
                <p className="text-xs text-muted-foreground">
                  Lot을 선택하지 않으면 FIFO 방식으로 자동 출고됩니다.
                </p>
              </div>
            ) : undefined
          }
        />

        <CartDisplay
          items={items.map(item => ({
            productId: item.productId,
            productName: item.lotNumber ? `${item.productName} (${item.lotNumber})` : item.productName,
            quantity: item.quantity,
            lotId: item.lotId,
          }))}
          onUpdateQuantity={handleUpdateQuantity}
          onRemove={handleRemove}
          onClear={() => setItems([])}
          onConfirm={handleSubmit}
          confirmText="출고하기"
          confirmDisabled={!selectedOrganizationId || items.length === 0}
          isLoading={isLoading}
          title="출고 장바구니"
        />

        {items.length > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <Send className="h-4 w-4" />
              <span className="text-sm font-medium">출고 안내</span>
            </div>
            <p className="mt-2 text-xs text-blue-600">
              출고 확인 시 즉시 소유권이 이전됩니다.
              오류 시 24시간 이내에 회수할 수 있습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function MockShipmentFormEmpty() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">제품 선택</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Package}
              title="출고 가능한 제품이 없습니다"
              description="재고가 있는 제품이 없습니다."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const meta = {
  title: 'Forms/Shipment/ShipmentForm',
  component: MockShipmentForm,
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
} satisfies Meta<typeof MockShipmentForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLotSelection: Story = {
  args: {
    canSelectLot: true,
  },
};

export const Empty: Story = {
  render: () => <MockShipmentFormEmpty />,
};
