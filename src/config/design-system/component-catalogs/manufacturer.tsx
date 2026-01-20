import type { ComponentShowcaseConfig } from '@/components/design-system/types';
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
  Settings,
} from 'lucide-react';

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
    storybookPath: 'shared-statcard',
    Component: StatCard,
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
    storybookPath: 'ui-badge',
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
    storybookPath: 'ui-card',
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
    Component: function ProductsTableDemo({ variant }: { variant?: string }) {
      const products = [
        { id: '1', name: 'PT-COG-19G-100', status: '활성', date: '2024.01.05' },
        { id: '2', name: 'PT-MONO-23G-60', status: '활성', date: '2024.01.06' },
        { id: '3', name: 'PT-BARB-19G-150', status: '비활성', date: '2023.12.01' },
      ];
      const isEmpty = variant === 'empty';
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
    Component: function CartDisplayDemo({ variant }: { variant?: string }) {
      const isEmpty = variant === 'empty';
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
    Component: function DataTableDemo({ variant }: { variant?: string }) {
      const isLoading = variant === 'loading';
      const isEmpty = variant === 'empty';
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
    Component: function InventoryTableDemo() {
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
              {items.map((item) => (
                <TableRow key={item.product}>
                  <TableCell className="font-medium">{item.product}</TableCell>
                  <TableCell className="text-right">{item.total.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-green-600">{item.available.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-orange-600">{item.reserved.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    },
    variants: [
      { id: 'default', name: '기본', description: '재고 목록 표시', props: {} },
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
    Component: function TransactionHistoryTableDemo() {
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
              {items.map((item, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Badge variant={item.type === '출고' ? 'default' : 'secondary'}>{item.type}</Badge>
                  </TableCell>
                  <TableCell>{item.target}</TableCell>
                  <TableCell className="text-right">{item.quantity}개</TableCell>
                  <TableCell className="text-gray-500 text-sm">{item.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    },
    variants: [
      { id: 'default', name: '기본', description: '거래 이력 표시', props: {} },
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
    Component: function NotificationListDemo({ variant }: { variant?: string }) {
      const isEmpty = variant === 'empty';
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

  'settings-form': {
    id: 'settings-form',
    name: 'SettingsForm',
    category: 'forms',
    description: '환경 설정 폼',
    Component: function SettingsFormDemo() {
      return (
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" />
              환경 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>LOT 번호 접두어</Label>
              <Input defaultValue="LOT" />
            </div>
            <div className="space-y-2">
              <Label>기본 유효기간 (일)</Label>
              <Input type="number" defaultValue="365" />
            </div>
            <div className="space-y-2">
              <Label>재고 알림 임계값</Label>
              <Input type="number" defaultValue="100" />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">저장</Button>
          </CardFooter>
        </Card>
      );
    },
    variants: [
      { id: 'default', name: '기본', description: '설정 폼', props: {} },
    ],
    props: [
      { name: 'settings', type: 'Settings', required: false, description: '현재 설정 값' },
      { name: 'onSave', type: '(settings) => void', required: true, description: '저장 핸들러' },
    ],
  },
};

/**
 * 제조사 페이지별 컴포넌트 매핑
 */
export const manufacturerPageComponents: Record<string, string[]> = {
  dashboard: ['stat-card', 'card'],
  products: ['products-table', 'product-form', 'badge'],
  production: ['lot-form'],
  shipment: ['cart-display', 'searchable-combobox'],
  inventory: ['inventory-table', 'data-table'],
  history: ['transaction-history-table'],
  inbox: ['notification-list'],
  settings: ['settings-form'],
};
