'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Calendar,
  Search,
  X,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { EmptyState } from './EmptyState';

/**
 * HistoryPageWrapper 컴포넌트는 서버 액션과 라우터에 의존합니다.
 * Storybook에서는 Mock 컴포넌트로 UI를 시뮬레이션합니다.
 */

// Mock 데이터 타입
interface MockHistoryItem {
  id: string;
  actionType: string;
  actionTypeLabel: string;
  createdAt: string;
  quantity: number;
  fromOrg?: string;
  toOrg?: string;
}

// Mock 히스토리 데이터
const mockHistories: MockHistoryItem[] = Array.from({ length: 20 }, (_, i) => ({
  id: `hist-${i + 1}`,
  actionType: ['SHIPPED', 'RECEIVED', 'TREATED', 'RECALLED'][i % 4],
  actionTypeLabel: ['출고', '입고', '시술', '회수'][i % 4],
  createdAt: new Date(2024, 0, 15 - Math.floor(i / 4), 14 - i, 30).toISOString(),
  quantity: 10 + (i * 5),
  fromOrg: i % 4 === 2 ? '서울미래의원' : '네오메디컬',
  toOrg: i % 4 === 0 ? '메디컬 유통' : i % 4 === 1 ? '서울미래의원' : undefined,
}));

// Mock 필터 섹션
function MockFilterSection({
  startDate,
  endDate,
  actionType,
  activeFilterCount,
  onStartDateChange,
  onEndDateChange,
  onActionTypeChange,
  onApply,
  onReset,
}: {
  startDate: Date | undefined;
  endDate: Date | undefined;
  actionType: string;
  activeFilterCount: number;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onActionTypeChange: (type: string) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  const actionTypeOptions: ComboboxOption[] = [
    { value: 'all', label: '전체' },
    { value: 'SHIPPED', label: '출고' },
    { value: 'RECEIVED', label: '입고' },
    { value: 'TREATED', label: '시술' },
    { value: 'RECALLED', label: '회수' },
  ];

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">필터</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="h-4 w-4 mr-1" />
            초기화
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label className="text-xs">시작일</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !startDate && 'text-muted-foreground'
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'yyyy.MM.dd', { locale: ko }) : '선택'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={startDate}
                onSelect={onStartDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">종료일</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !endDate && 'text-muted-foreground'
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'yyyy.MM.dd', { locale: ko }) : '선택'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={endDate}
                onSelect={onEndDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">이벤트 유형</Label>
          <Combobox
            options={actionTypeOptions}
            value={actionType}
            onValueChange={onActionTypeChange}
            placeholder="전체"
            searchPlaceholder="유형 검색..."
          />
        </div>

        <div className="flex items-end">
          <Button onClick={onApply} className="w-full">
            <Search className="h-4 w-4 mr-2" />
            조회
          </Button>
        </div>
      </div>
    </div>
  );
}

// Mock HistoryPageWrapper
function MockHistoryPageWrapper() {
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 3));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [actionType, setActionType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const activeFilterCount = [startDate, endDate, actionType !== 'all'].filter(Boolean).length;

  const handleApply = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleReset = () => {
    setStartDate(subDays(new Date(), 3));
    setEndDate(new Date());
    setActionType('all');
  };

  return (
    <div className="space-y-6">
      <MockFilterSection
        startDate={startDate}
        endDate={endDate}
        actionType={actionType}
        activeFilterCount={activeFilterCount}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onActionTypeChange={setActionType}
        onApply={handleApply}
        onReset={handleReset}
      />

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{mockHistories.length}</span>
          건 (페이지 {currentPage})
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsLoading(true);
            setTimeout(() => setIsLoading(false), 500);
          }}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* 히스토리 테이블 (간단한 형태) */}
      <div className="rounded-md border">
        <div className="divide-y">
          {mockHistories.slice(0, 10).map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant={item.actionType === 'RECALLED' ? 'destructive' : 'secondary'}>
                  {item.actionTypeLabel}
                </Badge>
                <div>
                  <div className="text-sm font-medium">
                    {item.fromOrg} {item.toOrg && `→ ${item.toOrg}`}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(item.createdAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
                  </div>
                </div>
              </div>
              <div className="text-sm font-medium">{item.quantity}개</div>
            </div>
          ))}
        </div>
      </div>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-center gap-4 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          이전
        </Button>
        <span className="text-sm text-muted-foreground">
          페이지 <span className="font-medium text-foreground">{currentPage}</span>
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          다음
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// Empty 상태
function MockHistoryPageWrapperEmpty() {
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 3));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [actionType, setActionType] = useState<string>('all');

  const activeFilterCount = [startDate, endDate, actionType !== 'all'].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <MockFilterSection
        startDate={startDate}
        endDate={endDate}
        actionType={actionType}
        activeFilterCount={activeFilterCount}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onActionTypeChange={setActionType}
        onApply={() => {}}
        onReset={() => {
          setStartDate(subDays(new Date(), 3));
          setEndDate(new Date());
          setActionType('all');
        }}
      />

      <EmptyState
        title="거래 이력이 없습니다"
        description="선택한 기간에 해당하는 이력이 없습니다."
      />
    </div>
  );
}

const meta = {
  title: 'Shared/Pages/HistoryPageWrapper',
  component: MockHistoryPageWrapper,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MockHistoryPageWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  render: () => <MockHistoryPageWrapperEmpty />,
};

export const Note: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="p-4 bg-yellow-50 rounded-lg text-sm">
        <strong>참고:</strong> HistoryPageWrapper는 서버 액션과 라우터에 의존합니다.
        Storybook에서는 Mock 컴포넌트로 UI를 시뮬레이션합니다.
        <br /><br />
        <strong>실제 사용 예시:</strong>
        <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto">
{`<HistoryPageWrapper
  currentOrgId={organization.id}
  fetchHistoryCursor={fetchHistoryCursorAction}
  actionTypeOptions={[
    { value: 'SHIPPED', label: '출고' },
    { value: 'RECEIVED', label: '입고' },
  ]}
  showReturnButton={true}
  onReturn={returnAction}
/>`}
        </pre>
      </div>
      <MockHistoryPageWrapper />
    </div>
  ),
};
