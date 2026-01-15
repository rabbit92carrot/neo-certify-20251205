'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useMemo } from 'react';
import { DataTable, type ColumnDef } from './DataTable';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: string;
  name: string;
  modelName: string;
  stock: number;
  status: 'active' | 'inactive';
}

const meta = {
  title: 'Shared/Data/DataTable',
  component: DataTable<Product>,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DataTable<Product>>;

export default meta;
type Story = StoryObj<typeof meta>;

// 샘플 데이터
const sampleProducts: Product[] = [
  { id: '1', name: 'PDO Thread Type A', modelName: 'PDO-A-100', stock: 150, status: 'active' },
  { id: '2', name: 'PDO Thread Type B', modelName: 'PDO-B-200', stock: 80, status: 'active' },
  { id: '3', name: 'PDO Thread Premium', modelName: 'PDO-P-500', stock: 45, status: 'active' },
  { id: '4', name: 'PDO Thread Mono', modelName: 'PDO-M-300', stock: 0, status: 'inactive' },
  { id: '5', name: 'PDO Thread Cog', modelName: 'PDO-C-400', stock: 200, status: 'active' },
];

// 컬럼 정의
const columns: ColumnDef<Product>[] = [
  {
    id: 'name',
    header: '제품명',
    cell: (row) => <span className="font-medium">{row.name}</span>,
  },
  {
    id: 'modelName',
    header: '모델명',
    cell: (row) => <code className="text-sm">{row.modelName}</code>,
  },
  {
    id: 'stock',
    header: '재고',
    headerClassName: 'text-right',
    cellClassName: 'text-right',
    cell: (row) => `${row.stock.toLocaleString()}개`,
  },
  {
    id: 'status',
    header: '상태',
    cell: (row) => (
      <Badge variant={row.status === 'active' ? 'default' : 'secondary'}>
        {row.status === 'active' ? '활성' : '비활성'}
      </Badge>
    ),
  },
];

export const Default: Story = {
  args: {
    columns,
    data: sampleProducts,
    getRowKey: (row) => row.id,
  },
};

export const Loading: Story = {
  args: {
    columns,
    data: [],
    getRowKey: (row) => row.id,
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    columns,
    data: [],
    getRowKey: (row) => row.id,
    emptyMessage: '등록된 제품이 없습니다',
    emptyDescription: '새 제품을 등록하여 시작하세요.',
  },
};

export const WithCustomEmptyMessage: Story = {
  args: {
    columns,
    data: [],
    getRowKey: (row) => row.id,
    emptyMessage: '검색 결과가 없습니다',
    emptyDescription: '다른 검색어로 다시 시도해보세요.',
  },
};

export const ManyRows: Story = {
  render: () => {
    const manyProducts = Array.from({ length: 20 }, (_, i) => ({
      id: `${i + 1}`,
      name: `PDO Thread ${i + 1}`,
      modelName: `PDO-${String.fromCharCode(65 + (i % 26))}-${100 * (i + 1)}`,
      stock: Math.floor(Math.random() * 300),
      status: Math.random() > 0.2 ? 'active' : 'inactive' as const,
    }));

    return (
      <DataTable
        columns={columns}
        data={manyProducts}
        getRowKey={(row) => row.id}
      />
    );
  },
};

export const WithInfiniteScroll: Story = {
  render: () => {
    const columns: ColumnDef<Product>[] = useMemo(() => [
      {
        id: 'name',
        header: '제품명',
        cell: (row) => <span className="font-medium">{row.name}</span>,
      },
      {
        id: 'modelName',
        header: '모델명',
        cell: (row) => <code className="text-sm">{row.modelName}</code>,
      },
      {
        id: 'stock',
        header: '재고',
        headerClassName: 'text-right',
        cellClassName: 'text-right',
        cell: (row) => `${row.stock.toLocaleString()}개`,
      },
    ], []);

    return (
      <div className="h-[400px] overflow-auto">
        <DataTable
          columns={columns}
          data={sampleProducts}
          getRowKey={(row) => row.id}
          hasMore
          onLoadMore={() => console.log('Loading more...')}
        />
      </div>
    );
  },
};
