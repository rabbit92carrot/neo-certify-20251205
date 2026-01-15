import type { Meta, StoryObj } from '@storybook/react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
import { Badge } from './badge';
import { Button } from './button';

const meta = {
  title: 'UI/Data Display/Table',
  component: Table,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>제품 목록</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>제품명</TableHead>
          <TableHead>모델명</TableHead>
          <TableHead>UDI-DI</TableHead>
          <TableHead className="text-right">재고</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">PDO Thread Type A</TableCell>
          <TableCell>PDO-A-100</TableCell>
          <TableCell>1234567890123</TableCell>
          <TableCell className="text-right">150</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">PDO Thread Type B</TableCell>
          <TableCell>PDO-B-200</TableCell>
          <TableCell>1234567890124</TableCell>
          <TableCell className="text-right">80</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">PDO Thread Premium</TableCell>
          <TableCell>PDO-P-500</TableCell>
          <TableCell>1234567890125</TableCell>
          <TableCell className="text-right">45</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const WithBadges: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>제품명</TableHead>
          <TableHead>모델명</TableHead>
          <TableHead>상태</TableHead>
          <TableHead className="text-right">재고</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">PDO Thread Type A</TableCell>
          <TableCell>PDO-A-100</TableCell>
          <TableCell>
            <Badge variant="default">활성</Badge>
          </TableCell>
          <TableCell className="text-right">150</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">PDO Thread Type B</TableCell>
          <TableCell>PDO-B-200</TableCell>
          <TableCell>
            <Badge variant="default">활성</Badge>
          </TableCell>
          <TableCell className="text-right">80</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">PDO Thread Type C</TableCell>
          <TableCell>PDO-C-300</TableCell>
          <TableCell>
            <Badge variant="secondary">비활성</Badge>
          </TableCell>
          <TableCell className="text-right">0</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const WithActions: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>조직명</TableHead>
          <TableHead>유형</TableHead>
          <TableHead>상태</TableHead>
          <TableHead className="text-right">액션</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">신규 유통사</TableCell>
          <TableCell>유통사</TableCell>
          <TableCell>
            <Badge variant="secondary">대기중</Badge>
          </TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              <Button size="sm">승인</Button>
              <Button size="sm" variant="destructive">
                거부
              </Button>
            </div>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">신규 병원</TableCell>
          <TableCell>병원</TableCell>
          <TableCell>
            <Badge variant="secondary">대기중</Badge>
          </TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              <Button size="sm">승인</Button>
              <Button size="sm" variant="destructive">
                거부
              </Button>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const InventoryTable: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Lot 번호</TableHead>
          <TableHead>제조일</TableHead>
          <TableHead>유효기한</TableHead>
          <TableHead className="text-right">수량</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">LOT-2024-001</TableCell>
          <TableCell>2024-01-01</TableCell>
          <TableCell>2026-01-01</TableCell>
          <TableCell className="text-right">100</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">LOT-2024-002</TableCell>
          <TableCell>2024-02-01</TableCell>
          <TableCell>2026-02-01</TableCell>
          <TableCell className="text-right">50</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">LOT-2024-003</TableCell>
          <TableCell>2024-03-01</TableCell>
          <TableCell className="text-orange-500">2024-03-15</TableCell>
          <TableCell className="text-right">20</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const Empty: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>제품명</TableHead>
          <TableHead>모델명</TableHead>
          <TableHead className="text-right">재고</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
            데이터가 없습니다.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};
