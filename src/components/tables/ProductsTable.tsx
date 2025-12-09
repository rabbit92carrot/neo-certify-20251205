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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Pencil, Archive, ArchiveRestore, Package } from 'lucide-react';
import { ProductForm } from '@/components/forms/ProductForm';
import {
  deactivateProductAction,
  activateProductAction,
} from '@/app/(dashboard)/manufacturer/actions';
import type { Product } from '@/types/api.types';

interface ProductsTableProps {
  /** 제품 목록 */
  products: Product[];
}

export function ProductsTable({ products }: ProductsTableProps): React.ReactElement {
  const router = useRouter();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deactivatingProduct, setDeactivatingProduct] = useState<Product | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // 비활성화 처리
  const handleDeactivate = async (): Promise<void> => {
    if (!deactivatingProduct) {
      return;
    }

    setIsDeactivating(true);
    try {
      await deactivateProductAction(deactivatingProduct.id);
      router.refresh();
    } finally {
      setIsDeactivating(false);
      setDeactivatingProduct(null);
    }
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
                  <Badge variant={product.is_active ? 'default' : 'secondary'}>
                    {product.is_active ? '활성' : '비활성'}
                  </Badge>
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

      {/* 비활성화 확인 다이얼로그 */}
      <AlertDialog
        open={!!deactivatingProduct}
        onOpenChange={(open: boolean) => !open && setDeactivatingProduct(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>제품 비활성화</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold">{deactivatingProduct?.name}</span> 제품을
              비활성화하시겠습니까?
              <br />
              <br />
              비활성화된 제품은 생산 등록 목록에서 표시되지 않습니다.
              <br />
              기존 이력은 유지되며, 필요 시 다시 활성화할 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeactivating}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={isDeactivating}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeactivating ? '처리 중...' : '비활성화'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
