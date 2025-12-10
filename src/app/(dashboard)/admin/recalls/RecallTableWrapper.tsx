'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, Search, X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { RecallHistoryTable } from '@/components/tables/RecallHistoryTable';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import * as adminService from '@/services/admin.service';
import { cn } from '@/lib/utils';
import type { RecallHistoryItem } from '@/types/api.types';

interface RecallTableWrapperProps {
  page?: number;
  startDate?: string;
  endDate?: string;
  type?: 'shipment' | 'treatment' | 'all';
}

export function RecallTableWrapper({
  page = 1,
  startDate: initialStartDate,
  endDate: initialEndDate,
  type: initialType = 'all',
}: RecallTableWrapperProps): React.ReactElement {
  const router = useRouter();
  const [recalls, setRecalls] = useState<RecallHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 필터 상태
  const [startDate, setStartDate] = useState<Date | undefined>(
    initialStartDate ? new Date(initialStartDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialEndDate ? new Date(initialEndDate) : undefined
  );
  const [type, setType] = useState<'shipment' | 'treatment' | 'all'>(initialType);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await adminService.getRecallHistory({
      page,
      pageSize: 20,
      startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
      type,
    });

    if (result.success && result.data) {
      setRecalls(result.data.items);
    }
    setLoading(false);
  }, [page, startDate, endDate, type]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', format(startDate, 'yyyy-MM-dd'));
    if (endDate) params.set('endDate', format(endDate, 'yyyy-MM-dd'));
    if (type !== 'all') params.set('type', type);
    router.push(`/admin/recalls?${params.toString()}`);
  };

  const resetFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setType('all');
    router.push('/admin/recalls');
  };

  const activeFilterCount = [startDate, endDate, type !== 'all'].filter(Boolean).length;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* 필터 */}
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          {/* 유형 */}
          <div className="space-y-2">
            <Label className="text-xs">회수 유형</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="shipment">출고 회수</SelectItem>
                <SelectItem value="treatment">시술 회수</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button onClick={applyFilters} className="w-full">
              <Search className="h-4 w-4 mr-2" />
              조회
            </Button>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <RecallHistoryTable recalls={recalls} />
    </div>
  );
}
