'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Phone, Calendar, Package, Stethoscope } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductCard } from '@/components/shared/ProductCard';
import { CartDisplay } from '@/components/shared/CartDisplay';
import { EmptyState } from '@/components/shared/EmptyState';
import { QuantityInputPanel } from '@/components/shared/QuantityInputPanel';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

/**
 * TreatmentForm은 Server Actions와 Hooks에 의존합니다.
 * Storybook에서는 Mock 컴포넌트로 UI를 시뮬레이션합니다.
 */

interface MockProduct {
  productId: string;
  productName: string;
  modelName: string;
  alias?: string;
  availableQuantity: number;
}

interface MockCartItem {
  productId: string;
  productName: string;
  quantity: number;
}

const mockProducts: MockProduct[] = [
  { productId: 'prod-001', productName: 'PDO Thread Type A', modelName: 'PDO-A-100', alias: '타입A', availableQuantity: 50 },
  { productId: 'prod-002', productName: 'PDO Thread Type B', modelName: 'PDO-B-200', availableQuantity: 30 },
  { productId: 'prod-003', productName: 'PDO Thread Premium', modelName: 'PDO-P-500', alias: '프리미엄', availableQuantity: 15 },
];

function MockTreatmentForm() {
  const [selectedProduct, setSelectedProduct] = useState<MockProduct | null>(null);
  const [quantity, setQuantity] = useState<string>('1');
  const [patientPhone, setPatientPhone] = useState('');
  const [treatmentDate, setTreatmentDate] = useState(
    new Date().toISOString().split('T')[0] ?? ''
  );
  const [items, setItems] = useState<MockCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getAvailableQuantity = (product: MockProduct): number => {
    const cartQuantity = items
      .filter((item) => item.productId === product.productId)
      .reduce((sum, item) => sum + item.quantity, 0);
    return product.availableQuantity - cartQuantity;
  };

  const getDisplayName = (product: MockProduct): string => {
    return product.alias || product.productName;
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

    const availableQty = getAvailableQuantity(selectedProduct);
    if (qty > availableQty) {
      toast.error(`재고가 부족합니다. 현재 재고: ${availableQty}개`);
      return;
    }

    setItems([...items, {
      productId: selectedProduct.productId,
      productName: getDisplayName(selectedProduct),
      quantity: qty,
    }]);

    toast.success('장바구니에 추가되었습니다.');
    setQuantity('1');
  };

  const handleUpdateQuantity = (productId: string, qty: number) => {
    setItems(items.map(item =>
      item.productId === productId ? { ...item, quantity: qty } : item
    ));
  };

  const handleRemove = (productId: string) => {
    setItems(items.filter(item => item.productId !== productId));
  };

  const handleSubmit = async () => {
    if (!patientPhone || !treatmentDate || items.length === 0) {
      toast.error('모든 필드를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success(`${items.reduce((sum, i) => sum + i.quantity, 0)}개 제품 시술이 등록되었습니다.`);
    setItems([]);
    setPatientPhone('');
    setSelectedProduct(null);
    setIsLoading(false);
  };

  const currentAvailableQty = selectedProduct
    ? getAvailableQuantity(selectedProduct)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* 환자 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5" />
              환자 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientPhone">전화번호</Label>
                <Input
                  id="patientPhone"
                  type="tel"
                  placeholder="010-0000-0000"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="treatmentDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  시술일
                </Label>
                <Input
                  id="treatmentDate"
                  type="date"
                  value={treatmentDate}
                  onChange={(e) => setTreatmentDate(e.target.value)}
                />
              </div>
            </div>
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
                const displayName = getDisplayName(product);
                return (
                  <ProductCard
                    key={product.productId}
                    name={displayName}
                    modelName={product.modelName}
                    additionalInfo={`재고: ${availableQty}개`}
                    isSelected={selectedProduct?.productId === product.productId}
                    onClick={() => setSelectedProduct(product)}
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
            displayName: getDisplayName(selectedProduct),
          } : null}
          availableQuantity={currentAvailableQty}
          quantity={quantity}
          onQuantityChange={setQuantity}
          onAddToCart={handleAddToCart}
        />

        <CartDisplay
          items={items}
          onUpdateQuantity={handleUpdateQuantity}
          onRemove={handleRemove}
          onClear={() => setItems([])}
          onConfirm={handleSubmit}
          confirmText="시술 등록"
          confirmDisabled={items.length === 0 || !patientPhone || !treatmentDate}
          isLoading={isLoading}
          title="시술 장바구니"
        />

        {items.length > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <Stethoscope className="h-4 w-4" />
              <span className="text-sm font-medium">시술 안내</span>
            </div>
            <p className="mt-2 text-xs text-blue-600">
              시술 등록 시 환자에게 정품 인증 알림이 발송됩니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function MockTreatmentFormEmpty() {
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
              title="시술 가능한 제품이 없습니다"
              description="재고가 있는 제품이 없습니다."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const meta = {
  title: 'Forms/Hospital/TreatmentForm',
  component: MockTreatmentForm,
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
} satisfies Meta<typeof MockTreatmentForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  render: () => <MockTreatmentFormEmpty />,
};
