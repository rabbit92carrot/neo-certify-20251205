import { useState, useMemo } from 'react';
import type { ComponentShowcaseConfig, ComponentVariant } from '@/components/design-system/types';
import { StatCard } from '@/components/shared/StatCard';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  TrendingUp,
  ShoppingCart,
  Trash2,
  Search,
  MoreHorizontal,
  Bell,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  Check,
  ChevronsUpDown,
} from 'lucide-react';
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { Textarea } from '@/components/ui/textarea';
import { ProductSelector } from '@/components/forms/lot/ProductSelector';
import { VirtualDataTable, type VirtualColumnDef } from '@/components/shared/VirtualDataTable';
import { ShipmentForm } from '@/components/forms/ShipmentForm';
import type { SearchableComboboxOption } from '@/components/ui/searchable-combobox';
import type { Product, InventoryByLot } from '@/types/api.types';

/**
 * ShipmentForm용 ProductWithInventory 타입
 * (원본은 ShipmentForm.tsx에 내부 정의되어 있어 재정의 필요)
 */
interface ProductWithInventory extends Product {
  availableQuantity: number;
  lots?: InventoryByLot[];
}

/**
 * 제조사 역할의 컴포넌트 카탈로그
 * 각 컴포넌트의 variants와 props 문서화
 */
