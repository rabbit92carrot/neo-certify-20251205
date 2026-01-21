import { useState, useMemo } from 'react';
import type { ComponentShowcaseConfig, ComponentVariant } from '@/components/design-system/types';
import { cn } from '@/lib/utils';
import { StatCard } from '@/components/shared/StatCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { ProductCard } from '@/components/shared/ProductCard';
import { QuantityInputPanel } from '@/components/shared/QuantityInputPanel';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  Filter,
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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
  'page-header': {
    id: 'page-header',
    name: 'PageHeader',
    category: 'shared',
    description: '페이지 상단에 제목과 설명, 액션 버튼을 표시하는 헤더',
    storybookPath: 'shared-layout-pageheader',
    Component: function PageHeaderDemo({ variant }: { variant?: ComponentVariant }) {
      if (variant?.id === 'with-action') {
        return (
          <div className="w-[600px]">
            <PageHeader
              title="제품 관리"
              description="제품을 등록하고 관리합니다."
              actions={<Button size="sm"><Plus className="h-4 w-4 mr-1" />제품 추가</Button>}
            />
          </div>
        );
      }
      return (
        <div className="w-[600px]">
          <PageHeader
            title="재고 조회"
            description="제품별 재고 현황을 확인합니다."
          />
        </div>
      );
    },
    variants: [
      { id: 'default', name: '기본', description: '제목과 설명만 있는 헤더', props: {} },
      { id: 'with-action', name: '액션 버튼', description: '우측에 액션 버튼이 있는 헤더', props: {} },
    ],
    props: [
      { name: 'title', type: 'string', required: true, description: '페이지 제목' },
      { name: 'description', type: 'string', required: false, description: '페이지 설명' },
      { name: 'actions', type: 'ReactNode', required: false, description: '우측 액션 버튼 영역' },
      { name: 'className', type: 'string', required: false, description: '추가 CSS 클래스' },
    ],
  },

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
    description: '생산 로트 등록 폼 (제품 선택 + 생산 정보)',
    storybookPath: 'forms-manufacturer-lotform',
    Component: function LotFormDemo({ variant }: { variant?: ComponentVariant }) {
      // full-layout: 실제 2열 레이아웃
      if (variant?.id === 'full-layout') {
        return (
          <div className="w-[900px] flex gap-6">
            {/* 좌측: ProductSelector (펼쳐진 아코디언) */}
            <div className="flex-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">제품 선택</CardTitle>
                  <p className="text-sm text-muted-foreground">제품군을 선택한 후 모델을 선택하세요</p>
                </CardHeader>
                <CardContent>
                  {/* 검색 */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="제품명 또는 모델명 검색..." className="pl-9" />
                  </div>
                  {/* 아코디언 (1개 그룹 펼침, 나머지 접힘) */}
                  <div className="space-y-2">
                    {/* 펼쳐진 그룹 */}
                    <div className="border rounded-lg px-3">
                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">PDO Thread Alpha</span>
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">2개</span>
                        </div>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                      <div className="border-t pb-3 grid grid-cols-2 gap-2 pt-3">
                        <div className="p-3 rounded-lg border border-primary bg-primary/5 ring-2 ring-primary">
                          <p className="font-medium text-sm">PDO-100</p>
                          <p className="text-xs text-muted-foreground">UDI-001</p>
                          <Check className="h-4 w-4 text-primary mt-1" />
                        </div>
                        <div className="p-3 rounded-lg border hover:bg-gray-50">
                          <p className="font-medium text-sm">PDO-200</p>
                          <p className="text-xs text-muted-foreground">UDI-002</p>
                        </div>
                      </div>
                    </div>
                    {/* 접힌 그룹들 */}
                    <div className="border rounded-lg px-3">
                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">PDO Thread Beta</span>
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">1개</span>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="border rounded-lg px-3">
                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">Cog Thread</span>
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">2개</span>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                  {/* 푸터 */}
                  <div className="text-xs text-muted-foreground text-center pt-4 border-t mt-4">
                    3개 제품군 · 총 5개 제품
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 우측: 생산 정보 폼 */}
            <div className="w-[40%]">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">생산 정보</CardTitle>
                  <p className="text-sm text-muted-foreground">생산 수량 및 일자를 입력하세요</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 선택된 제품 */}
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full p-1.5 bg-primary text-primary-foreground shrink-0">
                        <Check className="h-3 w-3" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">PDO Thread Alpha</p>
                        <p className="text-xs text-muted-foreground truncate">PDO-100</p>
                      </div>
                    </div>
                  </div>
                  {/* 폼 필드들 */}
                  <div className="space-y-3">
                    <div>
                      <Label>수량 *</Label>
                      <Input type="number" placeholder="생산 수량 (1 ~ 100,000)" className="mt-1" />
                      <p className="text-xs text-muted-foreground mt-1">최대 100,000개까지 입력 가능합니다.</p>
                    </div>
                    <div>
                      <Label>생산일자 *</Label>
                      <Input type="date" defaultValue="2024-01-20" className="mt-1" />
                    </div>
                    <div>
                      <Label>사용기한 *</Label>
                      <Input type="date" defaultValue="2026-01-19" className="mt-1" />
                      <p className="text-xs text-muted-foreground mt-1">기본값: 생산일자 + 24개월</p>
                    </div>
                    <Button className="w-full">생산 등록</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      }

      // with-selection: 제품 선택된 상태 (우측 폼만)
      if (variant?.id === 'with-selection') {
        return (
          <Card className="w-[400px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">생산 정보</CardTitle>
              <p className="text-sm text-muted-foreground">생산 수량 및 일자를 입력하세요</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2">
                  <div className="rounded-full p-1.5 bg-primary text-primary-foreground shrink-0">
                    <Check className="h-3 w-3" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">PDO Thread Alpha</p>
                    <p className="text-xs text-muted-foreground truncate">PDO-100</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label>수량 *</Label>
                  <Input type="number" defaultValue="1000" className="mt-1" />
                </div>
                <div>
                  <Label>생산일자 *</Label>
                  <Input type="date" defaultValue="2024-01-20" className="mt-1" />
                </div>
                <div>
                  <Label>사용기한 *</Label>
                  <Input type="date" defaultValue="2026-01-19" className="mt-1" />
                </div>
                <Button className="w-full">생산 등록</Button>
              </div>
            </CardContent>
          </Card>
        );
      }

      // success: 등록 완료
      if (variant?.id === 'success') {
        return (
          <div className="w-[400px] space-y-4">
            <div className="p-4 rounded-md bg-green-50 border border-green-200">
              <p className="text-green-800 font-medium">생산 등록이 완료되었습니다!</p>
              <p className="text-green-700 text-sm mt-1">
                Lot 번호: <span className="font-mono font-semibold">LOT-20240120-001</span>
              </p>
            </div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">생산 정보</CardTitle>
                <p className="text-sm text-muted-foreground">제품을 먼저 선택해주세요</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 opacity-50">
                  <div>
                    <Label>수량 *</Label>
                    <Input disabled placeholder="생산 수량" className="mt-1" />
                  </div>
                  <div>
                    <Label>생산일자 *</Label>
                    <Input type="date" disabled className="mt-1" />
                  </div>
                  <div>
                    <Label>사용기한 *</Label>
                    <Input type="date" disabled className="mt-1" />
                  </div>
                  <Button disabled className="w-full">생산 등록</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      // default: 개요
      return (
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-sm">LotForm</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>생산 로트 등록을 위한 폼입니다.</p>
            <ul className="list-disc list-inside text-xs space-y-1">
              <li>좌측: ProductSelector (아코디언 제품 선택)</li>
              <li>우측: 생산 정보 입력 (수량, 생산일자, 사용기한)</li>
              <li>제품 선택 시 우측 폼 활성화</li>
              <li>생산일자 변경 시 사용기한 자동 계산</li>
            </ul>
          </CardContent>
        </Card>
      );
    },
    variants: [
      { id: 'default', name: '개요', description: '폼 구조 요약', props: {} },
      { id: 'full-layout', name: '전체 레이아웃', description: '2열 레이아웃 (ProductSelector + 생산 정보)', props: {} },
      { id: 'with-selection', name: '제품 선택됨', description: '제품 선택 후 폼 입력 가능 상태', props: {} },
      { id: 'success', name: '등록 완료', description: '성공 메시지 표시', props: {} },
    ],
    props: [
      { name: 'products', type: 'Product[]', required: true, description: '선택 가능한 제품 목록' },
      { name: 'settings', type: 'ManufacturerSettings', required: false, description: '제조사 설정 (사용기한 계산용)' },
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
    description: '재고 현황 테이블 (Card 아코디언 스타일, 클릭 시 Lot 상세 확장)',
    storybookPath: 'tables-shared-inventorytable',
    Component: function InventoryTableDemo({ variant }: { variant?: ComponentVariant }) {
      const isEmpty = variant?.id === 'empty';
      const isExpanded = variant?.id === 'expanded';

      if (isEmpty) {
        return (
          <div className="w-[600px] p-8 text-center text-gray-500 border rounded-lg">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>재고 데이터가 없습니다</p>
          </div>
        );
      }

      const products = [
        {
          name: 'PDO Thread COG 19G-100mm',
          model: 'PT-COG-19G-100',
          udi: 'UDI-2024-001',
          total: 5000,
          lots: [
            { lotNumber: 'ND12345-240115', mfgDate: '2024-01-15', expiryDate: '2025-01-15', qty: 3000 },
            { lotNumber: 'ND12345-240110', mfgDate: '2024-01-10', expiryDate: '2024-02-10', qty: 2000, expirySoon: true },
          ],
        },
        {
          name: 'PDO Thread MONO 23G-60mm',
          model: 'PT-MONO-23G-60',
          udi: 'UDI-2024-002',
          total: 3000,
          lots: [
            { lotNumber: 'ND12346-240112', mfgDate: '2024-01-12', expiryDate: '2025-01-12', qty: 3000 },
          ],
        },
        {
          name: 'PDO Thread SCREW 21G-90mm',
          model: 'PT-SCREW-21G-90',
          udi: 'UDI-2024-003',
          total: 2000,
          lots: [
            { lotNumber: 'ND12347-240108', mfgDate: '2024-01-08', expiryDate: '2025-01-08', qty: 2000 },
          ],
        },
      ];

      return (
        <div className="w-[600px] space-y-3">
          {products.map((product, i) => (
            <Card key={i}>
              <CardHeader className="cursor-pointer py-3">
                <div className="flex items-center gap-3">
                  {isExpanded && i === 0 ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <Package className="h-4 w-4 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{product.name}</span>
                    <div className="text-xs text-muted-foreground">
                      {product.model} · UDI: {product.udi}
                    </div>
                  </div>
                  <Badge variant="secondary">{product.total.toLocaleString()}개</Badge>
                </div>
              </CardHeader>
              {isExpanded && i === 0 && (
                <CardContent className="pt-0 border-t">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lot 번호</TableHead>
                        <TableHead>제조일자</TableHead>
                        <TableHead>유효기한</TableHead>
                        <TableHead className="text-right">수량</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {product.lots.map((lot, j) => (
                        <TableRow key={j}>
                          <TableCell className="font-mono text-sm">{lot.lotNumber}</TableCell>
                          <TableCell>{lot.mfgDate}</TableCell>
                          <TableCell className="flex items-center gap-2">
                            {lot.expiryDate}
                            {lot.expirySoon && (
                              <Badge variant="destructive" className="text-xs">임박</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{lot.qty.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      );
    },
    variants: [
      { id: 'default', name: '기본', description: '접힌 상태의 Card 목록', props: {} },
      { id: 'expanded', name: '카드 펼침', description: 'Lot별 상세 테이블 표시', props: {} },
      { id: 'empty', name: '빈 상태', description: '재고 없음', props: {} },
    ],
    props: [
      { name: 'summaries', type: 'InventorySummary[]', required: true, description: '재고 요약 목록' },
      { name: 'getDetail', type: '(productId) => Promise<Detail>', required: true, description: 'Lot 상세 조회 액션' },
    ],
  },

  'transaction-history-table': {
    id: 'transaction-history-table',
    name: 'TransactionHistoryTable',
    category: 'tables',
    description: '거래 이력 테이블 (Card 아코디언 스타일, 제품 확장 시 코드 목록)',
    storybookPath: 'tables-shared-transactionhistorytable',
    Component: function TransactionHistoryTableDemo({ variant }: { variant?: ComponentVariant }) {
      const isEmpty = variant?.id === 'empty';
      const isExpanded = variant?.id === 'expanded';

      if (isEmpty) {
        return (
          <div className="w-[600px] p-8 text-center text-gray-500 border rounded-lg">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>거래 이력이 없습니다</p>
          </div>
        );
      }

      const getTypeIcon = (type: string): React.ReactNode => {
        switch (type) {
          case '생산': return <Package className="h-4 w-4" />;
          case '출고': return <TrendingUp className="h-4 w-4" />;
          default: return <Package className="h-4 w-4" />;
        }
      };

      const transactions = [
        {
          type: '출고',
          from: '테스트제조사',
          to: '(주)메디칼서플라이',
          date: '2024.01.15 14:30',
          totalQty: 100,
          products: [
            { name: 'PDO Thread COG 19G-100mm', qty: 60 },
            { name: 'PDO Thread MONO 23G-60mm', qty: 40 },
          ],
        },
        {
          type: '생산',
          from: '-',
          to: '테스트제조사',
          date: '2024.01.14 09:00',
          totalQty: 500,
          products: [
            { name: 'PDO Thread COG 19G-100mm', qty: 500 },
          ],
        },
        {
          type: '출고',
          from: '테스트제조사',
          to: '강남의료센터',
          date: '2024.01.13 16:45',
          totalQty: 50,
          products: [
            { name: 'PDO Thread SCREW 21G-90mm', qty: 50 },
          ],
        },
      ];

      return (
        <div className="w-[600px] space-y-3">
          {transactions.map((tx, i) => (
            <Card key={i}>
              <CardHeader className="cursor-pointer py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isExpanded && i === 0 ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    {getTypeIcon(tx.type)}
                    <Badge variant={tx.type === '출고' ? 'default' : 'secondary'}>{tx.type}</Badge>
                    <span className="text-sm text-muted-foreground">{tx.date}</span>
                  </div>
                  <Badge variant="outline">{tx.totalQty}개</Badge>
                </div>
                {tx.type !== '생산' && (
                  <div className="flex items-center gap-2 mt-2 text-sm ml-7">
                    <span className="text-muted-foreground">{tx.from}</span>
                    <ChevronRight className="h-3 w-3" />
                    <span>{tx.to}</span>
                  </div>
                )}
              </CardHeader>
              {isExpanded && i === 0 && (
                <CardContent className="pt-0 border-t">
                  <div className="space-y-2 py-2">
                    {tx.products.map((product, j) => (
                      <div key={j} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{product.name}</span>
                        </div>
                        <Badge variant="secondary">{product.qty}개</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      );
    },
    variants: [
      { id: 'default', name: '기본', description: '접힌 상태의 Card 목록', props: {} },
      { id: 'expanded', name: '제품 펼침', description: '제품 목록 확장', props: {} },
      { id: 'empty', name: '빈 상태', description: '거래 이력 없음', props: {} },
    ],
    props: [
      { name: 'histories', type: 'TransactionHistorySummary[]', required: true, description: '거래 이력' },
      { name: 'currentOrgId', type: 'string', required: true, description: '현재 조직 ID' },
      { name: 'showReturnButton', type: 'boolean', required: false, description: '반품 버튼 표시 여부' },
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
    Component: function ProductDeactivateDialogDemo({ variant }: { variant?: ComponentVariant }) {
      // 펼쳐진 상태 - Select 대신 옵션 목록을 직접 표시 (Badge 색상 포함)
      if (variant?.id === 'expanded') {
        return (
          <Card className="w-[500px]">
            <CardHeader>
              <CardTitle className="text-lg">제품 비활성화</CardTitle>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold">PDO Thread Alpha (PT-COG-19G-100)</span> 제품을 비활성화합니다.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 비활성화 사유 선택 - 펼쳐진 상태 */}
              <div className="space-y-2">
                <Label>
                  비활성화 사유 <span className="text-red-500">*</span>
                </Label>

                {/* Select Trigger (열린 상태 시뮬레이션) */}
                <div className="flex items-center justify-between h-10 px-3 border rounded-md bg-gray-50">
                  <span className="text-sm text-muted-foreground">사유를 선택하세요</span>
                  <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                </div>

                {/* 펼쳐진 옵션 목록 - Badge 색상 포함 */}
                <div className="border rounded-md shadow-md bg-white p-1">
                  {/* SAFETY_ISSUE - destructive (빨강) */}
                  <div className="px-3 py-2 hover:bg-blue-50 rounded cursor-pointer flex items-center gap-2">
                    <AlertOctagon className="h-4 w-4 text-red-500" />
                    <span className="flex-1">안전 문제</span>
                    <Badge variant="destructive">위험</Badge>
                  </div>

                  {/* QUALITY_ISSUE - default (파랑) - 선택됨 */}
                  <div className="px-3 py-2 bg-blue-50 rounded cursor-pointer flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="flex-1">품질 문제</span>
                    <Badge variant="default">품질</Badge>
                    <Check className="h-4 w-4 text-primary" />
                  </div>

                  {/* DISCONTINUED - secondary (회색) */}
                  <div className="px-3 py-2 hover:bg-blue-50 rounded cursor-pointer flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span className="flex-1">생산 중단</span>
                    <Badge variant="secondary">중단</Badge>
                  </div>

                  {/* OTHER - outline (테두리만) */}
                  <div className="px-3 py-2 hover:bg-blue-50 rounded cursor-pointer flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-blue-500" />
                    <span className="flex-1">기타</span>
                    <Badge variant="outline">기타</Badge>
                  </div>
                </div>

                {/* 선택된 사유 설명 */}
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
      }

      // 기본 상태 - Dialog 대신 Card로 내부 콘텐츠 재현 (모달 포탈 방지)
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
      { id: 'default', name: '기본', description: '다이얼로그 기본 상태 (Select 닫힘)', props: {} },
      { id: 'expanded', name: '사유 선택 펼침', description: '모든 비활성화 사유 옵션 표시 (Badge 색상 포함)', props: {} },
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

      // empty 상태
      if (variant?.id === 'empty') {
        return (
          <div className="w-[450px]">
            <ProductSelector products={[]} selectedProductId={null} onProductSelect={() => {}} />
          </div>
        );
      }

      // expanded 상태 (아코디언 펼침 시뮬레이션)
      if (variant?.id === 'expanded') {
        // 제품군별 그룹화
        const grouped = mockProducts.reduce((acc, p) => {
          const group = acc[p.name] ?? [];
          group.push(p);
          acc[p.name] = group;
          return acc;
        }, {} as Record<string, Product[]>);

        return (
          <Card className="w-[450px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">제품 선택</CardTitle>
              <p className="text-sm text-muted-foreground">제품군을 선택한 후 모델을 선택하세요</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 검색 입력 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="제품명 또는 모델명 검색..." className="pl-9" />
              </div>

              {/* 펼쳐진 아코디언 UI */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 -mr-2">
                {Object.entries(grouped).map(([productName, prods]) => (
                  <div key={productName} className="border rounded-lg px-3">
                    {/* Trigger (펼쳐진 상태 - ChevronDown) */}
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{productName}</span>
                        <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">
                          {prods.length}개
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                    {/* Content (항상 표시) */}
                    <div className="border-t pb-3">
                      <div className="grid grid-cols-2 gap-2 pt-3">
                        {prods.map((p) => (
                          <div
                            key={p.id}
                            className={cn(
                              'cursor-pointer rounded-lg border p-2.5 transition-all duration-200',
                              'hover:border-primary hover:shadow-sm',
                              selected === p.id && 'border-primary ring-2 ring-primary/20 bg-primary/5'
                            )}
                            onClick={() => setSelected(p.id)}
                          >
                            <div className="flex items-center gap-2">
                              {/* 원형 아이콘 선택 인디케이터 */}
                              <div className={cn(
                                'rounded-full p-1 shrink-0 transition-colors',
                                selected === p.id
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-gray-100 text-gray-600'
                              )}>
                                {selected === p.id
                                  ? <Check className="h-3 w-3" />
                                  : <Package className="h-3 w-3" />}
                              </div>
                              {/* 텍스트 영역 */}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{p.model_name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  UDI: {p.udi_di}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 푸터 */}
              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                {Object.keys(grouped).length}개 제품군 · 총 {mockProducts.length}개 제품
              </div>
            </CardContent>
          </Card>
        );
      }

      // collapsed 상태 (기본 - 실제 컴포넌트 사용)
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
      { id: 'collapsed', name: '접힌 상태', description: '아코디언이 접힌 기본 상태', props: {} },
      { id: 'expanded', name: '펼쳐진 상태', description: '아코디언이 펼쳐져 ModelCard 표시', props: {} },
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

  'shipment-form-wrapper': {
    id: 'shipment-form-wrapper',
    name: 'ShipmentFormWrapper',
    category: 'forms',
    description: '출고 폼 클라이언트 래퍼 (Server Action을 클라이언트 호환 형태로 변환)',
    storybookPath: 'forms-shared-shipmentformwrapper',
    Component: function ShipmentFormWrapperDemo() {
      return (
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-sm">ShipmentFormWrapper</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Server Action을 SearchableCombobox 호환 형태로 변환하는 클라이언트 래퍼입니다.
              내부적으로 ShipmentForm을 렌더링합니다.
            </p>
            <div className="mt-4 p-3 bg-gray-50 rounded border text-xs font-mono">
              &lt;ShipmentFormWrapper<br />
              &nbsp;&nbsp;organizationType=&quot;MANUFACTURER&quot;<br />
              &nbsp;&nbsp;products=&#123;products&#125;<br />
              &nbsp;&nbsp;searchTargetsAction=&#123;searchTargets&#125;<br />
              &nbsp;&nbsp;onSubmit=&#123;handleSubmit&#125;<br />
              /&gt;
            </div>
          </CardContent>
        </Card>
      );
    },
    variants: [
      { id: 'default', name: '설명', description: '래퍼 역할 설명', props: {} },
    ],
    props: [
      { name: 'organizationType', type: 'OrganizationType', required: true, description: '조직 유형' },
      { name: 'products', type: 'ProductWithInventory[]', required: true, description: '제품 목록' },
      { name: 'onSubmit', type: 'function', required: true, description: '제출 핸들러' },
      { name: 'canSelectLot', type: 'boolean', required: false, description: 'Lot 선택 가능 여부' },
      { name: 'searchTargetsAction', type: 'function', required: true, description: '조직 검색 Server Action' },
    ],
  },

  'product-card': {
    id: 'product-card',
    name: 'ProductCard',
    category: 'shared',
    description: '제품 선택 카드 (출고/시술 시 제품 선택용)',
    storybookPath: 'shared-product-productcard',
    Component: function ProductCardDemo({ variant }: { variant?: ComponentVariant }) {
      const isSelected = variant?.id === 'selected';
      const isDisabled = variant?.id === 'disabled';
      return (
        <div className="w-[200px]">
          <ProductCard
            name="PDO Thread Alpha"
            modelName="PDO-100"
            additionalInfo="재고: 500개"
            isSelected={isSelected}
            disabled={isDisabled}
          />
        </div>
      );
    },
    variants: [
      { id: 'default', name: '기본', description: '선택 가능한 제품 카드', props: {} },
      { id: 'selected', name: '선택됨', description: '선택된 상태의 카드', props: {} },
      { id: 'disabled', name: '비활성', description: '재고 없음 등으로 비활성화된 카드', props: {} },
    ],
    props: [
      { name: 'name', type: 'string', required: true, description: '제품명' },
      { name: 'modelName', type: 'string', required: false, description: '모델명' },
      { name: 'additionalInfo', type: 'string', required: false, description: '추가 정보 (재고 등)' },
      { name: 'isSelected', type: 'boolean', required: false, description: '선택 상태' },
      { name: 'onClick', type: 'function', required: false, description: '클릭 핸들러' },
      { name: 'disabled', type: 'boolean', required: false, description: '비활성화 여부' },
    ],
  },

  'quantity-input-panel': {
    id: 'quantity-input-panel',
    name: 'QuantityInputPanel',
    category: 'shared',
    description: '수량 입력 패널 (출고/시술/폐기 공통)',
    storybookPath: 'shared-form-quantityinputpanel',
    Component: function QuantityInputPanelDemo() {
      return (
        <div className="w-[300px]">
          <QuantityInputPanel
            selectedProduct={{ productId: 'prod-1', displayName: 'PDO Thread Alpha' }}
            availableQuantity={500}
            quantity="10"
            onQuantityChange={() => {}}
            onAddToCart={() => {}}
          />
        </div>
      );
    },
    variants: [
      { id: 'default', name: '기본', description: '제품 선택 후 수량 입력', props: {} },
    ],
    props: [
      { name: 'selectedProduct', type: 'SelectedProductInfo | null', required: true, description: '선택된 제품 정보' },
      { name: 'availableQuantity', type: 'number', required: true, description: '가용 수량' },
      { name: 'quantity', type: 'string', required: true, description: '입력된 수량' },
      { name: 'onQuantityChange', type: 'function', required: true, description: '수량 변경 핸들러' },
      { name: 'onAddToCart', type: 'function', required: true, description: '장바구니 추가 핸들러' },
      { name: 'lotSelector', type: 'ReactNode', required: false, description: 'Lot 선택 UI (ShipmentForm용)' },
    ],
  },

  'history-page-wrapper': {
    id: 'history-page-wrapper',
    name: 'HistoryPageWrapper',
    category: 'shared',
    description: '거래 이력 페이지 래퍼 (필터 + 페이지네이션 + 테이블)',
    storybookPath: 'shared-page-historypageworker',
    Component: function HistoryPageWrapperDemo() {
      return (
        <Card className="w-[700px]">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              필터
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 필터 행 */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label className="text-xs">시작일</Label>
                <Button variant="outline" className="w-full justify-start text-sm mt-1">
                  <Calendar className="mr-2 h-4 w-4" />
                  2024.01.17
                </Button>
              </div>
              <div>
                <Label className="text-xs">종료일</Label>
                <Button variant="outline" className="w-full justify-start text-sm mt-1">
                  <Calendar className="mr-2 h-4 w-4" />
                  2024.01.20
                </Button>
              </div>
              <div>
                <Label className="text-xs">거래 유형</Label>
                <div className="mt-1 border rounded-md">
                  <div className="px-3 py-2 text-sm bg-gray-50 border-b flex items-center justify-between">
                    전체
                    <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="px-3 py-1.5 text-sm hover:bg-blue-50 cursor-pointer">전체</div>
                  <div className="px-3 py-1.5 text-sm hover:bg-blue-50 cursor-pointer">출고</div>
                  <div className="px-3 py-1.5 text-sm hover:bg-blue-50 cursor-pointer">생산</div>
                </div>
              </div>
              <div>
                <Label className="text-xs">대상</Label>
                <div className="mt-1 border rounded-md">
                  <div className="px-3 py-2 text-sm bg-gray-50 border-b flex items-center justify-between">
                    전체
                    <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="px-3 py-1.5 text-sm hover:bg-blue-50 cursor-pointer">전체</div>
                </div>
              </div>
            </div>
            {/* 달력 펼침 상태 표시 */}
            <div className="border rounded-md p-3 bg-white shadow-sm w-[220px]">
              <div className="flex justify-between items-center mb-2">
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">2024년 1월</span>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
                  <div key={d} className="text-muted-foreground p-1">
                    {d}
                  </div>
                ))}
                {/* 1월 달력 (1일이 월요일) */}
                <div className="p-1"></div>
                {Array.from({ length: 31 }, (_, i) => (
                  <div
                    key={i}
                    className={`p-1 rounded text-xs ${
                      i + 1 === 17
                        ? 'bg-blue-500 text-white'
                        : i + 1 === 20
                          ? 'bg-blue-100 text-blue-700'
                          : 'hover:bg-gray-100'
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    },
    variants: [
      { id: 'filter-expanded', name: '필터 펼침', description: '필터와 달력이 펼쳐진 상태', props: {} },
    ],
    props: [
      { name: 'currentOrgId', type: 'string', required: true, description: '현재 조직 ID' },
      { name: 'fetchHistoryCursor', type: 'function', required: true, description: '커서 기반 조회 함수' },
      { name: 'actionTypeOptions', type: 'ActionTypeOption[]', required: true, description: '액션 타입 옵션' },
      { name: 'showReturnButton', type: 'boolean', required: false, description: '반품 버튼 표시 여부' },
    ],
  },

  'inbox-table-wrapper': {
    id: 'inbox-table-wrapper',
    name: 'InboxTableWrapper',
    category: 'shared',
    description: '알림 보관함 테이블 래퍼 (필터 + 테이블)',
    storybookPath: 'pages-manufacturer-inboxtablewrapper',
    Component: function InboxTableWrapperDemo() {
      return (
        <Card className="w-[600px]">
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-start gap-6">
              {/* 상태 필터 - 펼쳐진 상태 */}
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">상태:</span>
                <div className="w-[120px] border rounded-md shadow-sm">
                  <div className="px-3 py-2 text-sm bg-gray-50 border-b flex items-center justify-between">
                    전체
                    <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 cursor-pointer">전체</div>
                  <div className="px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer">안읽음</div>
                  <div className="px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer">읽음</div>
                </div>
              </div>
              {/* 유형 필터 - 펼쳐진 상태 */}
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">유형:</span>
                <div className="w-[180px] border rounded-md shadow-sm">
                  <div className="px-3 py-2 text-sm bg-gray-50 border-b flex items-center justify-between">
                    전체
                    <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 cursor-pointer">전체</div>
                  <div className="px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer">비활성 제품 사용</div>
                  <div className="px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer">시스템 알림</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    },
    variants: [
      { id: 'filter-expanded', name: '필터 펼침', description: '드롭다운이 펼쳐진 상태', props: {} },
    ],
    props: [
      { name: 'page', type: 'number', required: true, description: '현재 페이지' },
      { name: 'isRead', type: 'boolean', required: false, description: '읽음 필터' },
      { name: 'alertType', type: 'string', required: false, description: '알림 유형 필터' },
    ],
  },

  'organization-alert-table': {
    id: 'organization-alert-table',
    name: 'OrganizationAlertTable',
    category: 'tables',
    description: '조직 알림 테이블',
    storybookPath: 'tables-shared-organizationalerttable',
    Component: function OrganizationAlertTableDemo({ variant }: { variant?: ComponentVariant }) {
      const isEmpty = variant?.id === 'empty';
      const alerts = [
        { type: 'INACTIVE_PRODUCT_USAGE', title: '비활성 제품 사용 알림', date: '2024.01.20 14:30', unread: true },
        { type: 'SYSTEM_NOTICE', title: '시스템 점검 안내', date: '2024.01.19 09:00', unread: false },
      ];
      return (
        <div className="w-[600px] border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"><Checkbox /></TableHead>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="w-[120px]">유형</TableHead>
                <TableHead>제목</TableHead>
                <TableHead className="w-[160px]">일시</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isEmpty ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    알림이 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                alerts.map((alert, i) => (
                  <TableRow key={i} className={alert.unread ? 'bg-blue-50/50' : ''}>
                    <TableCell><Checkbox /></TableCell>
                    <TableCell>{alert.unread && <Badge className="bg-blue-500 text-[10px]">NEW</Badge>}</TableCell>
                    <TableCell><Badge variant="outline">{alert.type === 'INACTIVE_PRODUCT_USAGE' ? '비활성 제품' : '시스템'}</Badge></TableCell>
                    <TableCell className={alert.unread ? 'font-semibold' : ''}>{alert.title}</TableCell>
                    <TableCell className="text-muted-foreground">{alert.date}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      );
    },
    variants: [
      { id: 'default', name: '알림 있음', description: '알림 목록 표시', props: {} },
      { id: 'empty', name: '알림 없음', description: '빈 상태', props: {} },
    ],
    props: [
      { name: 'data', type: 'PaginatedResponse<OrganizationAlert>', required: true, description: '페이지네이션된 알림 데이터' },
      { name: 'isLoading', type: 'boolean', required: true, description: '로딩 상태' },
      { name: 'onPageChange', type: 'function', required: true, description: '페이지 변경 핸들러' },
      { name: 'onMarkAsRead', type: 'function', required: false, description: '읽음 처리 핸들러' },
    ],
  },
};

/**
 * 제조사 페이지별 컴포넌트 매핑
 */
export const manufacturerPageComponents: Record<string, string[]> = {
  dashboard: ['page-header', 'stat-card', 'card'],
  products: ['page-header', 'products-table', 'product-form', 'product-deactivate-dialog', 'badge'],
  production: ['page-header', 'lot-form', 'product-selector'],
  shipment: ['page-header', 'shipment-form-wrapper', 'shipment-form', 'product-card', 'quantity-input-panel', 'cart-display', 'searchable-combobox'],
  inventory: ['page-header', 'inventory-table'],
  history: ['page-header', 'history-page-wrapper', 'transaction-history-table'],
  inbox: ['page-header', 'inbox-table-wrapper', 'organization-alert-table'],
  settings: ['page-header', 'manufacturer-settings-form'],
};
