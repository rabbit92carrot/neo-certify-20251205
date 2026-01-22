import type { ComponentShowcaseConfig, ComponentVariant } from '@/components/design-system/types';
import { StatCard } from '@/components/shared/StatCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { ProductCard } from '@/components/shared/ProductCard';
import { QuantityInputPanel } from '@/components/shared/QuantityInputPanel';
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
  Package,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Trash2,
  Search,
  Filter,
  Calendar,
  Plus,
  Copy,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronsUpDown,
  ArrowRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
} from 'lucide-react';
import { ShipmentForm } from '@/components/forms/ShipmentForm';
import type { SearchableComboboxOption } from '@/components/ui/searchable-combobox';
import type { Product, InventoryByLot } from '@/types/api.types';

/**
 * ShipmentForm용 ProductWithInventory 타입
 */
interface ProductWithInventory extends Product {
  availableQuantity: number;
  lots?: InventoryByLot[];
}

/**
 * 유통사 역할의 컴포넌트 카탈로그
 * 각 컴포넌트의 variants와 props 문서화
 */
export const distributorComponentCatalog: Record<string, ComponentShowcaseConfig> = {
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
              title="출고"
              description="병원 또는 유통사로 제품을 출고합니다."
              actions={<Button size="sm"><Plus className="h-4 w-4 mr-1" />새 출고</Button>}
            />
          </div>
        );
      }
      return (
        <div className="w-[600px]">
          <PageHeader
            title="재고 조회"
            description="보유 중인 제품의 재고 현황을 확인합니다."
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
        description: '유통사 대시보드 - 총 재고 현황',
        props: {
          title: '총 재고',
          value: '8,000',
          icon: Package,
        },
      },
      {
        id: 'today-received',
        name: '금일 입고',
        description: '유통사 대시보드 - 금일 입고량',
        props: {
          title: '금일 입고',
          value: '300',
          description: '전일 대비',
          trend: 10.5,
          icon: TrendingUp,
        },
      },
      {
        id: 'today-shipped',
        name: '금일 출고',
        description: '유통사 대시보드 - 금일 출고량',
        props: {
          title: '금일 출고',
          value: '150',
          description: '전일 대비',
          trend: -5.2,
          icon: TrendingDown,
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
      { id: 'inventory', name: '재고 현황', props: { title: '재고 현황', content: '총 8,000개 재고 보유' } },
      { id: 'received', name: '최근 입고', props: { title: '최근 입고', content: '오늘 5건 입고 완료' } },
      { id: 'shipped', name: '최근 출고', props: { title: '최근 출고', content: '오늘 3건 출고 완료' } },
    ],
    props: [
      { name: 'className', type: 'string', required: false, description: 'CSS 클래스' },
      { name: 'children', type: 'ReactNode', required: true, description: '카드 내용' },
    ],
  },

  'shipment-form': {
    id: 'shipment-form',
    name: 'ShipmentForm',
    category: 'forms',
    description: '출고 폼 (조직 검색 + 제품 선택 + 장바구니) - 유통사는 LOT 선택 불가',
    storybookPath: 'forms-shared-shipmentform',
    Component: function ShipmentFormDemo({ variant }: { variant?: ComponentVariant }) {
      // ProductWithInventory 타입에 맞는 mock 데이터 (LOT 정보 없음)
      const mockProducts: ProductWithInventory[] = [
        {
          id: 'prod-001',
          organization_id: 'org-distributor',
          name: 'PDO Thread COG 19G-100mm',
          model_name: 'PT-COG-19G-100',
          udi_di: 'UDI-001-COG-19G',
          is_active: true,
          created_at: '2024-01-05T00:00:00Z',
          updated_at: '2024-01-05T00:00:00Z',
          deactivated_at: null,
          deactivation_reason: null,
          deactivation_note: null,
          availableQuantity: 3000,
        },
        {
          id: 'prod-002',
          organization_id: 'org-distributor',
          name: 'PDO Thread MONO 23G-60mm',
          model_name: 'PT-MONO-23G-60',
          udi_di: 'UDI-002-MONO-23G',
          is_active: true,
          created_at: '2024-01-06T00:00:00Z',
          updated_at: '2024-01-06T00:00:00Z',
          deactivated_at: null,
          deactivation_reason: null,
          deactivation_note: null,
          availableQuantity: 2500,
        },
        {
          id: 'prod-003',
          organization_id: 'org-distributor',
          name: 'PDO Thread SCREW 21G-90mm',
          model_name: 'PT-SCREW-21G-90',
          udi_di: 'UDI-003-SCREW-21G',
          is_active: true,
          created_at: '2024-01-07T00:00:00Z',
          updated_at: '2024-01-07T00:00:00Z',
          deactivated_at: null,
          deactivation_reason: null,
          deactivation_note: null,
          availableQuantity: 2500,
        },
      ];

      // no-op async 핸들러 (Showcase용)
      const handleSearchOrganizations = async (_query: string): Promise<SearchableComboboxOption[]> => {
        return [];
      };

      const handleSubmit = async (): Promise<{ success: boolean; error?: { message: string } }> => {
        return { success: true };
      };

      // 빈 상태 variant
      if (variant?.id === 'empty') {
        return (
          <div className="w-full max-w-4xl">
            <ShipmentForm
              organizationType="DISTRIBUTOR"
              products={[]}
              onSearchOrganizations={handleSearchOrganizations}
              onSubmit={handleSubmit}
              canSelectLot={false}
            />
          </div>
        );
      }

      // 기본 (유통사 출고 - LOT 선택 불가)
      return (
        <div className="w-full max-w-4xl">
          <ShipmentForm
            organizationType="DISTRIBUTOR"
            products={mockProducts}
            onSearchOrganizations={handleSearchOrganizations}
            onSubmit={handleSubmit}
            canSelectLot={false}
          />
        </div>
      );
    },
    variants: [
      { id: 'default', name: '유통사 출고', description: '유통사 출고 폼 (LOT 선택 불가, FIFO 자동 적용)', props: {} },
      { id: 'empty', name: '재고 없음', description: '출고 가능 재고가 없는 상태', props: {} },
    ],
    props: [
      { name: 'organizationType', type: "'MANUFACTURER' | 'DISTRIBUTOR'", required: true, description: '조직 유형' },
      { name: 'products', type: 'ProductWithInventory[]', required: true, description: '출고 가능 제품 목록' },
      { name: 'onSearchOrganizations', type: '(query: string) => Promise<Option[]>', required: true, description: '조직 검색 핸들러' },
      { name: 'onSubmit', type: '(orgId, items) => Promise<Result>', required: true, description: '출고 제출 핸들러' },
      { name: 'canSelectLot', type: 'boolean', required: false, defaultValue: 'false', description: 'LOT 선택 가능 여부 (유통사는 항상 false)' },
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
    description: '검색 가능한 콤보박스 (병원/유통사 검색)',
    storybookPath: 'ui-selection-searchablecombobox',
    Component: function SearchableComboboxDemo() {
      return (
        <div className="w-[300px] space-y-2">
          <Label>수신처 선택</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input className="pl-9" placeholder="병원/유통사 검색..." defaultValue="강남피부과의원" />
          </div>
          <div className="border rounded-md p-2 space-y-1">
            <div className="px-2 py-1 bg-blue-50 rounded text-sm">강남피부과의원</div>
            <div className="px-2 py-1 hover:bg-gray-50 rounded text-sm cursor-pointer">서울성형외과</div>
            <div className="px-2 py-1 hover:bg-gray-50 rounded text-sm cursor-pointer">(주)의료기기유통</div>
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

  'inventory-table': {
    id: 'inventory-table',
    name: 'InventoryTable',
    category: 'tables',
    description: '재고 현황 테이블 (Card 아코디언 스타일, 클릭 시 Lot 상세 확장)',
    storybookPath: 'tables-shared-inventorytable',
    Component: function InventoryTableDemo({ variant }: { variant?: ComponentVariant }) {
      const isEmpty = variant?.id === 'empty';
      const isExpanded = variant?.id === 'expanded';

      // Mock 제품 데이터 (Lot 정보 포함)
      const products = [
        {
          name: 'PDO Thread COG 19G-100mm',
          model: 'PT-COG-19G-100',
          udi: 'UDI-001-COG-19G',
          total: 3000,
          lots: [
            { id: 'lot-1', lotNumber: 'LOT-2024-001', mfgDate: '2024.01.05', expiryDate: '2026.01.05', qty: 1500 },
            { id: 'lot-2', lotNumber: 'LOT-2024-002', mfgDate: '2024.01.10', expiryDate: '2026.01.10', qty: 1500 },
          ],
        },
        {
          name: 'PDO Thread MONO 23G-60mm',
          model: 'PT-MONO-23G-60',
          udi: 'UDI-002-MONO-23G',
          total: 2500,
          lots: [
            { id: 'lot-3', lotNumber: 'LOT-2024-003', mfgDate: '2024.01.12', expiryDate: '2026.01.12', qty: 2500 },
          ],
        },
        {
          name: 'PDO Thread SCREW 21G-90mm',
          model: 'PT-SCREW-21G-90',
          udi: 'UDI-003-SCREW-21G',
          total: 2500,
          lots: [
            { id: 'lot-4', lotNumber: 'LOT-2024-004', mfgDate: '2024.01.15', expiryDate: '2026.01.15', qty: 2500 },
          ],
        },
      ];

      // 빈 상태
      if (isEmpty) {
        return (
          <div className="w-[600px] flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">재고가 없습니다</p>
            <p className="text-sm">보유 중인 제품이 없습니다.</p>
          </div>
        );
      }

      return (
        <div className="w-[600px] space-y-3">
          {products.map((product, i) => (
            <Card key={i}>
              <CardHeader className="cursor-pointer py-3">
                <div className="flex items-center gap-3">
                  {/* 확장/축소 아이콘 */}
                  {isExpanded && i === 0 ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
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

              {/* 확장 시 Lot 상세 테이블 */}
              {isExpanded && i === 0 && (
                <CardContent className="pt-0 border-t">
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
                      {product.lots.map((lot) => (
                        <TableRow key={lot.id}>
                          <TableCell className="font-mono text-sm">{lot.lotNumber}</TableCell>
                          <TableCell>{lot.mfgDate}</TableCell>
                          <TableCell>{lot.expiryDate}</TableCell>
                          <TableCell className="text-right">{lot.qty.toLocaleString()}개</TableCell>
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
      { name: 'inventory', type: 'InventoryItem[]', required: true, description: '재고 목록' },
      { name: 'onItemClick', type: '(item) => void', required: false, description: '아이템 클릭 핸들러' },
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

      // 유통사 거래 유형별 아이콘/색상 헬퍼
      const getTypeIcon = (type: string): React.ReactNode => {
        switch (type) {
          case '입고':
            return <ArrowDownToLine className="h-4 w-4" />;
          case '출고':
            return <ArrowUpFromLine className="h-4 w-4" />;
          case '반품입고':
          case '반품출고':
            return <RotateCcw className="h-4 w-4" />;
          default:
            return <Package className="h-4 w-4" />;
        }
      };

      const getTypeBadgeVariant = (type: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
        switch (type) {
          case '입고':
            return 'default';
          case '출고':
            return 'secondary';
          case '반품입고':
            return 'outline';
          case '반품출고':
            return 'destructive';
          default:
            return 'outline';
        }
      };

      // Mock 거래 데이터
      const transactions = [
        {
          id: 'tx-1',
          type: '입고',
          from: '(주)네오스레드',
          to: '(주)의료기기유통',
          totalQty: 100,
          date: '2024.01.15 14:30',
          products: [
            { id: 'p1', name: 'PDO Thread COG 19G-100mm', qty: 60, codes: ['NC-00001234', 'NC-00001235', 'NC-00001236'] },
            { id: 'p2', name: 'PDO Thread MONO 23G-60mm', qty: 40, codes: ['NC-00002001', 'NC-00002002'] },
          ],
        },
        {
          id: 'tx-2',
          type: '출고',
          from: '(주)의료기기유통',
          to: '강남피부과의원',
          totalQty: 50,
          date: '2024.01.16 09:00',
          products: [
            { id: 'p1', name: 'PDO Thread COG 19G-100mm', qty: 30, codes: ['NC-00001234', 'NC-00001235'] },
            { id: 'p2', name: 'PDO Thread SCREW 21G-90mm', qty: 20, codes: ['NC-00003001'] },
          ],
        },
        {
          id: 'tx-3',
          type: '반품입고',
          from: '서울성형외과',
          to: '(주)의료기기유통',
          totalQty: 10,
          date: '2024.01.17 11:20',
          products: [
            { id: 'p1', name: 'PDO Thread MONO 23G-60mm', qty: 10, codes: ['NC-00002003'] },
          ],
        },
      ];

      // 빈 상태
      if (isEmpty) {
        return (
          <div className="w-[600px] flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">거래 이력이 없습니다</p>
            <p className="text-sm">조회된 거래 이력이 없습니다.</p>
          </div>
        );
      }

      return (
        <div className="w-[600px] space-y-3">
          {transactions.map((tx, i) => (
            <Card key={tx.id} className={tx.type.includes('반품') ? 'border-red-200 bg-red-50/50' : ''}>
              <CardHeader className="cursor-pointer py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* 확장/축소 아이콘 */}
                    {isExpanded && i === 0 ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    {getTypeIcon(tx.type)}
                    <Badge variant={getTypeBadgeVariant(tx.type)}>{tx.type}</Badge>
                    <span className="text-sm text-muted-foreground">{tx.date}</span>
                  </div>
                  <Badge variant="outline">{tx.totalQty}개</Badge>
                </div>

                {/* From → To 표시 */}
                <div className="flex items-center gap-2 mt-2 ml-7 text-sm">
                  <span>{tx.from}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span>{tx.to}</span>
                </div>
              </CardHeader>

              {/* 확장 시 제품 목록 */}
              {isExpanded && i === 0 && (
                <CardContent className="pt-0 border-t">
                  <div className="space-y-2 mt-3">
                    {tx.products.map((product) => (
                      <div key={product.id} className="p-2 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{product.name}</span>
                          </div>
                          <Badge variant="secondary">{product.qty}개</Badge>
                        </div>
                        {/* 코드 목록 */}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {product.codes.map((code, ci) => (
                            <span
                              key={ci}
                              className="px-2 py-0.5 bg-white border rounded text-xs font-mono cursor-pointer hover:bg-gray-50"
                            >
                              {code}
                            </span>
                          ))}
                          {product.codes.length < product.qty && (
                            <span className="px-2 py-0.5 text-xs text-muted-foreground">
                              외 {product.qty - product.codes.length}건
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 반품 버튼 (입고 타입인 경우) */}
                  {tx.type === '입고' && (
                    <div className="mt-3 flex justify-end">
                      <Button variant="outline" size="sm">
                        <RotateCcw className="h-4 w-4 mr-1" />
                        반품
                      </Button>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      );
    },
    variants: [
      { id: 'default', name: '기본', description: '접힌 상태의 Card 목록', props: {} },
      { id: 'expanded', name: '제품 펼침', description: '제품 목록 및 코드 표시', props: {} },
      { id: 'empty', name: '빈 상태', description: '거래 이력 없음', props: {} },
    ],
    props: [
      { name: 'history', type: 'Transaction[]', required: true, description: '거래 이력' },
      { name: 'hasMore', type: 'boolean', required: false, description: '추가 데이터 여부' },
      { name: 'onLoadMore', type: '() => void', required: false, description: '더 로드 핸들러' },
      { name: 'showReturnButton', type: 'boolean', required: false, description: '반품 버튼 표시 여부' },
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
              유통사의 경우 canSelectLot=false로 설정되어 FIFO 자동 적용됩니다.
            </p>
            <div className="mt-4 p-3 bg-gray-50 rounded border text-xs font-mono">
              &lt;ShipmentFormWrapper<br />
              &nbsp;&nbsp;organizationType=&quot;DISTRIBUTOR&quot;<br />
              &nbsp;&nbsp;products=&#123;products&#125;<br />
              &nbsp;&nbsp;canSelectLot=&#123;false&#125;<br />
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
      { name: 'canSelectLot', type: 'boolean', required: false, description: 'Lot 선택 가능 여부 (유통사는 false)' },
      { name: 'searchTargetsAction', type: 'function', required: true, description: '조직 검색 Server Action' },
    ],
  },

  'product-card': {
    id: 'product-card',
    name: 'ProductCard',
    category: 'shared',
    description: '제품 선택 카드 (출고 시 제품 선택용)',
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
    description: '수량 입력 패널 (출고 공통)',
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
                  <div className="px-3 py-1.5 text-sm hover:bg-blue-50 cursor-pointer">입고</div>
                  <div className="px-3 py-1.5 text-sm hover:bg-blue-50 cursor-pointer">출고</div>
                  <div className="px-3 py-1.5 text-sm hover:bg-blue-50 cursor-pointer">반품</div>
                </div>
              </div>
              <div>
                <Label className="text-xs">거래처</Label>
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

  'code-list-display': {
    id: 'code-list-display',
    name: 'CodeListDisplay',
    category: 'shared',
    description: '코드 목록 표시 (클릭하여 복사, 페이지네이션)',
    storybookPath: 'shared-display-codelistdisplay',
    Component: function CodeListDisplayDemo({ variant }: { variant?: ComponentVariant }) {
      const isEmpty = variant?.id === 'empty';
      const codes = isEmpty
        ? []
        : Array.from({ length: 25 }, (_, i) => `NC-${String(10000000 + i).slice(1)}`);
      return (
        <Card className="w-[400px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">코드 목록 ({codes.length}개)</CardTitle>
          </CardHeader>
          <CardContent>
            {isEmpty ? (
              <p className="text-center text-gray-500 py-4">코드가 없습니다</p>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto">
                  {codes.slice(0, 20).map((code, i) => (
                    <div
                      key={i}
                      className="px-2 py-1 bg-gray-50 rounded text-xs font-mono cursor-pointer hover:bg-gray-100 flex items-center gap-1"
                    >
                      {code}
                      <Copy className="h-3 w-3 text-gray-400" />
                    </div>
                  ))}
                </div>
                {codes.length > 20 && (
                  <div className="flex justify-center gap-1 mt-3">
                    <Button variant="outline" size="sm" disabled>이전</Button>
                    <Button variant="outline" size="sm">다음</Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      );
    },
    variants: [
      { id: 'default', name: '코드 목록', description: '코드 그리드 표시', props: {} },
      { id: 'empty', name: '빈 목록', description: '코드 없음 상태', props: {} },
    ],
    props: [
      { name: 'codes', type: 'string[]', required: true, description: '코드 배열' },
      { name: 'pageSize', type: 'number', required: false, defaultValue: '20', description: '페이지당 코드 수' },
    ],
  },
};

/**
 * 유통사 페이지별 컴포넌트 매핑
 */
export const distributorPageComponents: Record<string, string[]> = {
  dashboard: ['page-header', 'stat-card', 'card'],
  shipment: ['page-header', 'shipment-form-wrapper', 'shipment-form', 'product-card', 'quantity-input-panel', 'cart-display', 'searchable-combobox'],
  inventory: ['page-header', 'inventory-table'],
  history: ['page-header', 'history-page-wrapper', 'transaction-history-table', 'code-list-display'],
};
