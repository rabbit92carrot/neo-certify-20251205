'use client';

/**
 * 공통 생산 정보 폼 컴포넌트
 * 4가지 옵션에서 공통으로 사용되는 생산 정보 입력 폼
 */

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Check, Package } from 'lucide-react';
import type { MockProduct } from '../_data/mock-products';

interface ProductionFormProps {
  /** 선택된 제품 (null이면 미선택 상태) */
  selectedProduct: MockProduct | null;
  /** 선택 초기화 콜백 */
  onClearSelection?: () => void;
  /** 카드 형태로 감쌀지 여부 (기본값: true) */
  asCard?: boolean;
  /** sticky 포지션 적용 여부 (기본값: false) */
  sticky?: boolean;
}

export function ProductionForm({
  selectedProduct,
  onClearSelection,
  asCard = true,
  sticky = false,
}: ProductionFormProps): React.ReactElement {
  const EXPIRY_MONTHS = 24;
  const today = new Date().toISOString().split('T')[0] ?? '';
  const [quantity, setQuantity] = useState('');
  const [manufactureDate, setManufactureDate] = useState(today);
  const [submitted, setSubmitted] = useState(false);
  // 기본 사용기한 계산 (생산일자 + N개월 - 1일)
  const calculateDefaultExpiryDate = (baseDate: string): string => {
    if (!baseDate) {
      return '';
    }
    const date = new Date(baseDate);
    date.setMonth(date.getMonth() + EXPIRY_MONTHS);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0] ?? '';
  };

  // 사용기한 상태 (자동 계산 또는 수동 입력)
  const defaultExpiryDate = useMemo(() => calculateDefaultExpiryDate(today), [today]);
  const [expiryDate, setExpiryDate] = useState(defaultExpiryDate);

  // 생산일자 변경 시 사용기한 자동 계산 (항상 덮어씌움)
  useEffect(() => {
    if (manufactureDate) {
      const newExpiry = calculateDefaultExpiryDate(manufactureDate);
      setExpiryDate(newExpiry);
    }
  }, [manufactureDate]);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!selectedProduct || !quantity || !manufactureDate) {
      return;
    }

    // 샘플이므로 실제 제출 대신 성공 메시지만 표시
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setQuantity('');
      setManufactureDate(today);
      setExpiryDate(defaultExpiryDate);
      onClearSelection?.();
    }, 2000);
  };

  const content = (
    <div className="space-y-4">
      {/* 선택된 제품 표시 */}
      {selectedProduct ? (
        <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
          <div className="flex items-start gap-3">
            <div className="rounded-full p-2 bg-primary text-primary-foreground shrink-0">
              <Check className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{selectedProduct.name}</p>
              <p className="text-sm text-muted-foreground">{selectedProduct.model_name}</p>
              <p className="text-xs text-muted-foreground mt-1">UDI: {selectedProduct.udi_di}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-lg border border-dashed border-gray-300 bg-gray-50">
          <div className="flex items-center gap-3 text-gray-500">
            <Package className="h-5 w-5" />
            <span className="text-sm">제품을 선택해주세요</span>
          </div>
        </div>
      )}

      {/* 성공 메시지 */}
      {submitted && (
        <div className="p-3 rounded-md bg-green-50 border border-green-200">
          <p className="text-green-800 text-sm font-medium">생산 등록이 완료되었습니다! (샘플)</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">수량 *</Label>
          <Input
            id="quantity"
            type="number"
            min={1}
            max={100000}
            placeholder="생산 수량 (1 ~ 100,000)"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={!selectedProduct}
          />
          <p className="text-xs text-muted-foreground">
            최대 100,000개까지 입력 가능합니다.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="manufactureDate">생산일자 *</Label>
          <Input
            id="manufactureDate"
            type="date"
            value={manufactureDate}
            onChange={(e) => setManufactureDate(e.target.value)}
            disabled={!selectedProduct}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiryDate">사용기한 *</Label>
          <Input
            id="expiryDate"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            disabled={!selectedProduct}
          />
          <p className="text-xs text-muted-foreground">
            기본값: 생산일자 + 24개월 (수동 수정 가능)
          </p>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={!selectedProduct || !quantity || !manufactureDate || submitted}
        >
          {submitted ? '등록 완료!' : '생산 등록'}
        </Button>
      </form>
    </div>
  );

  if (!asCard) {
    return <div className={sticky ? 'lg:sticky lg:top-4' : ''}>{content}</div>;
  }

  return (
    <Card className={sticky ? 'lg:sticky lg:top-4' : ''}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">생산 정보</CardTitle>
        <CardDescription>생산 수량 및 일자를 입력하세요</CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
