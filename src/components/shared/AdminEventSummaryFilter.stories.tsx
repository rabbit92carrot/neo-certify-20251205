'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, Search, X, Filter, Building2, Hospital, Factory } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

/**
 * AdminEventSummaryFilter 컴포넌트는 Next.js Router와 Server Actions에 의존합니다.
 * Storybook에서는 이러한 의존성을 mock하여 UI를 시뮬레이션합니다.
 */

const EVENT_TYPE_OPTIONS = [
  { value: 'PRODUCED', label: '생산' },
  { value: 'SHIPPED', label: '출고' },
  { value: 'RECEIVED', label: '입고' },
  { value: 'TREATED', label: '시술' },
  { value: 'RECALLED', label: '회수' },
  { value: 'DISPOSED', label: '폐기' },
] as const;

// Mock 필터 컴포넌트 (Storybook용)
function MockAdminEventSummaryFilter() {
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 3));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [lotNumber, setLotNumber] = useState<string>('');
  const [organizationId, setOrganizationId] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [includeRecalled, setIncludeRecalled] = useState<boolean>(true);

  const toggleActionType = (type: string) => {
    setActionTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const activeFilterCount = [
    startDate,
    endDate,
    actionTypes.length > 0,
    lotNumber.trim(),
    organizationId,
    productId,
    !includeRecalled,
  ].filter(Boolean).length;

  const organizationOptions: ComboboxOption[] = [
    { value: '', label: '전체' },
    { value: 'org-001', label: '네오메디컬', icon: <Factory className="h-4 w-4" /> },
    { value: 'org-002', label: '메디컬 유통', icon: <Building2 className="h-4 w-4" /> },
    { value: 'org-003', label: '서울미래의원', icon: <Hospital className="h-4 w-4" /> },
  ];

  const productOptions: ComboboxOption[] = [
    { value: '', label: '전체' },
    { value: 'prod-001', label: 'PDO-A-100', description: 'PDO Thread Type A · 네오메디컬' },
    { value: 'prod-002', label: 'PDO-B-200', description: 'PDO Thread Type B · 네오메디컬' },
  ];

  const recallOptions: ComboboxOption[] = [
    { value: 'true', label: '포함' },
    { value: 'false', label: '제외' },
  ];

  const resetFilters = () => {
    setStartDate(subDays(new Date(), 3));
    setEndDate(new Date());
    setActionTypes([]);
    setLotNumber('');
    setOrganizationId('');
    setProductId('');
    setIncludeRecalled(true);
  };

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
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X className="h-4 w-4 mr-1" />
            초기화
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 시작일 */}
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
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* 종료일 */}
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
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Lot 번호 */}
        <div className="space-y-2">
          <Label className="text-xs">Lot 번호</Label>
          <Input
            placeholder="LOT 번호 검색..."
            value={lotNumber}
            onChange={(e) => setLotNumber(e.target.value)}
            className="h-10"
          />
        </div>

        {/* 조직 */}
        <div className="space-y-2">
          <Label className="text-xs">관련 조직</Label>
          <Combobox
            options={organizationOptions}
            value={organizationId}
            onValueChange={setOrganizationId}
            placeholder="전체"
            searchPlaceholder="조직명 검색..."
          />
        </div>

        {/* 제품 */}
        <div className="space-y-2">
          <Label className="text-xs">제품 종류</Label>
          <Combobox
            options={productOptions}
            value={productId}
            onValueChange={setProductId}
            placeholder="전체"
            searchPlaceholder="제품 검색..."
          />
        </div>

        {/* 회수 포함 */}
        <div className="space-y-2">
          <Label className="text-xs">회수 이력</Label>
          <Combobox
            options={recallOptions}
            value={includeRecalled ? 'true' : 'false'}
            onValueChange={(v) => setIncludeRecalled(v === 'true')}
            placeholder="선택"
            searchPlaceholder="검색..."
          />
        </div>
      </div>

      {/* 이벤트 타입 */}
      <div className="space-y-2">
        <Label className="text-xs">이벤트 타입</Label>
        <div className="flex flex-wrap gap-3">
          {EVENT_TYPE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <Checkbox
                checked={actionTypes.includes(option.value)}
                onCheckedChange={() => toggleActionType(option.value)}
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
        {actionTypes.length === 0 && (
          <p className="text-xs text-muted-foreground">
            선택하지 않으면 모든 이벤트 타입이 표시됩니다.
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={() => alert('필터 조회 (Mock)')}>
          <Search className="h-4 w-4 mr-2" />
          조회
        </Button>
      </div>
    </div>
  );
}

const meta = {
  title: 'Shared/Filters/AdminEventSummaryFilter',
  component: MockAdminEventSummaryFilter,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MockAdminEventSummaryFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Note: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="p-4 bg-yellow-50 rounded-lg text-sm">
        <strong>참고:</strong> AdminEventSummaryFilter는 Next.js Router와 Server Actions에 의존합니다.
        Storybook에서는 Mock 컴포넌트로 UI를 시뮬레이션합니다.
      </div>
      <MockAdminEventSummaryFilter />
    </div>
  ),
};
