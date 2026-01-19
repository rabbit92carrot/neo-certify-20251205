/**
 * 시술 등록 View 컴포넌트
 * 병원 시술 페이지 뷰 (props 기반)
 */

import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Package, User, Phone, Search } from 'lucide-react';

export interface TreatmentProduct {
  id: string;
  name: string;
  modelName: string;
  alias?: string;
  availableQuantity: number;
}

export interface TreatmentViewProps {
  /** 시술 가능한 제품 목록 */
  products: TreatmentProduct[];
}

export function TreatmentView({
  products,
}: TreatmentViewProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <PageHeader
        title="시술 등록"
        description="환자에게 시술한 제품을 등록합니다. 시술 등록 시 환자에게 정품 인증 알림이 발송됩니다."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측: 환자 정보 및 제품 선택 */}
        <div className="lg:col-span-2 space-y-4">
          {/* 환자 정보 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                환자 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">환자명</label>
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-gray-50">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      환자명 검색 또는 입력...
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">연락처</label>
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-gray-50">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      010-0000-0000
                    </span>
                  </div>
                </div>
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
                    <p className="font-medium text-sm truncate">
                      {product.alias || product.name}
                    </p>
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
                    </div>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  시술 가능한 제품이 없습니다.
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
                시술 목록
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground text-sm">
                제품을 선택해주세요
              </div>
              <Button className="w-full mt-4" disabled>
                시술 등록
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
