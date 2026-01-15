'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Package, Calendar, AlertTriangle, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ProductCard } from '@/components/shared/ProductCard';
import { CartDisplay } from '@/components/shared/CartDisplay';
import { EmptyState } from '@/components/shared/EmptyState';
import { QuantityInputPanel } from '@/components/shared/QuantityInputPanel';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

/**
 * DisposalForm은 Server Actions와 Hooks에 의존합니다.
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

const DISPOSAL_REASON_OPTIONS = [
  { value: 'LOSS', label: '분실' },
  { value: 'EXPIRED', label: '유효기간 만료' },
  { value: 'DEFECTIVE', label: '불량/손상' },
  { value: 'OTHER', label: '기타' },
];

const mockProducts: MockProduct[] = [
  { productId: 'prod-001', productName: 'PDO Thread Type A', modelName: 'PDO-A-100', alias: '타입A', availableQuantity: 50 },
  { productId: 'prod-002', productName: 'PDO Thread Type B', modelName: 'PDO-B-200', availableQuantity: 30 },
  { productId: 'prod-003', productName: 'PDO Thread Premium', modelName: 'PDO-P-500', alias: '프리미엄', availableQuantity: 15 },
];

function MockDisposalForm() {
  const [selectedProduct, setSelectedProduct] = useState<MockProduct | null>(null);
  const [quantity, setQuantity] = useState<string>('1');
  const [disposalDate, setDisposalDate] = useState(
    new Date().toISOString().split('T')[0] ?? ''
  );
  const [disposalReasonType, setDisposalReasonType] = useState<string>('');
  const [disposalReasonCustom, setDisposalReasonCustom] = useState<string>('');
  const [items, setItems] = useState<MockCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

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

  const handleConfirmClick = () => {
    if (!disposalDate || !disposalReasonType || items.length === 0) {
      toast.error('모든 필드를 입력해주세요.');
      return;
    }
    if (disposalReasonType === 'OTHER' && !disposalReasonCustom.trim()) {
      toast.error('기타 사유를 입력해주세요.');
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleSubmit = async () => {
    setIsConfirmOpen(false);
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success(`${items.reduce((sum, i) => sum + i.quantity, 0)}개 제품이 폐기 처리되었습니다.`);
    setItems([]);
    setDisposalReasonType('');
    setDisposalReasonCustom('');
    setSelectedProduct(null);
    setIsLoading(false);
  };

  const currentAvailableQty = selectedProduct
    ? getAvailableQuantity(selectedProduct)
    : 0;

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* 폐기 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              폐기 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="disposalDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  폐기일
                </Label>
                <Input
                  id="disposalDate"
                  type="date"
                  value={disposalDate}
                  onChange={(e) => setDisposalDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="disposalReason">폐기 사유</Label>
                <Select
                  value={disposalReasonType}
                  onValueChange={setDisposalReasonType}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="사유를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISPOSAL_REASON_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {disposalReasonType === 'OTHER' && (
              <div className="space-y-2">
                <Label htmlFor="disposalReasonCustom">상세 사유</Label>
                <Textarea
                  id="disposalReasonCustom"
                  placeholder="폐기 사유를 상세히 입력해주세요"
                  value={disposalReasonCustom}
                  onChange={(e) => setDisposalReasonCustom(e.target.value)}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {disposalReasonCustom.length}/500자
                </p>
              </div>
            )}
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
          onConfirm={handleConfirmClick}
          confirmText="폐기 등록"
          confirmDisabled={items.length === 0 || !disposalReasonType || !disposalDate}
          isLoading={isLoading}
          title="폐기 장바구니"
        />

        {/* 경고 안내 */}
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">폐기 주의사항</span>
          </div>
          <p className="mt-2 text-xs text-amber-600">
            폐기 등록 후에는 <strong>취소가 불가능</strong>합니다.
            폐기 수량과 사유를 정확히 확인 후 등록해주세요.
          </p>
        </div>

        {/* 확인 다이얼로그 */}
        <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                폐기 등록 확인
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p>아래 내용으로 폐기를 등록하시겠습니까?</p>
                  <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                    <p><strong>폐기일:</strong> {disposalDate}</p>
                    <p><strong>사유:</strong> {
                      DISPOSAL_REASON_OPTIONS.find(o => o.value === disposalReasonType)?.label || ''
                    }</p>
                    {disposalReasonType === 'OTHER' && disposalReasonCustom && (
                      <p><strong>상세:</strong> {disposalReasonCustom}</p>
                    )}
                    <p><strong>총 수량:</strong> {totalItems}개</p>
                  </div>
                  <p className="text-destructive font-medium">
                    폐기 등록 후에는 취소가 불가능합니다.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSubmit}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                폐기 등록
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function MockDisposalFormEmpty() {
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
              title="폐기 가능한 제품이 없습니다"
              description="재고가 있는 제품이 없습니다."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const meta = {
  title: 'Forms/Hospital/DisposalForm',
  component: MockDisposalForm,
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
} satisfies Meta<typeof MockDisposalForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  render: () => <MockDisposalFormEmpty />,
};
