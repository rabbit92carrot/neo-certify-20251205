/**
 * 출고 View 컴포넌트
 * 제조사/유통사 공통 출고 페이지 뷰 (props 기반)
 */

import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Package, Building2, Search } from 'lucide-react';
import type { OrganizationType } from '@/types/api.types';

export interface ShipmentProduct {
  id: string;
  name: string;
  modelName: string;
  availableQuantity: number;
}

export interface ShipmentViewProps {
  /** 조직 유형 */
  organizationType: OrganizationType;
  /** 출고 가능한 제품 목록 */
  products: ShipmentProduct[];
  /** 제조사는 Lot 선택 가능 */
  canSelectLot?: boolean;
}

export function ShipmentView({
  organizationType,
  products,
  canSelectLot = false,
}: ShipmentViewProps): React.ReactElement {
  const isManufacturer = organizationType === 'MANUFACTURER';
  const description = isManufacturer
    ? '유통사 또는 병원으로 제품을 출고합니다. FIFO 방식으로 자동 출고되며, 특정 Lot을 선택할 수도 있습니다.'
    : '병원으로 제품을 출고합니다. FIFO 방식으로 가장 오래된 재고부터 자동 출고됩니다.';

  return (
    <div className="space-y-6">
      <PageHeader title="출고" description={description} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측: 제품 선택 영역 */}
        <div className="lg:col-span-2 space-y-4">
          {/* 수신 조직 검색 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                수신 조직
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 p-3 border rounded-md bg-gray-50">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  조직명으로 검색...
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 제품 목록 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                제품 선택
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.modelName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">
                      재고: {product.availableQuantity}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-8 px-2 border rounded text-center text-sm flex items-center justify-center bg-white">
                        0
                      </div>
                      <Button size="sm" variant="outline">
                        추가
                      </Button>
                      {canSelectLot && (
                        <Button size="sm" variant="ghost" className="text-xs">
                          Lot 선택
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  출고 가능한 제품이 없습니다.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 우측: 카트 영역 */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                출고 목록
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground text-sm">
                제품을 선택해주세요
              </div>
              <Button className="w-full mt-4" disabled>
                출고하기
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
