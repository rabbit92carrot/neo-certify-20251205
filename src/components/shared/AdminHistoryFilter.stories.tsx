'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, Search, X, Filter, Building2, Hospital, Factory } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * AdminHistoryFilter 컴포넌트는 Next.js Router에 의존합니다.
 * Storybook에서는 Mock 컴포넌트로 UI를 시뮬레이션합니다.
 */

// Mock 필터 컴포넌트 (Storybook용)
function MockAdminHistoryFilter() {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [currentOwnerId, setCurrentOwnerId] = useState<string>('');
  const [originalProducerId, setOriginalProducerId] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [includeRecalled, setIncludeRecalled] = useState<boolean>(true);

  const activeFilterCount = [
    startDate,
    endDate,
    currentStatus,
    currentOwnerId,
    originalProducerId,
    productId,
    !includeRecalled,
  ].filter(Boolean).length;

  const statusOptions: ComboboxOption[] = [
    { value: '', label: '전체' },
    { value: 'IN_STOCK', label: '재고 중' },
    { value: 'USED', label: '사용됨' },
    { value: 'DISPOSED', label: '폐기됨' },
  ];

  const ownerOptions: ComboboxOption[] = [
    { value: '', label: '전체' },
    { value: 'org-001', label: '네오메디컬', icon: <Factory className="h-4 w-4" /> },
    { value: 'org-002', label: '메디컬 유통', icon: <Building2 className="h-4 w-4" /> },
    { value: 'org-003', label: '서울미래의원', icon: <Hospital className="h-4 w-4" /> },
  ];

  const manufacturerOptions: ComboboxOption[] = [
    { value: '', label: '전체' },
    { value: 'org-001', label: '네오메디컬', icon: <Factory className="h-4 w-4" /> },
  ];

  const productOptions: ComboboxOption[] = [
    { value: '', label: '전체' },
    { value: 'prod-001', label: 'PDO Thread Type A', description: '네오메디컬' },
    { value: 'prod-002', label: 'PDO Thread Type B', description: '네오메디컬' },
  ];

  const recallOptions: ComboboxOption[] = [
    { value: 'true', label: '포함' },
    { value: 'false', label: '제외' },
  ];

  const resetFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setCurrentStatus('');
    setCurrentOwnerId('');
    setOriginalProducerId('');
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

        {/* 현재 상태 */}
        <div className="space-y-2">
          <Label className="text-xs">현재 상태</Label>
          <Combobox
            options={statusOptions}
            value={currentStatus}
            onValueChange={setCurrentStatus}
            placeholder="전체"
            searchPlaceholder="상태 검색..."
          />
        </div>

        {/* 현재 소유자 */}
        <div className="space-y-2">
          <Label className="text-xs">현재 소유자</Label>
          <Combobox
            options={ownerOptions}
            value={currentOwnerId}
            onValueChange={setCurrentOwnerId}
            placeholder="전체"
            searchPlaceholder="조직명 검색..."
          />
        </div>

        {/* 최초 생산자 */}
        <div className="space-y-2">
          <Label className="text-xs">최초 생산자</Label>
          <Combobox
            options={manufacturerOptions}
            value={originalProducerId}
            onValueChange={setOriginalProducerId}
            placeholder="전체"
            searchPlaceholder="제조사 검색..."
          />
        </div>

        {/* 제품 종류 */}
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
  title: 'Shared/Filters/AdminHistoryFilter',
  component: MockAdminHistoryFilter,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MockAdminHistoryFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Note: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="p-4 bg-yellow-50 rounded-lg text-sm">
        <strong>참고:</strong> AdminHistoryFilter는 Next.js Router에 의존합니다.
        Storybook에서는 Mock 컴포넌트로 UI를 시뮬레이션합니다.
      </div>
      <MockAdminHistoryFilter />
    </div>
  ),
};
