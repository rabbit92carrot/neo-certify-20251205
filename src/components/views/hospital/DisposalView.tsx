/**
 * 폐기 등록 View 컴포넌트
 * 병원 폐기 페이지 뷰 (props 기반)
 */

import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Package, AlertTriangle } from 'lucide-react';

export interface DisposalProduct {
  id: string;
  name: string;
  modelName: string;
  alias?: string;
  availableQuantity: number;
}

export interface DisposalViewProps {
  /** 폐기 가능한 제품 목록 */
  products: DisposalProduct[];
}

export function DisposalView({
  products,
}: DisposalViewProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <PageHeader
        title="폐기 등록"
        description="손실, 만료, 불량 등의 이유로 제품을 폐기합니다. 폐기 등록 후에는 취소가 불가능합니다."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측: 폐기 사유 및 제품 선택 */}
        <div className="lg:col-span-2 space-y-4">
          {/* 폐기 사유 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                폐기 사유
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 border rounded-lg text-center cursor-pointer hover:bg-gray-50">
                  손실
                </div>
                <div className="p-3 border rounded-lg text-center cursor-pointer hover:bg-gray-50">
                  만료
                </div>
                <div className="p-3 border rounded-lg text-center cursor-pointer hover:bg-gray-50">
                  불량
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
                  폐기 가능한 제품이 없습니다.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 우측: 폐기 목록 */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                폐기 목록
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground text-sm">
                제품을 선택해주세요
              </div>
              <Button className="w-full mt-4" variant="destructive" disabled>
                폐기 등록
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
