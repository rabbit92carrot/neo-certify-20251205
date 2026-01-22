import { useMemo } from 'react';
import type { ComponentShowcaseConfig, ComponentVariant } from '@/components/design-system/types';
import { cn } from '@/lib/utils';
import { StatCard } from '@/components/shared/StatCard';
import { ProductCard } from '@/components/shared/ProductCard';
import { QuantityInputPanel } from '@/components/shared/QuantityInputPanel';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from '@/components/ui/command';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  Stethoscope,
  Users,
  Phone,
  Calendar,
  Trash2,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  AlertTriangle,
  Search,
  User,
  Boxes,
  Filter,
  Check,
  ChevronsUpDown,
  ChevronLeft,
  Settings,
} from 'lucide-react';
import { VirtualDataTable, type VirtualColumnDef } from '@/components/shared/VirtualDataTable';

/**
 * 병원 역할의 컴포넌트 카탈로그
 * 각 컴포넌트의 variants와 props 문서화
 */
export const hospitalComponentCatalog: Record<string, ComponentShowcaseConfig> = {
  // ===== Dashboard Components =====
  'stat-card': {
    id: 'stat-card',
    name: 'StatCard',
    category: 'shared',
    description: '대시보드에서 주요 통계를 표시하는 카드',
    storybookPath: 'shared-statistics-statcard',
    Component: function StatCardDemo({
      title,
      value,
      icon: Icon,
      description,
      trend,
      isLoading,
    }: {
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
        name: '총 재고량',
        description: '병원 대시보드 - 총 재고 현황',
        props: {
          title: '총 재고량',
          value: '2,500',
          icon: Package,
        },
      },
      {
        id: 'today-treatment',
        name: '오늘 시술',
        description: '병원 대시보드 - 오늘 시술 건수',
        props: {
          title: '오늘 시술',
          value: '12',
          description: '전일 대비',
          trend: 15.5,
          icon: Stethoscope,
        },
      },
      {
        id: 'total-patients',
        name: '총 환자 수',
        description: '병원 대시보드 - 총 환자 수',
        props: {
          title: '총 환자 수',
          value: '156',
          icon: Users,
        },
      },
    ],
    props: [
      { name: 'title', type: 'string', required: true, description: '통계 제목' },
      { name: 'value', type: 'string | number', required: true, description: '통계 값' },
      { name: 'icon', type: 'LucideIcon', required: false, description: '아이콘 컴포넌트' },
      { name: 'description', type: 'string', required: false, description: '부가 설명' },
      { name: 'trend', type: 'number', required: false, description: '트렌드 (%)' },
      {
        name: 'isLoading',
        type: 'boolean',
        required: false,
        defaultValue: 'false',
        description: '로딩 상태',
      },
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
        <Card className="w-[320px]">
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
      {
        id: 'welcome',
        name: '환영 메시지',
        props: {
          title: '환영합니다, 강남의료센터님',
          content: '오늘도 좋은 하루 되세요. 최근 활동 현황을 확인해보세요.',
        },
      },
      {
        id: 'inventory',
        name: '재고 현황',
        props: { title: '재고 현황', content: '총 2,500개 재고 보유' },
      },
    ],
    props: [
      { name: 'className', type: 'string', required: false, description: 'CSS 클래스' },
      { name: 'children', type: 'ReactNode', required: true, description: '카드 내용' },
    ],
  },

  // ===== Treatment Components =====
  'patient-search': {
    id: 'patient-search',
    name: 'PatientSearch',
    category: 'forms',
    description: '환자 전화번호 검색 (Command 기반 자동완성)',
    Component: function PatientSearchDemo({ variant }: { variant?: ComponentVariant }) {
      const isExpanded = variant?.id === 'expanded';
      const hasResults = variant?.id === 'with-suggestions';
      const noResults = variant?.id === 'no-results';

      if (isExpanded || hasResults || noResults) {
        return (
          <div className="w-[320px] space-y-2">
            <Label className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              환자 전화번호
            </Label>
            {/* Trigger (선택된 값 또는 검색 안내) */}
            <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm flex items-center justify-between">
              <span className="text-muted-foreground">010-1234-5678</span>
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </div>
            {/* 펼쳐진 Command */}
            <div className="border rounded-md shadow-md">
              <Command className="rounded-lg">
                <CommandInput placeholder="전화번호 입력 (숫자만)..." />
                <CommandList>
                  {noResults ? (
                    <CommandEmpty>
                      <div className="py-4 text-center">
                        <p className="text-sm text-muted-foreground">기존 환자 기록이 없습니다</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          새 환자로 자동 등록됩니다
                        </p>
                      </div>
                    </CommandEmpty>
                  ) : (
                    <CommandGroup heading="기존 환자">
                      <CommandItem className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        <User className="h-4 w-4 text-gray-400" />
                        <span>010-1234-5678</span>
                        <span className="text-xs text-muted-foreground">(최근 시술: 2024-01-15)</span>
                      </CommandItem>
                      <CommandItem className="flex items-center gap-2">
                        <Check className="h-4 w-4 opacity-0" />
                        <User className="h-4 w-4 text-gray-400" />
                        <span>010-9876-5432</span>
                        <span className="text-xs text-muted-foreground">(최근 시술: 2024-01-10)</span>
                      </CommandItem>
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </div>
          </div>
        );
      }

      // 기본 상태 (입력 대기)
      return (
        <div className="w-[320px] space-y-2">
          <Label className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            환자 전화번호
          </Label>
          <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm flex items-center justify-between cursor-pointer hover:border-primary/50">
            <span className="text-muted-foreground">전화번호를 입력하세요</span>
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </div>
      );
    },
    variants: [
      { id: 'default', name: '기본', description: '전화번호 입력 대기 상태', props: {} },
      { id: 'expanded', name: '검색 펼침', description: 'Command List가 펼쳐진 상태', props: {} },
      {
        id: 'with-suggestions',
        name: '기존 환자',
        description: '기존 환자 목록이 표시된 상태',
        props: {},
      },
      {
        id: 'no-results',
        name: '결과 없음',
        description: '새 환자로 등록되는 상태',
        props: {},
      },
    ],
    props: [
      { name: 'value', type: 'string', required: true, description: '입력된 전화번호' },
      { name: 'onSelect', type: 'function', required: true, description: '환자 선택 핸들러' },
      { name: 'onSearch', type: 'function', required: true, description: '검색 핸들러' },
    ],
  },

  'treatment-form': {
    id: 'treatment-form',
    name: 'TreatmentForm',
    category: 'forms',
    description: '환자 시술 등록 폼 (3열 레이아웃: 환자정보 + 제품선택 + 장바구니)',
    Component: function TreatmentFormDemo({ variant }: { variant?: ComponentVariant }) {
      const showFullLayout = variant?.id === 'full-layout';
      const showProductSelected = variant?.id === 'product-selected';
      const showCartFilled = variant?.id === 'cart-filled';

      if (showFullLayout || showProductSelected || showCartFilled) {
        const selectedProduct = showProductSelected || showCartFilled;
        return (
          <div className="w-full max-w-4xl">
            <div className="grid grid-cols-3 gap-4">
              {/* 왼쪽 영역 (2열) */}
              <div className="col-span-2 space-y-4">
                {/* 환자 정보 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">환자 정보</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>환자 전화번호</Label>
                        <Input value="010-1234-5678" readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label>시술일</Label>
                        <Input type="date" defaultValue="2024-01-20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {/* 제품 선택 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">제품 선택</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      <ProductCard
                        name="볼 리프팅"
                        modelName="PDO-COG-100"
                        additionalInfo="재고: 500개"
                        isSelected={selectedProduct}
                      />
                      <ProductCard
                        name="이마 리프팅"
                        modelName="PDO-MONO-60"
                        additionalInfo="재고: 300개"
                      />
                      <ProductCard
                        name="턱선 리프팅"
                        modelName="PDO-SCREW-90"
                        additionalInfo="재고: 200개"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
              {/* 오른쪽 영역 (1열) */}
              <div className="space-y-4">
                <QuantityInputPanel
                  selectedProduct={
                    selectedProduct
                      ? { productId: 'prod-1', displayName: '볼 리프팅' }
                      : null
                  }
                  availableQuantity={500}
                  quantity={showCartFilled ? '10' : ''}
                  onQuantityChange={() => {}}
                  onAddToCart={() => {}}
                />
                {/* 장바구니 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      시술 목록
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {showCartFilled ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between py-2 border-b">
                          <span className="text-sm">볼 리프팅</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">10개</Badge>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-4 text-sm">
                        제품을 선택하고 수량을 입력하세요
                      </p>
                    )}
                  </CardContent>
                  {showCartFilled && (
                    <CardFooter>
                      <Button className="w-full">시술 등록</Button>
                    </CardFooter>
                  )}
                </Card>
              </div>
            </div>
          </div>
        );
      }

      // 개요
      return (
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-sm">TreatmentForm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              시술 등록 폼은 3열 레이아웃으로 구성됩니다.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span>왼쪽 (2열): 환자 정보 + 제품 선택</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span>오른쪽 (1열): 수량 입력 + 장바구니</span>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    },
    variants: [
      { id: 'default', name: '개요', description: '폼 구조 요약', props: {} },
      { id: 'full-layout', name: '전체 레이아웃', description: '3열 레이아웃 표시', props: {} },
      { id: 'product-selected', name: '제품 선택됨', description: '제품이 선택된 상태', props: {} },
      { id: 'cart-filled', name: '장바구니 채워짐', description: '장바구니에 항목이 있는 상태', props: {} },
    ],
    props: [
      {
        name: 'products',
        type: 'ProductForTreatment[]',
        required: true,
        description: '시술 가능한 제품 목록',
      },
      { name: 'onSubmit', type: 'function', required: true, description: '시술 등록 액션' },
    ],
  },

  'cart-display': {
    id: 'cart-display',
    name: 'CartDisplay',
    category: 'shared',
    description: '시술/폐기 장바구니 표시',
    storybookPath: 'shared-cart-cartdisplay',
    Component: function CartDisplayDemo({ variant }: { variant?: ComponentVariant }) {
      const isEmpty = variant?.id === 'empty';
      const isDisposal = variant?.id === 'disposal';
      const items = [
        { name: '볼 리프팅', quantity: 10 },
        { name: '이마 리프팅', quantity: 5 },
      ];
      return (
        <Card className="w-[320px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {isDisposal ? <Trash2 className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
              {isDisposal ? '폐기 목록' : '시술 목록'}
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
              <Button className="w-full" variant={isDisposal ? 'destructive' : 'default'}>
                {isDisposal ? '폐기 등록' : '시술 등록'}
              </Button>
            </CardFooter>
          )}
        </Card>
      );
    },
    variants: [
      {
        id: 'treatment',
        name: '시술 장바구니',
        description: '시술용 장바구니 (아이템 있음)',
        props: {},
      },
      { id: 'disposal', name: '폐기 장바구니', description: '폐기용 장바구니', props: {} },
      { id: 'empty', name: '비어있음', description: '빈 장바구니', props: {} },
    ],
    props: [
      { name: 'items', type: 'CartItem[]', required: true, description: '장바구니 아이템' },
      {
        name: 'onUpdateQuantity',
        type: 'function',
        required: true,
        description: '수량 변경 핸들러',
      },
      { name: 'onRemove', type: 'function', required: true, description: '삭제 핸들러' },
      { name: 'onConfirm', type: 'function', required: false, description: '확인 핸들러' },
    ],
  },

  // ===== Treatment History Components =====
  'treatment-history-table': {
    id: 'treatment-history-table',
    name: 'TreatmentHistoryTable',
    category: 'tables',
    description: '시술 이력 테이블 (Accordion 스타일 카드)',
    Component: function TreatmentHistoryTableDemo({ variant }: { variant?: ComponentVariant }) {
      const isEmpty = variant?.id === 'empty';
      const isExpanded = variant?.id === 'expanded';
      const hasRecall = variant?.id === 'with-recall';

      if (isEmpty) {
        return (
          <div className="w-[600px] p-8 text-center text-gray-500 border rounded-lg">
            <Stethoscope className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>시술 이력이 없습니다</p>
          </div>
        );
      }

      const records = [
        {
          phone: '010-****-5678',
          date: '2024년 1월 20일',
          products: '볼 리프팅 외 1종',
          quantity: 15,
          canRecall: hasRecall,
        },
        {
          phone: '010-****-1234',
          date: '2024년 1월 19일',
          products: '이마 리프팅',
          quantity: 5,
          canRecall: false,
        },
      ];

      return (
        <div className="w-[600px] space-y-3">
          {records.map((record, i) => (
            <Card key={i}>
              <CardHeader className="cursor-pointer py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isExpanded && i === 0 ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{record.phone}</span>
                    <span className="text-sm text-muted-foreground">{record.date}</span>
                    <Badge variant="outline">
                      {record.products} / {record.quantity}개
                    </Badge>
                  </div>
                  {record.canRecall ? (
                    <Button variant="outline" size="sm" className="text-orange-600">
                      <RotateCcw className="h-3 w-3 mr-1" />
                      회수
                    </Button>
                  ) : (
                    <Badge variant="secondary">회수 불가</Badge>
                  )}
                </div>
              </CardHeader>
              {isExpanded && i === 0 && (
                <CardContent className="pt-0 border-t">
                  <div className="grid grid-cols-2 gap-4 py-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">볼 리프팅 (PDO-COG-100)</span>
                        <Badge variant="outline">10개</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">이마 리프팅 (PDO-MONO-60)</span>
                        <Badge variant="outline">5개</Badge>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>환자: {record.phone}</p>
                      <p>시술일: {record.date}</p>
                      <p>등록일: 2024-01-20 14:30</p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      );
    },
    variants: [
      { id: 'default', name: '기본', description: '시술 기록 목록 표시', props: {} },
      { id: 'expanded', name: '카드 펼침', description: '상세 정보가 펼쳐진 상태', props: {} },
      { id: 'with-recall', name: '회수 가능', description: '24시간 이내 회수 가능 상태', props: {} },
      { id: 'empty', name: '빈 상태', description: '시술 이력 없음', props: {} },
    ],
    props: [
      {
        name: 'treatments',
        type: 'TreatmentRecordSummary[]',
        required: true,
        description: '시술 기록 목록',
      },
      { name: 'onRecall', type: 'function', required: false, description: '회수 액션' },
    ],
  },

  'treatment-recall-dialog': {
    id: 'treatment-recall-dialog',
    name: 'TreatmentRecallDialog',
    category: 'forms',
    description: '시술 회수 확인 다이얼로그 (Card 형태로 표시)',
    Component: function TreatmentRecallDialogDemo({ variant }: { variant?: ComponentVariant }) {
      const hasReason = variant?.id === 'with-reason';
      return (
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-orange-500" />
              시술 회수
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 환자 정보 */}
            <div className="p-3 bg-yellow-50 rounded-lg text-sm">
              <p className="font-medium">환자: 010-****-5678</p>
              <p className="text-muted-foreground">시술일: 2024년 1월 20일</p>
              <p className="text-muted-foreground">볼 리프팅 외 1종 / 15개</p>
            </div>
            {/* 경고 */}
            <div className="p-3 bg-red-50 rounded-lg flex items-start gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-700">주의</p>
                <p className="text-red-600">회수하면 해당 시술 기록이 취소됩니다.</p>
              </div>
            </div>
            {/* 사유 입력 */}
            <div className="space-y-2">
              <Label>회수 사유 (필수)</Label>
              <Textarea
                placeholder="회수 사유를 입력하세요..."
                value={hasReason ? '환자 요청으로 인한 시술 취소' : ''}
                readOnly
              />
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" className="flex-1">
              취소
            </Button>
            <Button variant="destructive" className="flex-1" disabled={!hasReason}>
              회수하기
            </Button>
          </CardFooter>
        </Card>
      );
    },
    variants: [
      { id: 'default', name: '기본', description: '회수 사유 입력 대기', props: {} },
      { id: 'with-reason', name: '사유 입력됨', description: '사유가 입력된 상태', props: {} },
    ],
    props: [
      {
        name: 'treatment',
        type: 'TreatmentRecordSummary',
        required: true,
        description: '회수할 시술 정보',
      },
      { name: 'onConfirm', type: 'function', required: true, description: '회수 확인 핸들러' },
      { name: 'onCancel', type: 'function', required: true, description: '취소 핸들러' },
    ],
  },

  // ===== Disposal Components =====
  'disposal-reason-select': {
    id: 'disposal-reason-select',
    name: 'DisposalReasonSelect',
    category: 'forms',
    description: '폐기 사유 선택 (Select/Command 컴포넌트)',
    Component: function DisposalReasonSelectDemo({ variant }: { variant?: ComponentVariant }) {
      const isExpanded = variant?.id === 'expanded';

      if (isExpanded) {
        return (
          <div className="w-[300px] space-y-2">
            <Label>폐기 사유</Label>
            {/* Trigger */}
            <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm flex items-center justify-between">
              <span>손실</span>
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </div>
            {/* 펼쳐진 옵션 */}
            <div className="border rounded-md shadow-md">
              <Command className="rounded-lg">
                <CommandList>
                  <CommandGroup>
                    <CommandItem className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      <span>손실</span>
                      <span className="text-xs text-muted-foreground">(분실, 파손 등)</span>
                    </CommandItem>
                    <CommandItem className="flex items-center gap-2">
                      <Check className="h-4 w-4 opacity-0" />
                      <span>만료</span>
                      <span className="text-xs text-muted-foreground">(유효기한 경과)</span>
                    </CommandItem>
                    <CommandItem className="flex items-center gap-2">
                      <Check className="h-4 w-4 opacity-0" />
                      <span>불량</span>
                      <span className="text-xs text-muted-foreground">(제품 결함)</span>
                    </CommandItem>
                    <CommandItem className="flex items-center gap-2">
                      <Check className="h-4 w-4 opacity-0" />
                      <span>기타</span>
                      <span className="text-xs text-muted-foreground">(상세 사유 입력 필요)</span>
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          </div>
        );
      }

      return (
        <div className="w-[300px] space-y-2">
          <Label>폐기 사유</Label>
          <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm flex items-center justify-between cursor-pointer hover:border-primary/50">
            <span className="text-muted-foreground">사유를 선택하세요</span>
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </div>
      );
    },
    variants: [
      { id: 'default', name: '닫힌 상태', description: 'Select 기본 상태', props: {} },
      { id: 'expanded', name: '펼쳐진 상태', description: '모든 옵션 표시', props: {} },
    ],
    props: [
      { name: 'value', type: 'string', required: true, description: '선택된 사유' },
      { name: 'onChange', type: 'function', required: true, description: '변경 핸들러' },
    ],
  },

  'disposal-form': {
    id: 'disposal-form',
    name: 'DisposalForm',
    category: 'forms',
    description: '제품 폐기 등록 폼 (3열 레이아웃)',
    Component: function DisposalFormDemo({ variant }: { variant?: ComponentVariant }) {
      const isOtherReason = variant?.id === 'other-reason';
      const showConfirm = variant?.id === 'confirm-dialog';

      if (showConfirm) {
        return (
          <Card className="w-[400px]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                폐기 등록 확인
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">폐기일:</span> 2024-01-20
                </p>
                <p>
                  <span className="text-muted-foreground">사유:</span> 만료
                </p>
                <p>
                  <span className="text-muted-foreground">총 수량:</span> 15개 (2종)
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-sm text-destructive">
                폐기 등록 후에는 취소가 불가능합니다.
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" className="flex-1">
                취소
              </Button>
              <Button variant="destructive" className="flex-1">
                폐기 등록
              </Button>
            </CardFooter>
          </Card>
        );
      }

      if (isOtherReason) {
        return (
          <Card className="w-[400px]">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                폐기 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>폐기일</Label>
                  <Input type="date" defaultValue="2024-01-20" />
                </div>
                <div className="space-y-2">
                  <Label>폐기 사유</Label>
                  <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    기타
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>상세 사유 (필수)</Label>
                <Textarea placeholder="폐기 사유를 상세히 입력하세요..." className="min-h-[80px]" />
                <p className="text-xs text-muted-foreground text-right">0 / 500</p>
              </div>
            </CardContent>
          </Card>
        );
      }

      // 개요
      return (
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-sm">DisposalForm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              폐기 등록 폼은 시술 등록과 유사한 3열 레이아웃입니다.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span>왼쪽: 폐기 정보 + 제품 선택</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-orange-500" />
                <span>오른쪽: 수량 입력 + 폐기 목록</span>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    },
    variants: [
      { id: 'default', name: '개요', description: '폼 구조 요약', props: {} },
      { id: 'other-reason', name: '기타 사유', description: '기타 선택 시 상세 사유 입력', props: {} },
      {
        id: 'confirm-dialog',
        name: '확인 다이얼로그',
        description: 'AlertDialog 확인 UI (Card로 대체)',
        props: {},
      },
    ],
    props: [
      {
        name: 'products',
        type: 'ProductForTreatment[]',
        required: true,
        description: '폐기 가능한 제품 목록',
      },
      { name: 'onSubmit', type: 'function', required: true, description: '폐기 등록 액션' },
    ],
  },

  // ===== Inventory Components =====
  'inventory-summary-card': {
    id: 'inventory-summary-card',
    name: 'InventorySummaryCard',
    category: 'shared',
    description: '전체 재고 요약 카드',
    Component: function InventorySummaryCardDemo() {
      return (
        <div className="w-[400px] p-4 bg-gray-50 rounded-lg flex items-center gap-4">
          <Boxes className="h-8 w-8 text-gray-400" />
          <div>
            <p className="text-lg font-semibold">전체 재고</p>
            <p className="text-2xl font-bold">2,500개</p>
            <p className="text-sm text-muted-foreground">3개 제품</p>
          </div>
        </div>
      );
    },
    variants: [{ id: 'default', name: '기본', description: '전체 재고 수량과 제품 종류 수', props: {} }],
    props: [
      { name: 'totalQuantity', type: 'number', required: true, description: '전체 재고량' },
      { name: 'productCount', type: 'number', required: true, description: '제품 종류 수' },
    ],
  },

  'inventory-table': {
    id: 'inventory-table',
    name: 'InventoryTable',
    category: 'tables',
    description: '재고 현황 테이블 (Accordion 스타일 카드)',
    storybookPath: 'tables-shared-inventorytable',
    Component: function InventoryTableDemo({ variant }: { variant?: ComponentVariant }) {
      const isEmpty = variant?.id === 'empty';
      const isExpanded = variant?.id === 'expanded';
      const hasWarning = variant?.id === 'expiry-warning';

      if (isEmpty) {
        return (
          <div className="w-[600px] p-8 text-center text-gray-500 border rounded-lg">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>재고 데이터가 없습니다</p>
          </div>
        );
      }

      const products = [
        { name: '볼 리프팅', model: 'PDO-COG-100', udi: 'UDI-001', total: 500 },
        { name: '이마 리프팅', model: 'PDO-MONO-60', udi: 'UDI-002', total: 300, hasWarning: hasWarning },
        { name: '턱선 리프팅', model: 'PDO-SCREW-90', udi: 'UDI-003', total: 200 },
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
                  <span className="font-medium">{product.name}</span>
                  <span className="text-sm text-muted-foreground">{product.model}</span>
                  <span className="text-xs text-muted-foreground">UDI: {product.udi}</span>
                  <Badge variant="outline" className="ml-auto">
                    {product.total.toLocaleString()}개
                  </Badge>
                  {product.hasWarning && <Badge variant="destructive">임박</Badge>}
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
                      <TableRow>
                        <TableCell className="font-mono text-sm">ND12345-240115</TableCell>
                        <TableCell>2024-01-15</TableCell>
                        <TableCell>2025-01-15</TableCell>
                        <TableCell className="text-right">300</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-sm">ND12345-240110</TableCell>
                        <TableCell>2024-01-10</TableCell>
                        <TableCell className="flex items-center gap-2">
                          2024-02-10
                          <Badge variant="destructive" className="text-xs">
                            임박
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">200</TableCell>
                      </TableRow>
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
      { id: 'default', name: '기본', description: '제품별 재고 카드 목록', props: {} },
      { id: 'expanded', name: '카드 펼침', description: 'Lot별 상세 테이블 표시', props: {} },
      {
        id: 'expiry-warning',
        name: '유효기한 임박',
        description: '유효기한 30일 이내 경고 표시',
        props: {},
      },
      { id: 'empty', name: '빈 상태', description: '재고 없음', props: {} },
    ],
    props: [
      {
        name: 'summaries',
        type: 'InventorySummaryWithAlias[]',
        required: true,
        description: '제품별 재고 요약',
      },
      { name: 'getDetail', type: 'function', required: true, description: '상세 정보 조회 함수' },
    ],
  },

  // ===== History Components =====
  'history-filter-section': {
    id: 'history-filter-section',
    name: 'HistoryFilterSection',
    category: 'forms',
    description: '거래 이력 필터 섹션 (날짜 범위 + 액션 타입)',
    Component: function HistoryFilterSectionDemo({ variant }: { variant?: ComponentVariant }) {
      const showDatePicker = variant?.id === 'date-expanded';
      const showTypeFilter = variant?.id === 'type-expanded';

      if (showDatePicker) {
        return (
          <div className="w-[600px] space-y-4">
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
                <div className="h-9 mt-1 rounded-md border px-3 py-2 text-sm bg-background">전체</div>
              </div>
              <div className="flex items-end">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-1" />
                  초기화
                </Button>
              </div>
            </div>
            {/* 달력 펼침 */}
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
                <div className="p-1"></div>
                {Array.from({ length: 31 }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'p-1 rounded text-xs',
                      i + 1 === 17
                        ? 'bg-blue-500 text-white'
                        : i + 1 === 20
                          ? 'bg-blue-100 text-blue-700'
                          : 'hover:bg-gray-100'
                    )}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      if (showTypeFilter) {
        return (
          <div className="w-[600px] space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label className="text-xs">시작일</Label>
                <div className="h-9 mt-1 rounded-md border px-3 py-2 text-sm bg-background">
                  2024.01.17
                </div>
              </div>
              <div>
                <Label className="text-xs">종료일</Label>
                <div className="h-9 mt-1 rounded-md border px-3 py-2 text-sm bg-background">
                  2024.01.20
                </div>
              </div>
              <div>
                <Label className="text-xs">거래 유형</Label>
                <div className="h-9 mt-1 rounded-md border px-3 py-2 text-sm bg-background flex items-center justify-between">
                  전체
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </div>
              </div>
            </div>
            {/* 유형 필터 펼침 */}
            <div className="border rounded-md shadow-md w-[200px]">
              <Command className="rounded-lg">
                <CommandList>
                  <CommandGroup>
                    <CommandItem className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      <span>전체</span>
                    </CommandItem>
                    <CommandItem className="flex items-center gap-2">
                      <Check className="h-4 w-4 opacity-0" />
                      <Badge>입고</Badge>
                    </CommandItem>
                    <CommandItem className="flex items-center gap-2">
                      <Check className="h-4 w-4 opacity-0" />
                      <Badge variant="secondary">시술</Badge>
                    </CommandItem>
                    <CommandItem className="flex items-center gap-2">
                      <Check className="h-4 w-4 opacity-0" />
                      <Badge variant="outline">회수</Badge>
                    </CommandItem>
                    <CommandItem className="flex items-center gap-2">
                      <Check className="h-4 w-4 opacity-0" />
                      <Badge variant="outline">반품</Badge>
                    </CommandItem>
                    <CommandItem className="flex items-center gap-2">
                      <Check className="h-4 w-4 opacity-0" />
                      <Badge variant="destructive">폐기</Badge>
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          </div>
        );
      }

      // 기본 필터
      return (
        <div className="w-[600px]">
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
              <Button variant="outline" className="w-full justify-start text-sm mt-1">
                전체
                <ChevronsUpDown className="h-4 w-4 ml-auto opacity-50" />
              </Button>
            </div>
            <div className="flex items-end">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                초기화
              </Button>
            </div>
          </div>
        </div>
      );
    },
    variants: [
      { id: 'default', name: '기본', description: '필터 패널 기본 상태', props: {} },
      { id: 'date-expanded', name: '날짜 펼침', description: '달력이 펼쳐진 상태', props: {} },
      { id: 'type-expanded', name: '유형 펼침', description: '액션 타입 필터 펼침', props: {} },
    ],
    props: [
      { name: 'dateRange', type: '{ start: Date, end: Date }', required: true, description: '날짜 범위' },
      { name: 'actionType', type: 'string | null', required: true, description: '선택된 액션 타입' },
      { name: 'onChange', type: 'function', required: true, description: '필터 변경 핸들러' },
    ],
  },

  'transaction-history-card': {
    id: 'transaction-history-card',
    name: 'TransactionHistoryCard',
    category: 'shared',
    description: '거래 이력 카드 (Accordion 스타일)',
    Component: function TransactionHistoryCardDemo({ variant }: { variant?: ComponentVariant }) {
      const defaultType = { label: '입고', variant: 'default' as const };
      const actionTypes: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
        received: defaultType,
        treated: { label: '시술', variant: 'secondary' },
        recalled: { label: '회수', variant: 'outline' },
        'return-sent': { label: '반품', variant: 'outline' },
        disposed: { label: '폐기', variant: 'destructive' },
      };

      const currentType = (variant?.id && actionTypes[variant.id]) || defaultType;
      const isExpanded = variant?.id === 'expanded';

      if (isExpanded) {
        return (
          <Card className="w-[600px]">
            <CardHeader className="cursor-pointer py-3">
              <div className="flex items-center gap-3">
                <ChevronDown className="h-4 w-4" />
                <Badge>입고</Badge>
                <span className="text-sm">2024-01-20 14:30</span>
                <span className="text-sm text-muted-foreground">(주)네오스레드</span>
                <Badge variant="outline" className="ml-auto">
                  100개
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0 border-t">
              <div className="py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">볼 리프팅 (PDO-COG-100)</span>
                  <Badge variant="outline">50개</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">이마 리프팅 (PDO-MONO-60)</span>
                  <Badge variant="outline">50개</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      }

      return (
        <Card className="w-[600px]">
          <CardHeader className="cursor-pointer py-3">
            <div className="flex items-center gap-3">
              <ChevronRight className="h-4 w-4" />
              <Badge variant={currentType.variant}>{currentType.label}</Badge>
              <span className="text-sm">2024-01-20 14:30</span>
              <span className="text-sm text-muted-foreground">
                {variant?.id === 'treated'
                  ? '010-****-5678'
                  : variant?.id === 'disposed'
                    ? '폐기 (만료)'
                    : '(주)네오스레드'}
              </span>
              <Badge variant="outline" className="ml-auto">
                100개
              </Badge>
            </div>
          </CardHeader>
        </Card>
      );
    },
    variants: [
      { id: 'received', name: '입고', description: '입고 거래 카드', props: {} },
      { id: 'treated', name: '시술', description: '시술 거래 카드', props: {} },
      { id: 'recalled', name: '회수', description: '회수 거래 카드', props: {} },
      { id: 'return-sent', name: '반품', description: '반품 거래 카드', props: {} },
      { id: 'disposed', name: '폐기', description: '폐기 거래 카드', props: {} },
      { id: 'expanded', name: '펼침', description: '상세 정보 표시', props: {} },
    ],
    props: [
      { name: 'transaction', type: 'HistorySummary', required: true, description: '거래 정보' },
      { name: 'onReturn', type: 'function', required: false, description: '반품 핸들러' },
    ],
  },

  'virtual-data-table': {
    id: 'virtual-data-table',
    name: 'VirtualDataTable',
    category: 'tables',
    description: '대용량 데이터 가상 스크롤 테이블 (10K+ 행 지원)',
    storybookPath: 'tables-shared-virtualdatatable',
    Component: function VirtualDataTableDemo({ variant }: { variant?: ComponentVariant }) {
      const mockData = useMemo(
        () =>
          Array.from({ length: 500 }, (_, i) => ({
            id: `history-${i}`,
            date: new Date(2024, 0, 20 - Math.floor(i / 10)).toLocaleDateString('ko-KR'),
            action: ['입고', '시술', '폐기', '회수'][i % 4],
            product: `볼 리프팅 ${['Alpha', 'Beta', 'Gamma'][i % 3]}`,
            quantity: Math.floor(Math.random() * 50) + 1,
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
              <Badge
                variant={
                  row.action === '입고'
                    ? 'default'
                    : row.action === '시술'
                      ? 'secondary'
                      : row.action === '폐기'
                        ? 'destructive'
                        : 'outline'
                }
              >
                {row.action}
              </Badge>
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
              getRowKey={(row) => row.id}
              height={300}
              emptyMessage="거래 이력이 없습니다"
            />
          </div>
        );
      }

      if (variant?.id === 'loading') {
        return (
          <div className="w-[600px]">
            <VirtualDataTable
              columns={columns}
              data={[]}
              getRowKey={(row) => row.id}
              height={300}
              isLoading={true}
            />
          </div>
        );
      }

      return (
        <div className="w-[600px]">
          <VirtualDataTable
            columns={columns}
            data={mockData}
            getRowKey={(row) => row.id}
            height={400}
          />
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
      {
        name: 'getRowKey',
        type: '(row: T) => string',
        required: true,
        description: '행 키 추출 함수',
      },
      {
        name: 'height',
        type: 'number',
        required: false,
        defaultValue: '600',
        description: '테이블 높이 (px)',
      },
      { name: 'isLoading', type: 'boolean', required: false, description: '로딩 상태' },
      { name: 'hasMore', type: 'boolean', required: false, description: '추가 데이터 여부' },
      { name: 'onLoadMore', type: '() => void', required: false, description: '더 로드 핸들러' },
    ],
  },

  // ===== Settings Components =====
  'hospital-product-settings-form': {
    id: 'hospital-product-settings-form',
    name: 'HospitalProductSettingsForm',
    category: 'forms',
    description: '병원 제품 관리 폼 (2열 레이아웃: 검색/목록 + 설정)',
    Component: function HospitalProductSettingsFormDemo({ variant }: { variant?: ComponentVariant }) {
      const showFullLayout = variant?.id === 'full-layout';
      const showProductSelected = variant?.id === 'product-selected';
      const showAliasInput = variant?.id === 'alias-input';
      const showAliasError = variant?.id === 'alias-error';

      if (showFullLayout || showProductSelected || showAliasInput || showAliasError) {
        const isSelected = showProductSelected || showAliasInput || showAliasError;

        return (
          <div className="w-full max-w-4xl space-y-4">
            {/* 검색 및 필터 */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input className="pl-9" placeholder="제품명, 모델명, 별칭 검색..." />
              </div>
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">전체</TabsTrigger>
                  <TabsTrigger value="with-alias">별칭 있음</TabsTrigger>
                  <TabsTrigger value="no-alias">별칭 없음</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* 2열 레이아웃 */}
            <div className="grid grid-cols-2 gap-6">
              {/* 제품 목록 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">제품 목록</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
                  {[
                    { name: 'PDO Thread COG 100', alias: '볼 리프팅', stock: 500, active: true },
                    { name: 'PDO Thread MONO 60', alias: '', stock: 300, active: true },
                    { name: 'PDO Thread SCREW 90', alias: '턱선', stock: 200, active: false },
                  ].map((product, i) => (
                    <div
                      key={i}
                      className={cn(
                        'p-3 border rounded-lg cursor-pointer transition-colors',
                        isSelected && i === 0
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-gray-300'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          {product.alias && (
                            <p className="text-xs text-muted-foreground">별칭: {product.alias}</p>
                          )}
                          <p className="text-xs text-muted-foreground">재고: {product.stock}개</p>
                        </div>
                        <Switch checked={product.active} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* 설정 패널 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    제품 설정
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isSelected ? (
                    <>
                      {/* 선택된 제품 정보 */}
                      <div className="p-3 bg-muted/50 rounded-lg text-sm">
                        <p className="font-medium">PDO Thread COG 100</p>
                        <p className="text-muted-foreground">모델: PDO-COG-100</p>
                        <p className="text-muted-foreground">UDI: UDI-001-COG</p>
                      </div>
                      {/* 별칭 설정 */}
                      <div className="space-y-2">
                        <Label>별칭</Label>
                        <Input
                          placeholder="예: 볼, 이마, 코"
                          defaultValue={showAliasInput || showAliasError ? '볼 리프팅' : ''}
                          className={showAliasError ? 'border-red-500' : ''}
                        />
                        {showAliasError && (
                          <p className="text-xs text-red-500">이미 사용 중인 별칭입니다</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          시술/폐기 시 제품명 대신 표시됩니다
                        </p>
                      </div>
                      {/* 활성화 설정 */}
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>시술 등록 활성화</Label>
                          <p className="text-xs text-muted-foreground">
                            비활성화 시 시술 목록에서 숨겨집니다
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      {/* 저장 버튼 */}
                      <div className="flex gap-2">
                        <Button className="flex-1" disabled={showAliasError}>
                          설정 저장
                        </Button>
                        <Button variant="outline">별칭 삭제</Button>
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>왼쪽에서 제품을 선택하세요</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );
      }

      // 개요
      return (
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-sm">HospitalProductSettingsForm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              병원 제품 관리 폼은 2열 레이아웃으로 구성됩니다.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span>상단: 검색 + 필터 탭</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span>왼쪽: 제품 목록 (활성화 토글)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-purple-500" />
                <span>오른쪽: 별칭 설정 패널</span>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    },
    variants: [
      { id: 'default', name: '개요', description: '폼 구조 요약', props: {} },
      { id: 'full-layout', name: '전체 레이아웃', description: '2열 레이아웃 표시', props: {} },
      { id: 'product-selected', name: '제품 선택됨', description: '제품 선택 후 설정 패널 활성화', props: {} },
      { id: 'alias-input', name: '별칭 입력', description: '별칭 입력 필드 포커스', props: {} },
      { id: 'alias-error', name: '별칭 중복', description: '중복 별칭 에러 표시', props: {} },
    ],
    props: [],
  },

  // ===== Shared/Common Components =====
  'searchable-combobox': {
    id: 'searchable-combobox',
    name: 'SearchableCombobox',
    category: 'forms',
    description: '검색 가능한 콤보박스 (제품 검색)',
    storybookPath: 'ui-selection-searchablecombobox',
    Component: function SearchableComboboxDemo() {
      return (
        <div className="w-[300px] space-y-2">
          <Label>제품 검색</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input className="pl-9" placeholder="제품명 검색..." defaultValue="볼 리프팅" />
          </div>
          <div className="border rounded-md p-2 space-y-1">
            <div className="px-2 py-1 bg-blue-50 rounded text-sm">볼 리프팅 (PDO-COG-100)</div>
            <div className="px-2 py-1 hover:bg-gray-50 rounded text-sm cursor-pointer">이마 리프팅 (PDO-MONO-60)</div>
            <div className="px-2 py-1 hover:bg-gray-50 rounded text-sm cursor-pointer">턱선 리프팅 (PDO-SCREW-90)</div>
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
        { date: '2024.01.20', product: '볼 리프팅', quantity: 10, patient: '010-****-5678' },
        { date: '2024.01.19', product: '이마 리프팅', quantity: 5, patient: '010-****-1234' },
        { date: '2024.01.18', product: '턱선 리프팅', quantity: 8, patient: '010-****-9999' },
      ];
      return (
        <div className="w-[600px] border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>시술일</TableHead>
                <TableHead>제품</TableHead>
                <TableHead className="text-right">수량</TableHead>
                <TableHead>환자</TableHead>
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
                  <TableRow key={`${item.date}-${item.patient}`}>
                    <TableCell className="text-gray-500">{item.date}</TableCell>
                    <TableCell className="font-medium">{item.product}</TableCell>
                    <TableCell className="text-right">{item.quantity}개</TableCell>
                    <TableCell>{item.patient}</TableCell>
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
      { id: 'empty', name: '데이터 없음', props: {} },
      { id: 'loading', name: '로딩 중', props: {} },
    ],
    props: [
      { name: 'columns', type: 'ColumnDef[]', required: true, description: '컬럼 정의' },
      { name: 'data', type: 'T[]', required: true, description: '데이터 배열' },
      { name: 'isLoading', type: 'boolean', required: false, description: '로딩 상태' },
      { name: 'hasMore', type: 'boolean', required: false, description: '추가 데이터 여부' },
      { name: 'onLoadMore', type: '() => void', required: false, description: '더 로드 핸들러' },
    ],
  },
};

/**
 * 병원 페이지별 컴포넌트 매핑
 */
export const hospitalPageComponents: Record<string, string[]> = {
  dashboard: ['stat-card', 'card'],
  treatment: ['treatment-form', 'patient-search', 'cart-display', 'searchable-combobox'],
  'treatment-history': ['treatment-history-table', 'treatment-recall-dialog', 'data-table'],
  disposal: ['disposal-form', 'disposal-reason-select', 'cart-display'],
  inventory: ['inventory-summary-card', 'inventory-table', 'data-table'],
  history: ['history-filter-section', 'transaction-history-card', 'virtual-data-table'],
  settings: ['hospital-product-settings-form'],
};
