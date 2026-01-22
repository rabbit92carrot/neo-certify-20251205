import { useMemo, Fragment } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Building2,
  UserCheck,
  AlertCircle,
  QrCode,
  Factory,
  Truck,
  Stethoscope,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Check,
  X,
  Eye,
  Calendar,
  Filter,
  ChevronsUpDown,
  RotateCcw,
  Bell,
  Mail,
  MailOpen,
  Package,
  ArrowRight,
  Search,
  ChevronLeft,
} from 'lucide-react';
import { VirtualDataTable, type VirtualColumnDef } from '@/components/shared/VirtualDataTable';
import { cn } from '@/lib/utils';

/**
 * 관리자 역할의 컴포넌트 카탈로그
 * 각 컴포넌트의 variants와 props 문서화
 */
export const adminComponentCatalog: Record<string, ComponentShowcaseConfig> = {
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
    }: {
      title?: string;
      value?: string | number;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      icon?: any;
      description?: string;
    }) {
      return (
        <StatCard
          title={title ?? '통계'}
          value={value ?? '0'}
          icon={Icon}
          description={description}
          className="w-[200px]"
        />
      );
    },
    variants: [
      {
        id: 'total-organizations',
        name: '총 조직 수',
        description: '등록된 조직 수',
        props: {
          title: '총 조직 수',
          value: '150',
          icon: Building2,
          description: '등록된 조직 수',
        },
      },
      {
        id: 'pending-approvals',
        name: '승인 대기',
        description: '승인 대기 중인 조직',
        props: {
          title: '승인 대기',
          value: '12',
          icon: UserCheck,
          description: '승인 대기 중인 조직',
        },
      },
      {
        id: 'today-recalls',
        name: '오늘 회수',
        description: '오늘 발생한 회수',
        props: {
          title: '오늘 회수 건수',
          value: '3',
          icon: AlertCircle,
          description: '오늘 발생한 회수',
        },
      },
      {
        id: 'total-codes',
        name: '총 가상 코드',
        description: '생성된 가상 식별코드',
        props: {
          title: '총 가상 코드',
          value: '125,000',
          icon: QrCode,
          description: '생성된 가상 식별코드',
        },
      },
    ],
    props: [
      { name: 'title', type: 'string', required: true, description: '통계 제목' },
      { name: 'value', type: 'string | number', required: true, description: '통계 값' },
      { name: 'icon', type: 'LucideIcon', required: false, description: '아이콘 컴포넌트' },
      { name: 'description', type: 'string', required: false, description: '부가 설명' },
    ],
  },

  card: {
    id: 'card',
    name: 'Card',
    category: 'ui',
    description: '콘텐츠를 그룹화하는 컨테이너',
    storybookPath: 'ui-layout-card',
    Component: function CardDemo({ variant }: { variant?: ComponentVariant }) {
      const isQuickMenu = variant?.id === 'quick-menu';
      const isPendingList = variant?.id === 'pending-list';

      if (isQuickMenu) {
        return (
          <Card className="w-[320px]">
            <CardHeader>
              <CardTitle className="text-base font-medium">빠른 메뉴</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <Building2 className="h-5 w-5" />
                <span>조직 관리</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <UserCheck className="h-5 w-5" />
                <span>가입 승인</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <QrCode className="h-5 w-5" />
                <span>전체 이력</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <AlertCircle className="h-5 w-5" />
                <span>회수 이력</span>
              </Button>
            </CardContent>
          </Card>
        );
      }

      if (isPendingList) {
        return (
          <Card className="w-[320px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">최근 승인 대기</CardTitle>
              <Button variant="ghost" size="sm">
                전체 보기
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full bg-gray-100">
                    <Factory className="h-3 w-3" />
                  </div>
                  <span className="text-sm">(주)네오스레드</span>
                </div>
                <Badge variant="secondary">제조사</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full bg-gray-100">
                    <Truck className="h-3 w-3" />
                  </div>
                  <span className="text-sm">메디유통</span>
                </div>
                <Badge variant="secondary">유통사</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full bg-gray-100">
                    <Stethoscope className="h-3 w-3" />
                  </div>
                  <span className="text-sm">강남피부과</span>
                </div>
                <Badge variant="secondary">병원</Badge>
              </div>
            </CardContent>
          </Card>
        );
      }

      return (
        <Card className="w-[320px]">
          <CardHeader>
            <CardTitle>환영합니다, 시스템 관리자님</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              JAMBER 정품 인증 시스템 관리자 페이지입니다.
            </p>
            <div className="mt-4 space-y-2 text-sm text-gray-500">
              <p>이메일: admin@neocert.com</p>
            </div>
          </CardContent>
        </Card>
      );
    },
    variants: [
      { id: 'welcome', name: '환영 메시지', props: {} },
      { id: 'quick-menu', name: '빠른 메뉴', props: {} },
      { id: 'pending-list', name: '승인 대기 목록', props: {} },
    ],
    props: [
      { name: 'className', type: 'string', required: false, description: 'CSS 클래스' },
      { name: 'children', type: 'ReactNode', required: true, description: '카드 내용' },
    ],
  },

  'admin-dashboard-view': {
    id: 'admin-dashboard-view',
    name: 'AdminDashboardView',
    category: 'layout',
    description: '관리자 대시보드 전체 레이아웃 구조',
    Component: function AdminDashboardViewDemo() {
      return (
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-sm">AdminDashboardView</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              관리자 대시보드 레이아웃 구조입니다.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span>상단: 환영 메시지 카드</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span>중단: 4개 통계 카드 (grid-cols-4)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-purple-500" />
                <span>하단: 승인 대기 목록 + 빠른 메뉴 (2열)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    },
    variants: [{ id: 'default', name: '개요', description: '레이아웃 구조 요약', props: {} }],
    props: [
      { name: 'organization', type: '{ name, email }', required: true, description: '조직 정보' },
      { name: 'stats', type: 'AdminDashboardStats', required: true, description: '통계 데이터' },
      {
        name: 'pendingOrganizations',
        type: 'PendingOrganization[]',
        required: true,
        description: '승인 대기 조직 목록',
      },
    ],
  },

  // ===== Organizations Components =====
  'organizations-table': {
    id: 'organizations-table',
    name: 'OrganizationsTable',
    category: 'tables',
    description: '조직 목록 테이블 (상태/유형 필터, 검색, 액션 메뉴)',
    Component: function OrganizationsTableDemo({ variant }: { variant?: ComponentVariant }) {
      const isEmpty = variant?.id === 'empty';
      const isLoading = variant?.id === 'loading';
      const showFilter = variant?.id === 'with-filter';

      const mockOrgs = [
        {
          name: '(주)네오스레드',
          type: 'MANUFACTURER',
          status: 'ACTIVE',
          email: 'neo@example.com',
          codeCount: 15000,
          date: '2024.01.05',
        },
        {
          name: '메디유통',
          type: 'DISTRIBUTOR',
          status: 'ACTIVE',
          email: 'medi@example.com',
          codeCount: 8500,
          date: '2024.01.10',
        },
        {
          name: '강남피부과',
          type: 'HOSPITAL',
          status: 'PENDING_APPROVAL',
          email: 'gangnam@example.com',
          codeCount: 0,
          date: '2024.01.18',
        },
      ];

      const getTypeIcon = (type: string) => {
        switch (type) {
          case 'MANUFACTURER':
            return <Factory className="h-4 w-4" />;
          case 'DISTRIBUTOR':
            return <Truck className="h-4 w-4" />;
          case 'HOSPITAL':
            return <Stethoscope className="h-4 w-4" />;
          default:
            return <Building2 className="h-4 w-4" />;
        }
      };

      const getTypeLabel = (type: string) => {
        switch (type) {
          case 'MANUFACTURER':
            return '제조사';
          case 'DISTRIBUTOR':
            return '유통사';
          case 'HOSPITAL':
            return '병원';
          default:
            return type;
        }
      };

      const getStatusBadge = (status: string) => {
        switch (status) {
          case 'ACTIVE':
            return <Badge>활성</Badge>;
          case 'PENDING_APPROVAL':
            return <Badge variant="secondary">승인 대기</Badge>;
          case 'INACTIVE':
            return <Badge variant="outline">비활성</Badge>;
          default:
            return <Badge variant="destructive">삭제됨</Badge>;
        }
      };

      if (isEmpty) {
        return (
          <div className="w-[700px] p-8 text-center text-gray-500 border rounded-lg">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>등록된 조직이 없습니다</p>
          </div>
        );
      }

      if (isLoading) {
        return (
          <div className="w-[700px] p-8 text-center text-gray-500 border rounded-lg">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded" />
              <div className="h-10 bg-gray-200 rounded" />
              <div className="h-10 bg-gray-200 rounded" />
            </div>
          </div>
        );
      }

      return (
        <div className="w-[700px] space-y-4">
          {/* 필터 영역 */}
          {showFilter && (
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input className="pl-9" placeholder="조직명, 이메일 검색..." />
              </div>
              <div className="h-10 w-[180px] rounded-md border px-3 py-2 text-sm flex items-center justify-between">
                <span>전체 상태</span>
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </div>
              <div className="h-10 w-[180px] rounded-md border px-3 py-2 text-sm flex items-center justify-between">
                <span>전체 유형</span>
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </div>
            </div>
          )}
          {/* 테이블 */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>조직명</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>보유 코드</TableHead>
                  <TableHead>등록일</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockOrgs.map((org, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-full bg-gray-100">
                          {getTypeIcon(org.type)}
                        </div>
                        {org.name}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeLabel(org.type)}</TableCell>
                    <TableCell>{getStatusBadge(org.status)}</TableCell>
                    <TableCell className="text-muted-foreground">{org.email}</TableCell>
                    <TableCell>{org.codeCount.toLocaleString()}개</TableCell>
                    <TableCell className="text-muted-foreground">{org.date}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      );
    },
    variants: [
      { id: 'default', name: '기본', description: '조직 목록 표시', props: {} },
      { id: 'with-filter', name: '필터 포함', description: '검색 및 필터 영역 표시', props: {} },
      { id: 'empty', name: '빈 상태', description: '조직 없음', props: {} },
      { id: 'loading', name: '로딩', description: '로딩 상태', props: {} },
    ],
    props: [
      {
        name: 'organizations',
        type: 'OrganizationWithStats[]',
        required: true,
        description: '조직 목록',
      },
      { name: 'onApprove', type: 'function', required: false, description: '승인 핸들러' },
      { name: 'onDeactivate', type: 'function', required: false, description: '비활성화 핸들러' },
      { name: 'onActivate', type: 'function', required: false, description: '활성화 핸들러' },
      { name: 'onDelete', type: 'function', required: false, description: '삭제 핸들러' },
    ],
  },

  // ===== Approvals Components =====
  'approval-table': {
    id: 'approval-table',
    name: 'ApprovalTable',
    category: 'tables',
    description: '승인 대기 조직 테이블 (상세보기, 승인/거부 액션)',
    Component: function ApprovalTableDemo({ variant }: { variant?: ComponentVariant }) {
      const isEmpty = variant?.id === 'empty';
      const showDetail = variant?.id === 'with-detail';

      const mockOrgs = [
        {
          name: '(주)신규제조',
          type: 'MANUFACTURER',
          email: 'new@example.com',
          businessNumber: '123-45-67890',
          representative: '홍길동',
          date: '01.18 14:30',
        },
        {
          name: '새유통사',
          type: 'DISTRIBUTOR',
          email: 'dist@example.com',
          businessNumber: '234-56-78901',
          representative: '김철수',
          date: '01.17 10:00',
        },
      ];

      const getTypeIcon = (type: string) => {
        switch (type) {
          case 'MANUFACTURER':
            return <Factory className="h-4 w-4" />;
          case 'DISTRIBUTOR':
            return <Truck className="h-4 w-4" />;
          case 'HOSPITAL':
            return <Stethoscope className="h-4 w-4" />;
          default:
            return <Building2 className="h-4 w-4" />;
        }
      };

      const getTypeLabel = (type: string) => {
        switch (type) {
          case 'MANUFACTURER':
            return '제조사';
          case 'DISTRIBUTOR':
            return '유통사';
          case 'HOSPITAL':
            return '병원';
          default:
            return type;
        }
      };

      if (isEmpty) {
        return (
          <div className="w-[700px] p-8 text-center text-gray-500 border rounded-lg">
            <Check className="h-12 w-12 mx-auto mb-4 text-green-300" />
            <p className="font-medium">승인 대기 중인 조직이 없습니다</p>
            <p className="text-sm text-muted-foreground mt-1">모든 가입 신청이 처리되었습니다.</p>
          </div>
        );
      }

      if (showDetail) {
        return (
          <Card className="w-[500px]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Factory className="h-5 w-5" />
                (주)신규제조
              </CardTitle>
              <p className="text-sm text-muted-foreground">제조사 조직 상세 정보</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">이메일</span>
                  <span>new@example.com</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">사업자등록번호</span>
                  <span>123-45-67890</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">대표자명</span>
                  <span>홍길동</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">대표 연락처</span>
                  <span>010-1234-5678</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">주소</span>
                  <span>서울시 강남구</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">신청일</span>
                  <span>2024년 1월 18일 14:30</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" className="flex-1">
                닫기
              </Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700">
                <Check className="h-4 w-4 mr-1" />
                승인
              </Button>
            </CardFooter>
          </Card>
        );
      }

      return (
        <div className="w-[700px] border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>조직명</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>사업자등록번호</TableHead>
                <TableHead>대표자</TableHead>
                <TableHead>신청일</TableHead>
                <TableHead className="w-[120px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockOrgs.map((org, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-full bg-gray-100">{getTypeIcon(org.type)}</div>
                      {org.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getTypeLabel(org.type)}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{org.email}</TableCell>
                  <TableCell>{org.businessNumber}</TableCell>
                  <TableCell>{org.representative}</TableCell>
                  <TableCell className="text-muted-foreground">{org.date}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    },
    variants: [
      { id: 'default', name: '기본', description: '승인 대기 조직 목록', props: {} },
      { id: 'with-detail', name: '상세 보기', description: '조직 상세 정보 Card로 표시', props: {} },
      { id: 'empty', name: '빈 상태', description: '모든 신청 처리 완료', props: {} },
    ],
    props: [
      { name: 'organizations', type: 'Organization[]', required: true, description: '승인 대기 조직 목록' },
      { name: 'onApprove', type: 'function', required: false, description: '승인 핸들러' },
      { name: 'onReject', type: 'function', required: false, description: '거부 핸들러' },
    ],
  },

  // ===== History Components =====
  'admin-history-table': {
    id: 'admin-history-table',
    name: 'AdminHistoryTable',
    category: 'tables',
    description: '전체 이벤트 이력 테이블 (테이블 스타일, 행 클릭으로 Lot 상세 확장)',
    Component: function AdminHistoryTableDemo({ variant }: { variant?: ComponentVariant }) {
      const isEmpty = variant?.id === 'empty';
      const isExpanded = variant?.id === 'expanded';

      if (isEmpty) {
        return (
          <div className="w-[700px] p-8 text-center text-gray-500 border rounded-lg">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>이벤트 이력이 없습니다</p>
            <p className="text-sm mt-1">조회 조건에 맞는 이벤트가 없습니다.</p>
          </div>
        );
      }

      const events = [
        {
          date: '01.16 16:22',
          type: '출고',
          quantity: 100,
          from: '테스트조직_17065481...',
          to: '테스트조직_17065481...',
          lot: 'LOT_test_1768548147436_asiaxyct',
        },
        {
          date: '01.16 16:22',
          type: '출고',
          quantity: 100,
          from: '테스트조직_17065481...',
          to: '테스트조직_17065481...',
          lot: 'LOT_test_1768548146975_2co09jbm',
        },
        {
          date: '01.16 16:21',
          type: '반품 입고',
          quantity: 2,
          from: '테스트조직_17065481...',
          to: '테스트조직_17065481...',
          lot: 'LOT_test_1768548118816_xiyysef',
          isRecall: true,
        },
      ];

      const getTypeBadge = (type: string, isRecall?: boolean) => {
        if (isRecall) {
          return (
            <Badge variant="destructive" className="flex items-center gap-1">
              <RotateCcw className="h-3 w-3" />
              {type}
            </Badge>
          );
        }
        switch (type) {
          case '생산':
            return <Badge>생산</Badge>;
          case '출고':
            return <Badge variant="secondary">출고</Badge>;
          case '입고':
            return <Badge variant="outline">입고</Badge>;
          case '시술':
            return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">시술</Badge>;
          case '회수':
          case '반품 입고':
            return <Badge variant="destructive">{type}</Badge>;
          case '폐기':
            return <Badge variant="outline" className="text-red-600">{type}</Badge>;
          default:
            return <Badge variant="outline">{type}</Badge>;
        }
      };

      return (
        <div className="w-[700px] border rounded-lg overflow-hidden">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[90px]">일시</TableHead>
                <TableHead className="w-[100px]">이벤트</TableHead>
                <TableHead className="w-[60px]">수량</TableHead>
                <TableHead className="w-[140px]">출발</TableHead>
                <TableHead className="w-[140px]">도착</TableHead>
                <TableHead>Lot 번호</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event, i) => (
                <Fragment key={i}>
                  <TableRow
                    className={cn(
                      'cursor-pointer hover:bg-muted/50',
                      event.isRecall && 'bg-red-50 hover:bg-red-100'
                    )}
                  >
                    <TableCell className="text-sm">{event.date}</TableCell>
                    <TableCell>{getTypeBadge(event.type, event.isRecall)}</TableCell>
                    <TableCell className="font-medium">{event.quantity}개</TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate">
                      {event.from}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate">
                      {event.to}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-auto py-1 px-2 text-sm">
                        {isExpanded && i === 0 ? (
                          <ChevronDown className="h-3 w-3 mr-1" />
                        ) : (
                          <ChevronRight className="h-3 w-3 mr-1" />
                        )}
                        {event.lot.length > 25 ? event.lot.substring(0, 25) + '...' : event.lot}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {isExpanded && i === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-muted/30 p-4">
                        <div className="space-y-3">
                          <div className="text-sm font-medium">
                            Lot별 상세 (1개): 품목/제품 고유식별코드 확인
                          </div>
                          <div className="flex items-center gap-2">
                            <ChevronDown className="h-4 w-4" />
                            <span className="text-sm">{event.lot}</span>
                            <Badge variant="outline" className="ml-auto">100개</Badge>
                          </div>
                          <div className="pl-6 space-y-2">
                            <p className="text-xs text-muted-foreground">제품명: 테스트제품</p>
                            <div className="border rounded-md">
                              <Table>
                                <TableHeader>
                                  <TableRow className="text-xs">
                                    <TableHead>코드</TableHead>
                                    <TableHead>상태</TableHead>
                                    <TableHead>현재 소유</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  <TableRow className="text-xs">
                                    <TableCell>NC-B8455DB4-50A3</TableCell>
                                    <TableCell>재고</TableCell>
                                    <TableCell>테스트조직_176054...</TableCell>
                                  </TableRow>
                                  <TableRow className="text-xs">
                                    <TableCell>NC-1A7F4ACB-B46A</TableCell>
                                    <TableCell>재고</TableCell>
                                    <TableCell>테스트조직_176054...</TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    },
    variants: [
      { id: 'default', name: '기본', description: '이벤트 이력 테이블', props: {} },
      { id: 'expanded', name: 'Lot 상세 펼침', description: 'Lot별 고유식별코드 표시', props: {} },
      { id: 'empty', name: '빈 상태', description: '이력 없음', props: {} },
    ],
    props: [
      { name: 'events', type: 'AdminEventSummary[]', required: true, description: '이벤트 목록' },
      { name: 'onLoadMore', type: 'function', required: false, description: '더 로드 핸들러' },
    ],
  },

  'admin-history-filter': {
    id: 'admin-history-filter',
    name: 'AdminHistoryFilter',
    category: 'forms',
    description: '관리자 이력 필터 (날짜, Lot, 조직, 제품유형, 회수이력, 이벤트타입 체크박스)',
    Component: function AdminHistoryFilterDemo({ variant }: { variant?: ComponentVariant }) {
      const showDatePicker = variant?.id === 'date-expanded';
      const showTypeFilter = variant?.id === 'type-expanded';

      // 공통 필터 헤더
      const FilterHeader = () => (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">필터</span>
            <Badge variant="secondary" className="text-xs">2</Badge>
          </div>
          <Button variant="ghost" size="sm">
            <X className="h-4 w-4 mr-1" />
            초기화
          </Button>
        </div>
      );

      // 이벤트 타입 체크박스 섹션
      const EventTypeCheckboxes = ({ highlight = false }: { highlight?: boolean }) => (
        <div className={cn('space-y-2', highlight && 'ring-2 ring-blue-500 ring-offset-2 rounded-md p-2')}>
          <Label className="text-xs">이벤트 타입</Label>
          <p className="text-xs text-muted-foreground">
            (선택하지 않으면 모든 이벤트 타입이 표시됩니다.)
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            {['생산', '출고', '입고', '시술', '회수', '폐기'].map((type, i) => (
              <div key={type} className="flex items-center gap-1.5">
                <Checkbox id={`evt-${i}`} defaultChecked={i < 2} />
                <label htmlFor={`evt-${i}`} className="text-sm">{type}</label>
              </div>
            ))}
          </div>
        </div>
      );

      if (showDatePicker) {
        return (
          <div className="w-[800px] space-y-4 p-4 border rounded-lg bg-gray-50/50">
            <FilterHeader />
            {/* 필터 그리드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">시작일</Label>
                <Button variant="outline" className="w-full justify-start text-sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  2026.01.01
                </Button>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">종료일</Label>
                <Button variant="outline" className="w-full justify-start text-sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  2026.01.21
                </Button>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Lot 번호</Label>
                <Input placeholder="LOT 번호 검색..." className="text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">관련 조직</Label>
                <div className="h-9 rounded-md border px-3 py-2 text-sm bg-background">전체</div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">제품 유형</Label>
                <div className="h-9 rounded-md border px-3 py-2 text-sm bg-background flex items-center justify-between">
                  전체
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">회수 이력</Label>
                <div className="h-9 rounded-md border px-3 py-2 text-sm bg-background flex items-center justify-between">
                  포함
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </div>
              </div>
            </div>
            {/* 달력 팝오버 */}
            <div className="border rounded-md p-3 bg-white shadow-md w-[240px]">
              <div className="flex justify-between items-center mb-2">
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">2026년 1월</span>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
                  <div key={d} className="text-muted-foreground p-1">{d}</div>
                ))}
                {Array.from({ length: 31 }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'p-1 rounded text-xs cursor-pointer',
                      i + 1 === 1 ? 'bg-blue-500 text-white' : i + 1 === 21 ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
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
          <div className="w-[800px] space-y-4 p-4 border rounded-lg bg-gray-50/50">
            <FilterHeader />
            {/* 필터 그리드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">시작일</Label>
                <Button variant="outline" className="w-full justify-start text-sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  2026.01.01
                </Button>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">종료일</Label>
                <Button variant="outline" className="w-full justify-start text-sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  2026.01.21
                </Button>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Lot 번호</Label>
                <Input placeholder="LOT 번호 검색..." className="text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">관련 조직</Label>
                <div className="h-9 rounded-md border px-3 py-2 text-sm bg-background">전체</div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">제품 유형</Label>
                <div className="h-9 rounded-md border px-3 py-2 text-sm bg-background flex items-center justify-between">
                  전체
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">회수 이력</Label>
                <div className="h-9 rounded-md border px-3 py-2 text-sm bg-background flex items-center justify-between">
                  포함
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </div>
              </div>
            </div>
            {/* 이벤트 타입 체크박스 (하이라이트) */}
            <EventTypeCheckboxes highlight />
            {/* 조회 버튼 */}
            <div className="flex justify-end gap-2">
              <Button>
                <Search className="h-4 w-4 mr-2" />
                조회
              </Button>
            </div>
          </div>
        );
      }

      return (
        <div className="w-[800px] space-y-4 p-4 border rounded-lg bg-gray-50/50">
          <FilterHeader />
          {/* 필터 그리드 - 6열 */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">시작일</Label>
              <Button variant="outline" className="w-full justify-start text-sm">
                <Calendar className="mr-2 h-4 w-4" />
                2026.01.01
              </Button>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">종료일</Label>
              <Button variant="outline" className="w-full justify-start text-sm">
                <Calendar className="mr-2 h-4 w-4" />
                2026.01.21
              </Button>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Lot 번호</Label>
              <Input placeholder="LOT 번호 검색..." className="text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">관련 조직</Label>
              <div className="h-9 rounded-md border px-3 py-2 text-sm bg-background flex items-center justify-between">
                전체
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">제품 유형</Label>
              <div className="h-9 rounded-md border px-3 py-2 text-sm bg-background flex items-center justify-between">
                전체
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">회수 이력</Label>
              <div className="h-9 rounded-md border px-3 py-2 text-sm bg-background flex items-center justify-between">
                포함
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </div>
            </div>
          </div>
          {/* 이벤트 타입 체크박스 */}
          <EventTypeCheckboxes />
          {/* 조회 버튼 */}
          <div className="flex justify-end gap-2">
            <Button>
              <Search className="h-4 w-4 mr-2" />
              조회
            </Button>
          </div>
        </div>
      );
    },
    variants: [
      { id: 'default', name: '기본', description: '전체 필터 패널', props: {} },
      { id: 'date-expanded', name: '날짜 펼침', description: '달력 팝오버 표시', props: {} },
      { id: 'type-expanded', name: '이벤트 타입 강조', description: '이벤트 타입 체크박스 하이라이트', props: {} },
    ],
    props: [
      { name: 'dateRange', type: '{ start: Date, end: Date }', required: true, description: '날짜 범위' },
      { name: 'actionTypes', type: 'string[]', required: true, description: '선택된 이벤트 유형' },
      { name: 'lotNumber', type: 'string', required: false, description: 'Lot 번호 검색어' },
      { name: 'organizationId', type: 'string', required: false, description: '선택된 조직 ID' },
      { name: 'onChange', type: 'function', required: true, description: '필터 변경 핸들러' },
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
            id: `event-${i}`,
            date: new Date(2024, 0, 20 - Math.floor(i / 10)).toLocaleDateString('ko-KR'),
            type: ['생산', '출고', '시술', '회수'][i % 4],
            org: ['(주)네오스레드', '메디유통', '강남피부과'][i % 3],
            product: `볼 리프팅 ${['Alpha', 'Beta', 'Gamma'][i % 3]}`,
            quantity: Math.floor(Math.random() * 100) + 1,
          })),
        []
      );

      const columns: VirtualColumnDef<(typeof mockData)[0]>[] = useMemo(
        () => [
          { id: 'date', header: '날짜', cell: (row) => row.date, width: 100 },
          {
            id: 'type',
            header: '유형',
            cell: (row) => (
              <Badge
                variant={
                  row.type === '생산'
                    ? 'default'
                    : row.type === '출고'
                      ? 'secondary'
                      : row.type === '시술'
                        ? 'outline'
                        : 'destructive'
                }
              >
                {row.type}
              </Badge>
            ),
            width: 80,
          },
          { id: 'org', header: '조직', cell: (row) => row.org, width: 120 },
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
              emptyMessage="이벤트 이력이 없습니다"
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
    ],
  },

  // ===== Recalls Components =====
  'recalls-table': {
    id: 'recalls-table',
    name: 'RecallsTable',
    category: 'tables',
    description: '회수 이력 테이블 (카드 스타일)',
    Component: function RecallsTableDemo({ variant }: { variant?: ComponentVariant }) {
      const isEmpty = variant?.id === 'empty';
      const isExpanded = variant?.id === 'expanded';

      if (isEmpty) {
        return (
          <div className="w-[600px] p-8 text-center text-gray-500 border rounded-lg">
            <RotateCcw className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>회수 이력이 없습니다</p>
          </div>
        );
      }

      const recalls = [
        {
          type: '출고 회수',
          from: '메디유통',
          to: '(주)네오스레드',
          quantity: 50,
          date: '2024-01-20 14:30',
          reason: '수량 오류',
          product: '볼 리프팅',
        },
        {
          type: '시술 회수',
          from: '강남피부과',
          to: '강남피부과',
          quantity: 5,
          date: '2024-01-19 10:00',
          reason: '환자 요청 취소',
          product: '이마 리프팅',
        },
      ];

      return (
        <div className="w-[600px] space-y-3">
          {recalls.map((recall, i) => (
            <Card key={i} className="border-l-4 border-l-orange-400">
              <CardHeader className="cursor-pointer py-3">
                <div className="flex items-center gap-3">
                  {isExpanded && i === 0 ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <Badge variant="destructive">{recall.type}</Badge>
                  <span className="text-sm">{recall.date}</span>
                  <span className="text-sm text-muted-foreground">
                    {recall.from} → {recall.to}
                  </span>
                  <Badge variant="outline" className="ml-auto">
                    {recall.quantity}개
                  </Badge>
                </div>
              </CardHeader>
              {isExpanded && i === 0 && (
                <CardContent className="pt-0 border-t">
                  <div className="py-3 grid grid-cols-2 gap-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span>{recall.product}</span>
                      </div>
                      <div className="text-muted-foreground">수량: {recall.quantity}개</div>
                    </div>
                    <div className="text-sm space-y-1">
                      <p className="text-orange-600 font-medium">회수 사유</p>
                      <p className="text-muted-foreground">{recall.reason}</p>
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
      { id: 'default', name: '기본', description: '회수 이력 목록', props: {} },
      { id: 'expanded', name: '카드 펼침', description: '상세 정보 표시', props: {} },
      { id: 'empty', name: '빈 상태', description: '회수 이력 없음', props: {} },
    ],
    props: [
      { name: 'recalls', type: 'RecallHistory[]', required: true, description: '회수 이력 목록' },
      { name: 'onLoadMore', type: 'function', required: false, description: '더 로드 핸들러' },
    ],
  },

  // ===== Alerts Components =====
  'organization-alert-table': {
    id: 'organization-alert-table',
    name: 'OrganizationAlertTable',
    category: 'tables',
    description: '알림 목록 테이블 (읽음/안읽음 상태, 선택)',
    Component: function OrganizationAlertTableDemo({ variant }: { variant?: ComponentVariant }) {
      const isEmpty = variant?.id === 'empty';
      const hasSelection = variant?.id === 'with-selection';

      if (isEmpty) {
        return (
          <div className="w-[600px] p-8 text-center text-gray-500 border rounded-lg">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>알림이 없습니다</p>
          </div>
        );
      }

      const alerts = [
        {
          id: '1',
          type: '가입 승인 요청',
          title: '새로운 가입 신청: (주)신규제조',
          date: '2024-01-20 14:30',
          isRead: false,
        },
        {
          id: '2',
          type: '회수 알림',
          title: '메디유통에서 출고 회수 처리됨',
          date: '2024-01-20 10:00',
          isRead: false,
        },
        {
          id: '3',
          type: '시스템 알림',
          title: '시스템 점검 완료',
          date: '2024-01-19 18:00',
          isRead: true,
        },
      ];

      return (
        <div className="w-[600px] border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {hasSelection && (
                  <TableHead className="w-[40px]">
                    <Checkbox />
                  </TableHead>
                )}
                <TableHead className="w-[60px]" />
                <TableHead>유형</TableHead>
                <TableHead>내용</TableHead>
                <TableHead>날짜</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow
                  key={alert.id}
                  className={cn(!alert.isRead && 'bg-blue-50/50')}
                >
                  {hasSelection && (
                    <TableCell>
                      <Checkbox checked={alert.id === '1'} />
                    </TableCell>
                  )}
                  <TableCell>
                    {!alert.isRead ? (
                      <Mail className="h-4 w-4 text-blue-500" />
                    ) : (
                      <MailOpen className="h-4 w-4 text-gray-400" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={alert.isRead ? 'outline' : 'secondary'}>{alert.type}</Badge>
                  </TableCell>
                  <TableCell className={cn(!alert.isRead && 'font-medium')}>{alert.title}</TableCell>
                  <TableCell className="text-muted-foreground">{alert.date}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    },
    variants: [
      { id: 'default', name: '기본', description: '알림 목록 표시', props: {} },
      { id: 'with-selection', name: '선택 모드', description: '체크박스 표시', props: {} },
      { id: 'empty', name: '빈 상태', description: '알림 없음', props: {} },
    ],
    props: [
      { name: 'alerts', type: 'OrganizationAlert[]', required: true, description: '알림 목록' },
      { name: 'onMarkAsRead', type: 'function', required: false, description: '읽음 처리 핸들러' },
      { name: 'onSelect', type: 'function', required: false, description: '선택 핸들러' },
    ],
  },

  'inactive-product-usage-table': {
    id: 'inactive-product-usage-table',
    name: 'InactiveProductUsageTable',
    category: 'tables',
    description: '비활성 제품 사용 알림 테이블',
    Component: function InactiveProductUsageTableDemo({ variant }: { variant?: ComponentVariant }) {
      const isEmpty = variant?.id === 'empty';

      if (isEmpty) {
        return (
          <div className="w-[700px] p-8 text-center text-gray-500 border rounded-lg">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>비활성 제품 사용 알림이 없습니다</p>
          </div>
        );
      }

      const logs = [
        {
          usageType: '시술',
          product: '볼 리프팅 (비활성)',
          reason: '제품 단종',
          org: '강남피부과',
          quantity: 10,
          date: '2024-01-20 14:30',
          status: '미확인',
        },
        {
          usageType: '출고',
          product: '이마 리프팅 (비활성)',
          reason: '인증 만료',
          org: '메디유통',
          quantity: 50,
          date: '2024-01-19 10:00',
          status: '확인됨',
        },
      ];

      return (
        <div className="w-[700px] border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>사용 유형</TableHead>
                <TableHead>제품</TableHead>
                <TableHead>비활성 사유</TableHead>
                <TableHead>조직</TableHead>
                <TableHead>수량</TableHead>
                <TableHead>날짜</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Badge variant={log.usageType === '시술' ? 'secondary' : 'outline'}>
                      {log.usageType}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-red-600">{log.product}</TableCell>
                  <TableCell>{log.reason}</TableCell>
                  <TableCell>{log.org}</TableCell>
                  <TableCell>{log.quantity}개</TableCell>
                  <TableCell className="text-muted-foreground">{log.date}</TableCell>
                  <TableCell>
                    <Badge variant={log.status === '확인됨' ? 'outline' : 'destructive'}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.status === '미확인' && (
                      <Button variant="ghost" size="sm">
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    },
    variants: [
      { id: 'default', name: '기본', description: '비활성 제품 사용 목록', props: {} },
      { id: 'empty', name: '빈 상태', description: '알림 없음', props: {} },
    ],
    props: [
      { name: 'logs', type: 'InactiveProductUsageLog[]', required: true, description: '사용 로그 목록' },
      { name: 'onAcknowledge', type: 'function', required: false, description: '확인 처리 핸들러' },
    ],
  },

  // ===== Inbox Components =====
  'notification-list': {
    id: 'notification-list',
    name: 'NotificationList',
    category: 'tables',
    description: '알림 보관함 테이블 (체크박스, NEW 뱃지, 읽음 처리)',
    Component: function NotificationListDemo({ variant }: { variant?: ComponentVariant }) {
      const isEmpty = variant?.id === 'empty';
      const hasUnread = variant?.id === 'with-unread';

      if (isEmpty) {
        return (
          <div className="w-[700px] p-8 text-center text-gray-500 border rounded-lg">
            <MailOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>알림이 없습니다.</p>
          </div>
        );
      }

      const alerts = [
        {
          id: '1',
          type: '비활성 제품 사용',
          title: '[긴급] 안전 문제 제품 사용 감지',
          date: '2026-01-16 16:21',
          isRead: false,
        },
        {
          id: '2',
          type: '비활성 제품 사용',
          title: '비활성 제품 사용 감지',
          date: '2026-01-16 16:21',
          isRead: hasUnread ? false : true,
        },
        {
          id: '3',
          type: '비활성 제품 사용',
          title: '[주의] 품질 문제 제품 사용 감지',
          date: '2026-01-16 16:21',
          isRead: hasUnread ? false : true,
        },
        {
          id: '4',
          type: '비활성 제품 사용',
          title: '비활성 제품 사용 감지',
          date: '2026-01-16 16:20',
          isRead: true,
        },
      ];

      return (
        <div className="w-[700px] border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox />
                </TableHead>
                <TableHead className="w-[60px]" />
                <TableHead className="w-[140px]">유형</TableHead>
                <TableHead>제목</TableHead>
                <TableHead className="w-[140px]">일시</TableHead>
                <TableHead className="w-[80px]">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow
                  key={alert.id}
                  className={cn(
                    'transition-colors',
                    !alert.isRead && 'bg-blue-50/50 hover:bg-blue-50'
                  )}
                >
                  <TableCell>
                    {!alert.isRead && <Checkbox />}
                  </TableCell>
                  <TableCell>
                    {!alert.isRead && (
                      <Badge className="bg-blue-500 hover:bg-blue-500 text-white text-[10px] px-1.5 py-0">
                        NEW
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <Badge variant="outline" className="font-normal text-xs">
                        {alert.type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn('text-sm', !alert.isRead && 'font-semibold')}>
                      {alert.title}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {alert.date}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!alert.isRead && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                          <MailOpen className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    },
    variants: [
      { id: 'default', name: '기본', description: '알림 목록 (혼합 상태)', props: {} },
      { id: 'with-unread', name: '안읽음 있음', description: 'NEW 뱃지 표시된 알림', props: {} },
      { id: 'empty', name: '빈 상태', description: '알림 없음', props: {} },
    ],
    props: [
      { name: 'alerts', type: 'OrganizationAlert[]', required: true, description: '알림 목록' },
      { name: 'onMarkAsRead', type: 'function', required: false, description: '읽음 처리 핸들러' },
      { name: 'onViewDetail', type: 'function', required: false, description: '상세 보기 핸들러' },
    ],
  },

  // ===== Shared Components =====
  'data-table': {
    id: 'data-table',
    name: 'DataTable',
    category: 'tables',
    description: '범용 데이터 테이블 (Admin 맥락)',
    storybookPath: 'shared-data-datatable',
    Component: function DataTableDemo({ variant }: { variant?: ComponentVariant }) {
      const isLoading = variant?.id === 'loading';
      const isEmpty = variant?.id === 'empty';

      const items = [
        { name: '(주)네오스레드', type: '제조사', status: '활성', date: '2024.01.05' },
        { name: '메디유통', type: '유통사', status: '활성', date: '2024.01.10' },
        { name: '강남피부과', type: '병원', status: '승인 대기', date: '2024.01.18' },
      ];

      return (
        <div className="w-[500px] border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>조직명</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>등록일</TableHead>
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
                    데이터가 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === '활성' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.date}</TableCell>
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
    ],
  },
};

/**
 * 관리자 페이지별 컴포넌트 매핑
 */
export const adminPageComponents: Record<string, string[]> = {
  dashboard: ['stat-card', 'card', 'admin-dashboard-view'],
  organizations: ['organizations-table', 'data-table'],
  approvals: ['approval-table', 'data-table'],
  history: ['admin-history-table', 'virtual-data-table', 'admin-history-filter'],
  recalls: ['recalls-table', 'data-table'],
  alerts: ['organization-alert-table', 'inactive-product-usage-table'],
  inbox: ['notification-list'],
};
