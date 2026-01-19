/**
 * 제품 관리 View 컴포넌트
 * Manufacturer 제품 관리 페이지 뷰 (props 기반)
 */

import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Package, Plus, Edit, Trash2 } from 'lucide-react';

export interface ProductItem {
  id: string;
  name: string;
  modelName: string;
  udiDi?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ProductsViewProps {
  /** 제품 목록 */
  products: ProductItem[];
  /** 통계 */
  stats: {
    total: number;
    active: number;
  };
}

export function ProductsView({
  products,
  stats,
}: ProductsViewProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="제품 관리"
          description="제조사의 제품을 등록하고 관리합니다."
        />
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          제품 등록
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          title="전체 제품"
          value={stats.total}
          icon={Package}
        />
        <StatCard
          title="활성 제품"
          value={stats.active}
          icon={Package}
        />
      </div>

      {/* 제품 테이블 */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제품명</TableHead>
              <TableHead>모델명</TableHead>
              <TableHead>UDI-DI</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>등록일</TableHead>
              <TableHead className="w-[100px]">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{product.name}</span>
                  </div>
                </TableCell>
                <TableCell>{product.modelName}</TableCell>
                <TableCell className="font-mono text-sm">
                  {product.udiDi || '-'}
                </TableCell>
                <TableCell>
                  {product.isActive ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">활성</Badge>
                  ) : (
                    <Badge variant="secondary">비활성</Badge>
                  )}
                </TableCell>
                <TableCell>{product.createdAt}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" disabled>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" disabled>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  등록된 제품이 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
