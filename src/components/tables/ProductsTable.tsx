'use client';

/**
 * 제품 목록 테이블 컴포넌트
 * 제품 조회, 수정, 비활성화 기능
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MoreHorizontal, Pencil, Archive, ArchiveRestore, Package, AlertTriangle, AlertOctagon } from 'lucide-react';
import { ProductForm } from '@/components/forms/ProductForm';
import { ProductDeactivateDialog } from '@/components/forms/ProductDeactivateDialog';
import {
  deactivateProductAction,
  activateProductAction,
} from '@/app/(dashboard)/manufacturer/actions';
import type { Product, ProductDeactivationReason } from '@/types/api.types';
import { DEACTIVATION_REASON_LABELS } from '@/types/api.types';

interface ProductsTableProps {
  /** 제품 목록 */
  products: Product[];
}

export function ProductsTable({ products }: ProductsTableProps): React.ReactElement {
  const router = useRouter();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deactivatingProduct, setDeactivatingProduct] = useState<Product | null>(null);

  // 비활성화 처리
  const handleDeactivate = async (
    productId: string,
    reason: ProductDeactivationReason,
    note?: string
  ): Promise<void> => {
    await deactivateProductAction(productId, reason, note);
    router.refresh();
  };

  // 활성화 처리
  const handleActivate = async (product: Product) => {
    await activateProductAction(product.id);
    router.refresh();
  };

  // 날짜 포맷
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 비활성화 사유 아이콘
  const getDeactivationIcon = (reason: string | null) => {
    switch (reason) {
      case 'SAFETY_ISSUE':
        return <AlertOctagon className="h-4 w-4 text-red-500" />;
      case 'QUALITY_ISSUE':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  // 상태 배지 렌더링
  const renderStatusBadge = (product: Product) => {
    if (product.is_active) {
      return <Badge variant="default">활성</Badge>;
    }

    // 마이그레이션 적용 후 타입이 생성됨
    const productAny = product as Record<string, unknown>;
    const reason = (productAny.deactivation_reason as ProductDeactivationReason) || null;
    const deactivationNote = productAny.deactivation_note as string | null;
    const icon = getDeactivationIcon(reason);
    const label = reason ? DEACTIVATION_REASON_LABELS[reason] : '비활성';

    if (reason && (reason === 'SAFETY_ISSUE' || reason === 'QUALITY_ISSUE')) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="destructive" className="gap-1">
                {icon}
                {label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              {deactivationNote || `${label}로 비활성화됨`}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <Badge variant="secondary">
        {label}
      </Badge>
    );
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">등록된 제품이 없습니다</h3>
        <p className="mt-2 text-sm text-gray-500">새 제품을 등록해주세요.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제품명</TableHead>
              <TableHead>UDI-DI</TableHead>
              <TableHead>모델명</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>등록일</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="font-mono text-sm">{product.udi_di}</TableCell>
                <TableCell>{product.model_name}</TableCell>
                <TableCell>
                  {renderStatusBadge(product)}
                </TableCell>
                <TableCell className="text-gray-500 text-sm">
                  {formatDate(product.created_at)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">메뉴 열기</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingProduct(product)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        수정
                      </DropdownMenuItem>
                      {product.is_active ? (
                        <DropdownMenuItem
                          onClick={() => setDeactivatingProduct(product)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          비활성화
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleActivate(product)}>
                          <ArchiveRestore className="mr-2 h-4 w-4" />
                          활성화
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 수정 다이얼로그 */}
      <ProductForm
        product={editingProduct || undefined}
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
        onSuccess={() => router.refresh()}
      />

      {/* 비활성화 다이얼로그 (사유 선택) */}
      <ProductDeactivateDialog
        product={deactivatingProduct}
        open={!!deactivatingProduct}
        onOpenChange={(open) => !open && setDeactivatingProduct(null)}
        onConfirm={handleDeactivate}
      />
    </>
  );
}
