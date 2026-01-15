import type { Meta, StoryObj } from '@storybook/react';
import { ScrollArea } from './scroll-area';
import { Separator } from './separator';

const meta = {
  title: 'UI/Layout/ScrollArea',
  component: ScrollArea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const tags = Array.from({ length: 50 }).map(
  (_, i) => `LOT-2024-${String(i + 1).padStart(3, '0')}`
);

export const Vertical: Story = {
  render: () => (
    <ScrollArea className="h-72 w-48 rounded-md border">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium leading-none">Lot 목록</h4>
        {tags.map((tag) => (
          <div key={tag}>
            <div className="text-sm">{tag}</div>
            <Separator className="my-2" />
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <ScrollArea className="w-96 whitespace-nowrap rounded-md border">
      <div className="flex w-max space-x-4 p-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-40 h-24 rounded-md border flex items-center justify-center"
          >
            아이템 {i + 1}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const Both: Story = {
  render: () => (
    <ScrollArea className="h-72 w-72 rounded-md border">
      <div className="p-4" style={{ width: '500px' }}>
        <h4 className="mb-4 text-sm font-medium">넓은 콘텐츠</h4>
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="py-2">
            이것은 매우 긴 텍스트 라인입니다. 가로 스크롤과 세로 스크롤 모두 테스트합니다.
            라인 번호: {i + 1}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const ProductList: Story = {
  render: () => (
    <ScrollArea className="h-80 w-64 rounded-md border">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium">제품 목록</h4>
        {[
          { name: 'PDO Thread Type A', model: 'PDO-A-100', stock: 150 },
          { name: 'PDO Thread Type B', model: 'PDO-B-200', stock: 80 },
          { name: 'PDO Thread Premium', model: 'PDO-P-500', stock: 45 },
          { name: 'PDO Thread Lite', model: 'PDO-L-50', stock: 200 },
          { name: 'PDO Thread Pro', model: 'PDO-PRO-300', stock: 30 },
          { name: 'PDO Thread Ultra', model: 'PDO-U-400', stock: 15 },
          { name: 'PDO Thread Mini', model: 'PDO-M-25', stock: 300 },
          { name: 'PDO Thread Max', model: 'PDO-MAX-600', stock: 25 },
        ].map((product, i) => (
          <div key={i}>
            <div className="py-2">
              <p className="font-medium text-sm">{product.name}</p>
              <p className="text-xs text-muted-foreground">{product.model}</p>
              <p className="text-xs">재고: {product.stock}개</p>
            </div>
            <Separator />
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const CodeList: Story = {
  render: () => (
    <ScrollArea className="h-48 w-80 rounded-md border bg-muted/50">
      <div className="p-4 font-mono text-sm">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="py-1">
            NC-{String(1000000 + i).padStart(8, '0')}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};
