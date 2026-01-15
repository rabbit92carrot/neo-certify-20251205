'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
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
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

/**
 * ProductsTable은 Server Actions와 Router에 의존합니다.
 * Storybook에서는 Mock 컴포넌트로 UI를 시뮬레이션합니다.
 */

interface MockProduct {
  id: string;
  name: string;
  udi_di: string;
  model_name: string;
  is_active: boolean;
  created_at: string;
  deactivation_reason?: string | null;
  deactivation_note?: string | null;
}

const DEACTIVATION_REASON_LABELS: Record<string, string> = {
  SAFETY_ISSUE: '안전 문제',
  QUALITY_ISSUE: '품질 문제',
  DISCONTINUED: '생산 중단',
  OTHER: '기타',
};

const mockProducts: MockProduct[] = [
  {
    id: 'prod-001',
    name: 'PDO Thread Type A',
    udi_di: '00123456789012A',
    model_name: 'PDO-A-100',
    is_active: true,
    created_at: '2024-01-15T09:00:00Z',
  },
  {
    id: 'prod-002',
    name: 'PDO Thread Type B',
    udi_di: '00123456789012B',
    model_name: 'PDO-B-200',
    is_active: true,
    created_at: '2024-02-20T10:00:00Z',
  },
  {
    id: 'prod-003',
    name: 'PDO Thread Premium',
    udi_di: '00123456789012C',
    model_name: 'PDO-P-500',
    is_active: false,
    created_at: '2024-03-10T11:00:00Z',
    deactivation_reason: 'SAFETY_ISSUE',
    deactivation_note: '안전 테스트 미통과',
  },
  {
    id: 'prod-004',
    name: 'PDO Thread Economy',
    udi_di: '00123456789012D',
    model_name: 'PDO-E-100',
    is_active: false,
    created_at: '2024-04-05T12:00:00Z',
    deactivation_reason: 'DISCONTINUED',
  },
];

function MockProductsTable({ products = mockProducts }: { products?: MockProduct[] }) {
  const [productList, setProductList] = useState(products);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getDeactivationIcon = (reason: string | null | undefined) => {
    switch (reason) {
      case 'SAFETY_ISSUE':
        return <AlertOctagon className="h-4 w-4 text-red-500" />;
      case 'QUALITY_ISSUE':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const renderStatusBadge = (product: MockProduct) => {
    if (product.is_active) {
      return <Badge variant="default">활성</Badge>;
    }

    const reason = product.deactivation_reason;
    const icon = getDeactivationIcon(reason);
    const label = reason ? DEACTIVATION_REASON_LABELS[reason] || '비활성' : '비활성';

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
              {product.deactivation_note || `${label}로 비활성화됨`}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return <Badge variant="secondary">{label}</Badge>;
  };

  const handleEdit = (product: MockProduct) => {
    toast.info(`수정 다이얼로그: ${product.name}`);
  };

  const handleDeactivate = (product: MockProduct) => {
    setProductList(productList.map((p) =>
      p.id === product.id ? { ...p, is_active: false, deactivation_reason: 'OTHER' } : p
    ));
    toast.success(`${product.name} 비활성화됨`);
  };

  const handleActivate = (product: MockProduct) => {
    setProductList(productList.map((p) =>
      p.id === product.id ? { ...p, is_active: true, deactivation_reason: null, deactivation_note: null } : p
    ));
    toast.success(`${product.name} 활성화됨`);
  };

  if (productList.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">등록된 제품이 없습니다</h3>
        <p className="mt-2 text-sm text-gray-500">새 제품을 등록해주세요.</p>
      </div>
    );
  }

  return (
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
          {productList.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell className="font-mono text-sm">{product.udi_di}</TableCell>
              <TableCell>{product.model_name}</TableCell>
              <TableCell>{renderStatusBadge(product)}</TableCell>
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
                    <DropdownMenuItem onClick={() => handleEdit(product)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      수정
                    </DropdownMenuItem>
                    {product.is_active ? (
                      <DropdownMenuItem
                        onClick={() => handleDeactivate(product)}
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
  );
}

const meta = {
  title: 'Tables/Manufacturer/ProductsTable',
  component: MockProductsTable,
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
} satisfies Meta<typeof MockProductsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    products: [],
  },
};

export const AllActive: Story = {
  args: {
    products: mockProducts.filter((p) => p.is_active),
  },
};

export const WithDeactivatedProducts: Story = {
  args: {
    products: mockProducts,
  },
};