export const manufacturerComponentCatalog: Record<string, ComponentShowcaseConfig> = {
  'stat-card': {
    id: 'stat-card',
    name: 'StatCard',
    category: 'shared',
    description: '대시보드에서 주요 통계를 표시하는 카드',
    storybookPath: 'shared-statistics-statcard',
    // StatCard를 고정 너비로 감싸서 원본 크기로 표시
    Component: function StatCardDemo({ title, value, icon: Icon, description, trend, isLoading }: {
      title?: string;
      value?: string | number;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      icon?: any;
      description?: string;
      trend?: number;
      isLoading?: boolean;
    }) {
      return (
        <StatCard
          title={title ?? '통계'}
          value={value ?? '0'}
          icon={Icon}
          description={description}
          trend={trend}
          isLoading={isLoading}
          className="w-[200px]"
        />
      );
    },
    variants: [
      {
        id: 'inventory',
        name: '총 재고',
        description: '제조사 대시보드 - 총 재고 현황',
        props: {
          title: '총 재고',
          value: '12,500',
          icon: Package,
        },
      },
      {
        id: 'active-products',
        name: '활성 제품',
        description: '제조사 대시보드 - 활성 제품 수',
        props: {
          title: '활성 제품',
          value: '15',
          icon: Package,
        },
      },
      {
        id: 'shipment-increase',
        name: '출고 증가',
        description: '전일 대비 출고량 증가',
        props: {
          title: '금일 출고',
          value: '200',
          description: '전일 대비',
          trend: 5.2,
          icon: TrendingUp,
        },
      },
      {
        id: 'shipment-decrease',
        name: '출고 감소',
        description: '전일 대비 출고량 감소',
        props: {
          title: '금일 출고',
          value: '150',
          description: '전일 대비',
          trend: -3.5,
          icon: TrendingUp,
        },
      },
    ],
    props: [
      { name: 'title', type: 'string', required: true, description: '통계 제목' },
      { name: 'value', type: 'string | number', required: true, description: '통계 값' },
      { name: 'icon', type: 'LucideIcon', required: false, description: '아이콘 컴포넌트' },
      { name: 'description', type: 'string', required: false, description: '부가 설명' },
      { name: 'trend', type: 'number', required: false, description: '트렌드 (%)' },
      { name: 'isLoading', type: 'boolean', required: false, defaultValue: 'false', description: '로딩 상태' },
    ],
  },

  badge: {
    id: 'badge',
    name: 'Badge',
    category: 'ui',
    description: '상태나 카테고리를 표시하는 작은 라벨',
    storybookPath: 'ui-data-display-badge',
    Component: Badge,
    variants: [
      { id: 'active', name: '활성', description: '활성화된 상태', props: { children: '활성' } },
      { id: 'inactive', name: '비활성', description: '비활성화된 상태', props: { variant: 'destructive', children: '비활성' } },
      { id: 'count', name: '수량', description: '수량 표시', props: { variant: 'outline', children: '150개' } },
      { id: 'more', name: '더보기', description: '추가 항목', props: { variant: 'secondary', children: '+3' } },
    ],
    props: [
      { name: 'variant', type: "'default' | 'secondary' | 'destructive' | 'outline'", required: false, defaultValue: "'default'", description: '배지 스타일' },
      { name: 'children', type: 'ReactNode', required: true, description: '배지 내용' },
    ],
  },

  card: {
    id: 'card',
    name: 'Card',
    category: 'ui',
    description: '콘텐츠를 그룹화하는 컨테이너',
    storybookPath: 'ui-layout-card',
    Component: function CardDemo({ title, content }: { title?: string; content?: string }) {
      return (
        <Card className="w-[280px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{title ?? '카드 제목'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">{content ?? '카드 내용'}</p>
          </CardContent>
        </Card>
      );
    },
    variants: [
      { id: 'inventory', name: '재고 현황', props: { title: '재고 현황', content: '총 12,500개 재고' } },
      { id: 'shipment', name: '최근 출고', props: { title: '최근 출고', content: '오늘 3건 출고 완료' } },
      { id: 'product', name: '제품 정보', props: { title: 'PT-COG-19G-100', content: 'PDO 실 / 코그타입' } },
    ],
    props: [
      { name: 'className', type: 'string', required: false, description: 'CSS 클래스' },
      { name: 'children', type: 'ReactNode', required: true, description: '카드 내용' },
    ],
  },

  'products-table': {
    id: 'products-table',
    name: 'ProductsTable',
    category: 'tables',
    description: '제품 목록을 표시하는 테이블',
    storybookPath: 'tables-manufacturer-productstable',
    Component: function ProductsTableDemo({ variant }: { variant?: ComponentVariant }) {
      const products = [
        { id: '1', name: 'PT-COG-19G-100', status: '활성', date: '2024.01.05' },
        { id: '2', name: 'PT-MONO-23G-60', status: '활성', date: '2024.01.06' },
        { id: '3', name: 'PT-BARB-19G-150', status: '비활성', date: '2023.12.01' },
      ];
      const isEmpty = variant?.id === 'empty';
      return (
        <div className="w-[600px] border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>모델명</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>등록일</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isEmpty ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                    등록된 제품이 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === '활성' ? 'default' : 'destructive'}>{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">{p.date}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      );
    },
    variants: [
      { id: 'with-data', name: '데이터 있음', description: '제품 목록 표시', props: {} },
      { id: 'empty', name: '데이터 없음', description: '빈 상태 표시', props: { variant: 'empty' } },
    ],
    props: [
      { name: 'products', type: 'Product[]', required: true, description: '제품 목록' },
      { name: 'onEdit', type: '(id) => void', required: false, description: '편집 핸들러' },
      { name: 'onDeactivate', type: '(id) => void', required: false, description: '비활성화 핸들러' },
    ],
  },

  'product-form': {
    id: 'product-form',
    name: 'ProductForm',
    category: 'forms',
    description: '제품 등록/수정 폼',
    storybookPath: 'forms-manufacturer-productform',
    Component: function ProductFormDemo({ mode }: { mode?: string }) {
      const isEdit = mode === 'edit';
      return (
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-lg">{isEdit ? '제품 수정' : '제품 등록'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>UDI-DI</Label>
              <Input placeholder="UDI-DI 입력" defaultValue={isEdit ? '0862547851234' : ''} />
            </div>
            <div className="space-y-2">
              <Label>모델명</Label>
              <Input placeholder="모델명 입력" defaultValue={isEdit ? 'PT-COG-19G-100' : ''} />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">{isEdit ? '수정' : '등록'}</Button>
          </CardFooter>
        </Card>
      );
    },
    variants: [
      { id: 'create', name: '등록 모드', description: '새 제품 등록', props: {} },
      { id: 'edit', name: '수정 모드', description: '기존 제품 수정', props: { mode: 'edit' } },
    ],
    props: [
      { name: 'product', type: 'Product', required: false, description: '수정할 제품 (수정 모드)' },
      { name: 'onSuccess', type: '() => void', required: false, description: '성공 콜백' },
    ],
  },

  'lot-form': {
    id: 'lot-form',
    name: 'LotForm',
    category: 'forms',
    description: '생산 로트 등록 폼',
    storybookPath: 'forms-manufacturer-lotform',
    Component: function LotFormDemo() {
      return (
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-lg">생산 등록</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>제품 선택</Label>
              <Select defaultValue="pt-cog">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-cog">PT-COG-19G-100</SelectItem>
                  <SelectItem value="pt-mono">PT-MONO-23G-60</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>수량</Label>
              <Input type="number" defaultValue="100" />
            </div>
            <div className="space-y-2">
              <Label>유효기간</Label>
              <Input type="date" defaultValue="2025-12-31" />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">생산 등록</Button>
          </CardFooter>
        </Card>
      );
    },
    variants: [
      { id: 'default', name: '기본', description: '생산 등록 폼', props: {} },
    ],
    props: [
      { name: 'products', type: 'Product[]', required: true, description: '선택 가능한 제품 목록' },
      { name: 'onSuccess', type: '() => void', required: false, description: '성공 콜백' },
    ],
  },

  'cart-display': {
    id: 'cart-display',
    name: 'CartDisplay',
    category: 'shared',
    description: '출고 장바구니 표시',
    storybookPath: 'shared-cart-cartdisplay',
    Component: function CartDisplayDemo({ variant }: { variant?: ComponentVariant }) {
      const isEmpty = variant?.id === 'empty';
      const items = [
        { name: 'PT-COG-19G-100', quantity: 50 },
        { name: 'PT-MONO-23G-60', quantity: 30 },
      ];
      return (
        <Card className="w-[320px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              출고 목록
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEmpty ? (
              <p className="text-center text-gray-500 py-4">장바구니가 비어있습니다</p>
            ) : (
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm font-medium">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{item.quantity}개</Badge>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          {!isEmpty && (
            <CardFooter>
              <Button className="w-full">출고 등록</Button>
            </CardFooter>
          )}
        </Card>
      );
    },
    variants: [
      { id: 'with-items', name: '아이템 있음', description: '장바구니에 아이템이 있는 상태', props: {} },
      { id: 'empty', name: '비어있음', description: '장바구니가 빈 상태', props: { variant: 'empty' } },
    ],
    props: [
      { name: 'items', type: 'CartItem[]', required: true, description: '장바구니 아이템' },
      { name: 'onUpdateQuantity', type: 'function', required: true, description: '수량 변경 핸들러' },
      { name: 'onRemove', type: 'function', required: true, description: '삭제 핸들러' },
      { name: 'onConfirm', type: 'function', required: false, description: '확인 핸들러' },
    ],
  },

  'searchable-combobox': {
    id: 'searchable-combobox',
    name: 'SearchableCombobox',
    category: 'forms',
    description: '검색 가능한 콤보박스',
    storybookPath: 'ui-selection-searchablecombobox',
    Component: function SearchableComboboxDemo() {
      return (
        <div className="w-[300px] space-y-2">
          <Label>수신처 선택</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input className="pl-9" placeholder="유통사 검색..." defaultValue="(주)메디칼서플라이" />
          </div>
          <div className="border rounded-md p-2 space-y-1">
            <div className="px-2 py-1 bg-blue-50 rounded text-sm">(주)메디칼서플라이</div>
            <div className="px-2 py-1 hover:bg-gray-50 rounded text-sm cursor-pointer">(주)의료기기유통</div>
            <div className="px-2 py-1 hover:bg-gray-50 rounded text-sm cursor-pointer">강남의료센터</div>
          </div>
        </div>
      );
    },
    variants: [
      { id: 'default', name: '기본', description: '검색 콤보박스', props: {} },
    ],
    props: [
      { name: 'options', type: 'Option[]', required: true, description: '선택 옵션 목록' },
      { name: 'value', type: 'string', required: false, description: '선택된 값' },
      { name: 'onChange', type: '(value) => void', required: true, description: '변경 핸들러' },
      { name: 'placeholder', type: 'string', required: false, description: '플레이스홀더' },
    ],
  },

  'data-table': {
    id: 'data-table',
    name: 'DataTable',
    category: 'tables',
    description: '무한 스크롤을 지원하는 범용 테이블',
    storybookPath: 'shared-data-datatable',
    Component: function DataTableDemo({ variant }: { variant?: ComponentVariant }) {
      const isLoading = variant?.id === 'loading';
      const isEmpty = variant?.id === 'empty';
      const items = [
        { lot: 'LOT-2024-001', product: 'PT-COG-19G-100', quantity: 500, date: '2024.01.05' },
        { lot: 'LOT-2024-002', product: 'PT-MONO-23G-60', quantity: 300, date: '2024.01.06' },
        { lot: 'LOT-2024-003', product: 'PT-SCREW-21G-90', quantity: 200, date: '2024.01.07' },
      ];
      return (
        <div className="w-[600px] border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>LOT 번호</TableHead>
                <TableHead>제품</TableHead>
                <TableHead className="text-right">수량</TableHead>
                <TableHead>생산일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">로딩 중...</TableCell>
                </TableRow>
              ) : isEmpty ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500 py-8">데이터가 없습니다</TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.lot}>
                    <TableCell className="font-mono text-sm">{item.lot}</TableCell>
                    <TableCell>{item.product}</TableCell>
                    <TableCell className="text-right">{item.quantity}개</TableCell>
                    <TableCell className="text-gray-500">{item.date}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      );
    },
    variants: [
      { id: 'with-data', name: '데이터 있음', props: {} },
      { id: 'empty', name: '데이터 없음', props: { variant: 'empty' } },
      { id: 'loading', name: '로딩 중', props: { variant: 'loading' } },
    ],
    props: [
      { name: 'columns', type: 'ColumnDef[]', required: true, description: '컬럼 정의' },
      { name: 'data', type: 'T[]', required: true, description: '데이터 배열' },
      { name: 'isLoading', type: 'boolean', required: false, description: '로딩 상태' },
      { name: 'hasMore', type: 'boolean', required: false, description: '추가 데이터 여부' },
      { name: 'onLoadMore', type: '() => void', required: false, description: '더 로드 핸들러' },
    ],
  },

  'inventory-table': {
    id: 'inventory-table',
    name: 'InventoryTable',
    category: 'tables',
    description: '재고 현황 테이블',
    storybookPath: 'tables-shared-inventorytable',
    Component: function InventoryTableDemo({ variant }: { variant?: ComponentVariant }) {
      const isLoading = variant?.id === 'loading';
      const isEmpty = variant?.id === 'empty';
      const items = [
        { product: 'PT-COG-19G-100', total: 5000, available: 4800, reserved: 200 },
        { product: 'PT-MONO-23G-60', total: 3000, available: 2900, reserved: 100 },
        { product: 'PT-SCREW-21G-90', total: 2000, available: 2000, reserved: 0 },
      ];
      return (
        <div className="w-[600px] border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제품</TableHead>
                <TableHead className="text-right">총 재고</TableHead>
                <TableHead className="text-right">가용</TableHead>
                <TableHead className="text-right">예약</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    로딩 중...
                  </TableCell>
                </TableRow>
              ) : isEmpty ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                    재고 데이터가 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.product}>
                    <TableCell className="font-medium">{item.product}</TableCell>
                    <TableCell className="text-right">{item.total.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600">{item.available.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-orange-600">{item.reserved.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      );
    },
    variants: [
      { id: 'default', name: '기본', description: '재고 목록 표시', props: {} },
      { id: 'empty', name: '데이터 없음', description: '빈 상태', props: { variant: 'empty' } },
      { id: 'loading', name: '로딩', description: '로딩 상태', props: { variant: 'loading' } },
    ],
    props: [
      { name: 'inventory', type: 'InventoryItem[]', required: true, description: '재고 목록' },
      { name: 'onItemClick', type: '(item) => void', required: false, description: '아이템 클릭 핸들러' },
    ],
  },

  'transaction-history-table': {
    id: 'transaction-history-table',
    name: 'TransactionHistoryTable',
    category: 'tables',
    description: '거래 이력 테이블',
    storybookPath: 'tables-shared-transactionhistorytable',
    Component: function TransactionHistoryTableDemo({ variant }: { variant?: ComponentVariant }) {
      const isLoading = variant?.id === 'loading';
      const isEmpty = variant?.id === 'empty';
      const items = [
        { type: '출고', target: '(주)메디칼서플라이', quantity: 100, date: '2024.01.15 14:30' },
        { type: '생산', target: '-', quantity: 500, date: '2024.01.14 09:00' },
        { type: '출고', target: '강남의료센터', quantity: 50, date: '2024.01.13 16:45' },
      ];
      return (
        <div className="w-[600px] border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>유형</TableHead>
                <TableHead>대상</TableHead>
                <TableHead className="text-right">수량</TableHead>
                <TableHead>일시</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    로딩 중...
                  </TableCell>
                </TableRow>
              ) : isEmpty ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                    거래 이력이 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Badge variant={item.type === '출고' ? 'default' : 'secondary'}>{item.type}</Badge>
                    </TableCell>
                    <TableCell>{item.target}</TableCell>
                    <TableCell className="text-right">{item.quantity}개</TableCell>
                    <TableCell className="text-gray-500 text-sm">{item.date}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      );
    },
    variants: [
      { id: 'default', name: '기본', description: '거래 이력 표시', props: {} },
      { id: 'empty', name: '데이터 없음', description: '빈 상태', props: { variant: 'empty' } },
      { id: 'loading', name: '로딩', description: '로딩 상태', props: { variant: 'loading' } },
    ],
    props: [
      { name: 'history', type: 'Transaction[]', required: true, description: '거래 이력' },
      { name: 'hasMore', type: 'boolean', required: false, description: '추가 데이터 여부' },
      { name: 'onLoadMore', type: '() => void', required: false, description: '더 로드 핸들러' },
    ],
  },

  'notification-list': {
    id: 'notification-list',
    name: 'NotificationList',
    category: 'shared',
    description: '알림 목록',
    Component: function NotificationListDemo({ variant }: { variant?: ComponentVariant }) {
      const isEmpty = variant?.id === 'empty';
      const notifications = [
        { title: '입고 확인 요청', message: '(주)메디칼서플라이에서 100개 입고', time: '10분 전', unread: true },
        { title: '재고 부족 알림', message: 'PT-COG-19G-100 재고가 100개 미만입니다', time: '1시간 전', unread: true },
        { title: '출고 완료', message: '강남의료센터 출고가 완료되었습니다', time: '3시간 전', unread: false },
      ];
      return (
        <Card className="w-[380px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              알림
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEmpty ? (
              <p className="text-center text-gray-500 py-4">알림이 없습니다</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((n, i) => (
                  <div key={i} className={`p-3 rounded-lg ${n.unread ? 'bg-blue-50' : 'bg-gray-50'}`}>
                    <div className="flex items-start justify-between">
                      <span className="font-medium text-sm">{n.title}</span>
                      <span className="text-xs text-gray-500">{n.time}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      );
    },
    variants: [
      { id: 'with-notifications', name: '알림 있음', props: {} },
      { id: 'empty', name: '알림 없음', props: { variant: 'empty' } },
    ],
    props: [
      { name: 'notifications', type: 'Notification[]', required: true, description: '알림 목록' },
      { name: 'onRead', type: '(id) => void', required: false, description: '읽음 처리 핸들러' },
    ],
  },

  'manufacturer-settings-form': {
    id: 'manufacturer-settings-form',
    name: 'ManufacturerSettingsForm',
    category: 'forms',
    description: '제조사 Lot 번호 및 사용기한 설정 폼',
    storybookPath: 'forms-manufacturer-manufacturersettingsform',
    Component: function ManufacturerSettingsFormDemo({ variant }: { variant?: ComponentVariant }) {
      // Variant별 개별 필드 렌더링

      // Variant 1: 접두어 Input
      if (variant?.id === 'prefix') {
        return (
          <Card className="w-[400px]">
            <CardHeader>
              <CardTitle className="text-sm">접두어 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label>접두어 *</Label>
              <Input defaultValue="ND" placeholder="ND" maxLength={10} className="font-mono" />
              <p className="text-xs text-muted-foreground">
                Lot 번호 맨 앞에 붙는 문자열 (대문자 알파벳만, 최대 10자)
              </p>
            </CardContent>
          </Card>
        );
      }

      // Variant 2: 모델 코드 자릿수 Input
      if (variant?.id === 'model-digits') {
        return (
          <Card className="w-[400px]">
            <CardHeader>
              <CardTitle className="text-sm">모델 코드 자릿수 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label>모델 코드 자릿수 *</Label>
              <Input type="number" defaultValue={5} min={1} max={10} className="w-24" />
              <p className="text-xs text-muted-foreground">
                모델명에서 추출할 문자 수 (1~10)
              </p>
            </CardContent>
          </Card>
        );
      }

      // Variant 3: 날짜 형식 Combobox 스타일 (펼쳐진 상태)
      if (variant?.id === 'date-format') {
        return (
          <Card className="w-[400px]">
            <CardHeader>
              <CardTitle className="text-sm">날짜 형식 선택</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Combobox trigger 형태 */}
              <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm flex items-center justify-between">
                <span>YYMMDD (예: 241209)</span>
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </div>

              {/* 펼쳐진 드롭다운 (Command 직접 사용) */}
              <div className="border rounded-md shadow-md">
                <Command className="rounded-lg">
                  <CommandInput placeholder="형식 검색..." />
                  <CommandList>
                    <CommandGroup>
                      <CommandItem className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        <span className="font-mono">YYMMDD</span>
                        <span className="text-muted-foreground">(예: 241209)</span>
                      </CommandItem>
                      <CommandItem className="flex items-center gap-2">
                        <Check className="h-4 w-4 opacity-0" />
                        <span className="font-mono">YYYYMMDD</span>
                        <span className="text-muted-foreground">(예: 20241209)</span>
                      </CommandItem>
                      <CommandItem className="flex items-center gap-2">
                        <Check className="h-4 w-4 opacity-0" />
                        <span className="font-mono">YYMM</span>
                        <span className="text-muted-foreground">(예: 2412)</span>
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            </CardContent>
          </Card>
        );
      }

      // Variant 4: 사용기한 Combobox 스타일 (펼쳐진 상태)
      if (variant?.id === 'expiry-months') {
        return (
          <Card className="w-[400px]">
            <CardHeader>
              <CardTitle className="text-sm">기본 사용기한 선택</CardTitle>
              <p className="text-xs text-muted-foreground">
                생산일자 + N개월로 자동 계산됩니다
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Combobox trigger 형태 */}
              <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm flex items-center justify-between">
                <span>24개월</span>
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </div>

              {/* 펼쳐진 드롭다운 (Command 직접 사용) */}
              <div className="border rounded-md shadow-md">
                <Command className="rounded-lg">
                  <CommandInput placeholder="개월 검색..." />
                  <CommandList>
                    <CommandGroup>
                      {[6, 12, 24, 36, 48, 60].map((months) => (
                        <CommandItem key={months} className="flex items-center gap-2">
                          <Check className={`h-4 w-4 ${months === 24 ? '' : 'opacity-0'}`} />
                          <span>{months}개월</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            </CardContent>
          </Card>
        );
      }

      // Variant 5: Lot 미리보기 박스
      if (variant?.id === 'lot-preview') {
        return (
          <Card className="w-[400px]">
            <CardHeader>
              <CardTitle className="text-sm">Lot 번호 미리보기</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-1 text-lg font-mono font-semibold text-gray-900">
                  <span className="text-blue-600">ND</span>
                  <span className="text-green-600">XXXXX</span>
                  <span className="text-orange-600">241209</span>
                </div>
                <div className="mt-2 text-xs text-gray-500 space-y-1">
                  <div><span className="text-blue-600">●</span> 접두어 (설정값)</div>
                  <div><span className="text-green-600">●</span> 모델코드 (자동 추출)</div>
                  <div><span className="text-orange-600">●</span> 날짜 (생산일자)</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                실제 Lot 번호는 모델명과 생산일자에 따라 생성됩니다.
              </p>
            </CardContent>
          </Card>
        );
      }

      // Default: 전체 폼 개요 (축약 버전)
      return (
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-sm">Lot 번호 설정</CardTitle>
            <p className="text-xs text-muted-foreground">
              생산 등록 시 자동 생성되는 Lot 번호 형식을 설정합니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">접두어</span>
                <span className="font-mono">ND</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">모델 코드 자릿수</span>
                <span>5자리</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">날짜 형식</span>
                <span className="font-mono">YYMMDD</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">기본 사용기한</span>
                <span>24개월</span>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded border text-center">
              <span className="font-mono text-sm">NDXXXXX241209</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" size="sm">설정 저장</Button>
          </CardFooter>
        </Card>
      );
    },
    variants: [
      { id: 'default', name: '개요', description: '설정 요약 및 Lot 번호 미리보기', props: {} },
      { id: 'prefix', name: '접두어', description: 'Lot 번호 접두어 입력 필드', props: {} },
      { id: 'model-digits', name: '모델코드', description: '모델 코드 자릿수 입력 필드', props: {} },
      { id: 'date-format', name: '날짜형식', description: '날짜 형식 선택 (Combobox 펼침)', props: {} },
      { id: 'expiry-months', name: '사용기한', description: '기본 사용기한 선택 (Combobox 펼침)', props: {} },
      { id: 'lot-preview', name: 'Lot 미리보기', description: 'Lot 번호 생성 미리보기', props: {} },
    ],
    props: [
      { name: 'settings', type: 'ManufacturerSettings', required: true, description: '현재 설정 값' },
    ],
  },

  'product-deactivate-dialog': {
    id: 'product-deactivate-dialog',
    name: 'ProductDeactivateDialog',
    category: 'forms',
    description: '제품 비활성화 확인 다이얼로그',
    storybookPath: 'forms-manufacturer-productdeactivatedialog',
    Component: function ProductDeactivateDialogDemo() {
      // Dialog 대신 Card로 내부 콘텐츠 재현 (모달 포탈 방지)
      return (
        <Card className="w-[500px]">
          <CardHeader>
            <CardTitle className="text-lg">제품 비활성화</CardTitle>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">PDO Thread Alpha (PT-COG-19G-100)</span> 제품을 비활성화합니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 비활성화 사유 선택 */}
            <div className="space-y-2">
              <Label>
                비활성화 사유 <span className="text-red-500">*</span>
              </Label>
              <Select defaultValue="QUALITY_ISSUE">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAFETY_ISSUE">
                    <div className="flex items-center gap-2">
                      <AlertOctagon className="h-4 w-4 text-red-500" />
                      <span>안전 문제</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="QUALITY_ISSUE">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span>품질 문제</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="DISCONTINUED">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span>생산 중단</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="OTHER">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-blue-500" />
                      <span>기타</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                품질 문제가 발견된 제품입니다. 해당 제품이 사용될 경우 관리자와 제조사에 알림이 전송됩니다.
              </p>
            </div>

            {/* 상세 메모 */}
            <div className="space-y-2">
              <Label>상세 사유 (선택)</Label>
              <Textarea placeholder="추가적인 비활성화 사유를 입력하세요..." rows={3} />
            </div>

            {/* 경고 메시지 */}
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
              <strong>주의:</strong> 비활성화된 제품은 생산 등록 목록에서 표시되지 않습니다. 기존 재고는 계속 사용
              가능하며, 사용 시 관리자에게 알림이 전송됩니다. 필요 시 다시 활성화할 수 있습니다.
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline">취소</Button>
            <Button variant="destructive">비활성화</Button>
          </CardFooter>
        </Card>
      );
    },
    variants: [
      { id: 'default', name: '기본', description: '제품 비활성화 다이얼로그 (Card 형태)', props: {} },
    ],
    props: [
      { name: 'product', type: 'Product', required: true, description: '비활성화할 제품' },
      { name: 'open', type: 'boolean', required: true, description: '다이얼로그 열림 상태' },
      { name: 'onOpenChange', type: '(open: boolean) => void', required: true, description: '열림 상태 변경 핸들러' },
      { name: 'onConfirm', type: '(id, reason, note?) => Promise<void>', required: true, description: '확인 핸들러' },
    ],
  },

  'product-selector': {
    id: 'product-selector',
    name: 'ProductSelector',
    category: 'forms',
    description: '제품 선택기 (검색 + 아코디언 그룹핑)',
    storybookPath: 'forms-manufacturer-productselector',
    Component: function ProductSelectorDemo({ variant }: { variant?: ComponentVariant }) {
      const [selected, setSelected] = useState<string | null>(null);

      const mockProducts: Product[] = [
        { id: 'prod-1', name: 'PDO Thread Alpha', model_name: 'PDO-100', udi_di: 'UDI-001', organization_id: 'org-1', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-20T00:00:00Z', deactivated_at: null, deactivation_reason: null, deactivation_note: null },
        { id: 'prod-2', name: 'PDO Thread Alpha', model_name: 'PDO-200', udi_di: 'UDI-002', organization_id: 'org-1', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-20T00:00:00Z', deactivated_at: null, deactivation_reason: null, deactivation_note: null },
        { id: 'prod-3', name: 'PDO Thread Beta', model_name: 'Beta-100', udi_di: 'UDI-003', organization_id: 'org-1', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-20T00:00:00Z', deactivated_at: null, deactivation_reason: null, deactivation_note: null },
        { id: 'prod-4', name: 'Cog Thread', model_name: 'Cog-50', udi_di: 'UDI-004', organization_id: 'org-1', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-20T00:00:00Z', deactivated_at: null, deactivation_reason: null, deactivation_note: null },
        { id: 'prod-5', name: 'Cog Thread', model_name: 'Cog-100', udi_di: 'UDI-005', organization_id: 'org-1', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-20T00:00:00Z', deactivated_at: null, deactivation_reason: null, deactivation_note: null },
      ];

      if (variant?.id === 'empty') {
        return (
          <div className="w-[450px]">
            <ProductSelector products={[]} selectedProductId={null} onProductSelect={() => {}} />
          </div>
        );
      }

      return (
        <div className="w-[450px]">
          <ProductSelector
            products={mockProducts}
            selectedProductId={selected}
            onProductSelect={setSelected}
          />
        </div>
      );
    },
    variants: [
      { id: 'default', name: '제품 있음', description: '제품 목록이 있는 상태 (아코디언 그룹핑)', props: {} },
      { id: 'empty', name: '제품 없음', description: '빈 제품 목록', props: {} },
    ],
    props: [
      { name: 'products', type: 'Product[]', required: true, description: '선택 가능한 제품 목록' },
      { name: 'selectedProductId', type: 'string | null', required: true, description: '선택된 제품 ID' },
      { name: 'onProductSelect', type: '(id: string) => void', required: true, description: '선택 핸들러' },
      { name: 'disabled', type: 'boolean', required: false, description: '비활성화 상태' },
    ],
  },

  'virtual-data-table': {
    id: 'virtual-data-table',
    name: 'VirtualDataTable',
    category: 'tables',
    description: '대용량 데이터 가상 스크롤 테이블 (10K+ 행 지원)',
    storybookPath: 'tables-shared-virtualdatatable',
    Component: function VirtualDataTableDemo({ variant }: { variant?: ComponentVariant }) {
      // 500행 Mock 데이터 생성
      const mockData = useMemo(
        () =>
          Array.from({ length: 500 }, (_, i) => ({
            id: `record-${i}`,
            date: new Date(2025, 0, 20 - (i % 20)).toLocaleDateString('ko-KR'),
            action: ['출고', '수령', '시술', '폐기'][i % 4],
            product: `PDO Thread ${['Alpha', 'Beta', 'Gamma'][i % 3]}`,
            quantity: Math.floor(Math.random() * 100) + 1,
          })),
        []
      );

      const columns: VirtualColumnDef<(typeof mockData)[0]>[] = useMemo(
        () => [
          { id: 'date', header: '날짜', cell: (row) => row.date, width: 120 },
          {
            id: 'action',
            header: '구분',
            cell: (row) => (
              <Badge variant={row.action === '출고' ? 'default' : 'secondary'}>{row.action}</Badge>
            ),
            width: 80,
          },
          { id: 'product', header: '제품', cell: (row) => row.product, width: 150 },
          { id: 'quantity', header: '수량', cell: (row) => `${row.quantity}개`, width: 80 },
        ],
        []
      );

      if (variant?.id === 'empty') {
        return (
          <div className="w-[600px]">
            <VirtualDataTable
              columns={columns}
              data={[]}
              getRowKey={(r) => r.id}
              emptyMessage="데이터가 없습니다"
              height={300}
            />
          </div>
        );
      }

      if (variant?.id === 'loading') {
        return (
          <div className="w-[600px]">
            <VirtualDataTable columns={columns} data={[]} getRowKey={(r) => r.id} isLoading={true} height={300} />
          </div>
        );
      }

      return (
        <div className="w-[600px]">
          <VirtualDataTable columns={columns} data={mockData} getRowKey={(row) => row.id} height={400} />
        </div>
      );
    },
    variants: [
      { id: 'default', name: '500행 데이터', description: '대용량 데이터 가상 스크롤', props: {} },
      { id: 'empty', name: '빈 테이블', description: '데이터 없음 상태', props: {} },
      { id: 'loading', name: '로딩', description: '로딩 상태', props: {} },
    ],
    props: [
      { name: 'columns', type: 'VirtualColumnDef<T>[]', required: true, description: '컬럼 정의' },
      { name: 'data', type: 'T[]', required: true, description: '테이블 데이터' },
      { name: 'getRowKey', type: '(row: T) => string', required: true, description: '행 키 추출 함수' },
      { name: 'height', type: 'number', required: false, defaultValue: '600', description: '테이블 높이 (px)' },
      { name: 'isLoading', type: 'boolean', required: false, description: '로딩 상태' },
      { name: 'hasMore', type: 'boolean', required: false, description: '추가 데이터 여부' },
      { name: 'onLoadMore', type: '() => void', required: false, description: '더 로드 핸들러' },
    ],
  },

  'shipment-form': {
    id: 'shipment-form',
    name: 'ShipmentForm',
    category: 'forms',
    description: '출고 폼 (조직 검색 + 제품 선택 + 장바구니)',
    storybookPath: 'forms-shared-shipmentform',
    Component: function ShipmentFormDemo({ variant }: { variant?: ComponentVariant }) {
      // ProductWithInventory 타입에 맞는 mock 데이터
      const mockProducts: ProductWithInventory[] = [
        {
          id: 'prod-001',
          organization_id: 'org-manufacturer',
          name: 'PDO Thread COG 19G-100mm',
          model_name: 'PT-COG-19G-100',
          udi_di: 'UDI-001-COG-19G',
          is_active: true,
          created_at: '2024-01-05T00:00:00Z',
          updated_at: '2024-01-05T00:00:00Z',
          deactivated_at: null,
          deactivation_reason: null,
          deactivation_note: null,
          availableQuantity: 5000,
          lots: [
            {
              lotId: 'lot-001',
              lotNumber: 'LOT-20240115-001',
              manufactureDate: '2024-01-15',
              expiryDate: '2026-01-15',
              quantity: 3000,
            },
            {
              lotId: 'lot-002',
              lotNumber: 'LOT-20240116-001',
              manufactureDate: '2024-01-16',
              expiryDate: '2026-01-16',
              quantity: 2000,
            },
          ],
        },
        {
          id: 'prod-002',
          organization_id: 'org-manufacturer',
          name: 'PDO Thread MONO 23G-60mm',
          model_name: 'PT-MONO-23G-60',
          udi_di: 'UDI-002-MONO-23G',
          is_active: true,
          created_at: '2024-01-06T00:00:00Z',
          updated_at: '2024-01-06T00:00:00Z',
          deactivated_at: null,
          deactivation_reason: null,
          deactivation_note: null,
          availableQuantity: 3500,
          lots: [
            {
              lotId: 'lot-003',
              lotNumber: 'LOT-20240115-002',
              manufactureDate: '2024-01-15',
              expiryDate: '2026-01-15',
              quantity: 3500,
            },
          ],
        },
      ];

      // no-op async 핸들러 (기존 ShipmentView.tsx 패턴)
      const handleSearchOrganizations = async (_query: string): Promise<SearchableComboboxOption[]> => {
        // Showcase에서는 빈 배열 반환 (실제 검색 불가)
        return [];
      };

      const handleSubmit = async (): Promise<{ success: boolean; error?: { message: string } }> => {
        // Showcase에서는 항상 성공 반환 (실제 제출 불가)
        return { success: true };
      };

      // 빈 상태 variant
      if (variant?.id === 'empty') {
        return (
          <div className="w-full max-w-4xl">
            <ShipmentForm
              organizationType="MANUFACTURER"
              products={[]}
              onSearchOrganizations={handleSearchOrganizations}
              onSubmit={handleSubmit}
              canSelectLot={true}
            />
          </div>
        );
      }

      // 기본 (제조사 출고)
      return (
        <div className="w-full max-w-4xl">
          <ShipmentForm
            organizationType="MANUFACTURER"
            products={mockProducts}
            onSearchOrganizations={handleSearchOrganizations}
            onSubmit={handleSubmit}
            canSelectLot={true}
          />
        </div>
      );
    },
    variants: [
      { id: 'default', name: '제조사 출고', description: '제품/LOT 선택 가능한 출고 폼', props: {} },
      { id: 'empty', name: '제품 없음', description: '출고 가능 제품이 없는 상태', props: {} },
    ],
    props: [
      { name: 'organizationType', type: "'MANUFACTURER' | 'DISTRIBUTOR'", required: true, description: '조직 유형' },
      { name: 'products', type: 'ProductWithInventory[]', required: true, description: '출고 가능 제품 목록 (재고 포함)' },
      { name: 'onSearchOrganizations', type: '(query: string) => Promise<Option[]>', required: true, description: '조직 검색 핸들러' },
      { name: 'onSubmit', type: '(orgId, items) => Promise<Result>', required: true, description: '출고 제출 핸들러' },
      { name: 'canSelectLot', type: 'boolean', required: false, defaultValue: 'false', description: 'LOT 선택 가능 여부 (제조사만 true)' },
    ],
  },
};

/**
 * 제조사 페이지별 컴포넌트 매핑
 */
export const manufacturerPageComponents: Record<string, string[]> = {
  dashboard: ['stat-card', 'card'],
  products: ['products-table', 'product-form', 'product-deactivate-dialog', 'badge'],
  production: ['lot-form', 'product-selector'],
  shipment: ['shipment-form', 'cart-display', 'searchable-combobox'],
  inventory: ['inventory-table', 'data-table'],
  history: ['transaction-history-table', 'virtual-data-table'],
  inbox: ['notification-list'],
  settings: ['manufacturer-settings-form'],
};
