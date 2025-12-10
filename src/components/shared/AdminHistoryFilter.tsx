'use client';

/**
 * 관리자 전체 이력 필터 컴포넌트
 * 기간, 상태, 소유자, 제품 필터
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { cn } from '@/lib/utils';
import { VIRTUAL_CODE_STATUS_LABELS } from '@/constants/product';
import type { OrganizationType } from '@/types/api.types';

interface AdminHistoryFilterProps {
  organizations: { id: string; name: string; type: OrganizationType }[];
  products: { id: string; name: string; manufacturerName: string }[];
}

export function AdminHistoryFilter({
  organizations,
  products,
}: AdminHistoryFilterProps): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 필터 상태
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [currentOwnerId, setCurrentOwnerId] = useState<string>('');
  const [originalProducerId, setOriginalProducerId] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [includeRecalled, setIncludeRecalled] = useState<boolean>(true);

  // URL에서 초기값 로드
  useEffect(() => {
    let ignore = false;

    // 비동기 패턴으로 상태 업데이트 (race condition 방지)
    const syncFromUrl = (): void => {
      if (ignore) {return;}

      const start = searchParams.get('startDate');
      const end = searchParams.get('endDate');
      setStartDate(start ? new Date(start) : undefined);
      setEndDate(end ? new Date(end) : undefined);
      setCurrentStatus(searchParams.get('currentStatus') || '');
      setCurrentOwnerId(searchParams.get('currentOwnerId') || '');
      setOriginalProducerId(searchParams.get('originalProducerId') || '');
      setProductId(searchParams.get('productId') || '');
      setIncludeRecalled(searchParams.get('includeRecalled') !== 'false');
    };

    syncFromUrl();

    return (): void => {
      ignore = true;
    };
  }, [searchParams]);

  // 필터 적용
  const applyFilters = () => {
    const params = new URLSearchParams();
    if (startDate) {params.set('startDate', format(startDate, 'yyyy-MM-dd'));}
    if (endDate) {params.set('endDate', format(endDate, 'yyyy-MM-dd'));}
    if (currentStatus) {params.set('currentStatus', currentStatus);}
    if (currentOwnerId) {params.set('currentOwnerId', currentOwnerId);}
    if (originalProducerId) {params.set('originalProducerId', originalProducerId);}
    if (productId) {params.set('productId', productId);}
    if (!includeRecalled) {params.set('includeRecalled', 'false');}

    router.push(`/admin/history?${params.toString()}`);
  };

  // 필터 초기화
  const resetFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setCurrentStatus('');
    setCurrentOwnerId('');
    setOriginalProducerId('');
    setProductId('');
    setIncludeRecalled(true);
    router.push('/admin/history');
  };

  // 활성 필터 수 계산
  const activeFilterCount = [
    startDate,
    endDate,
    currentStatus,
    currentOwnerId,
    originalProducerId,
    productId,
    !includeRecalled,
  ].filter(Boolean).length;

  // 제조사 목록 (originalProducer 선택용)
  const manufacturers = organizations.filter((org) => org.type === 'MANUFACTURER');

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
        {/* 기간 - 시작일 */}
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

        {/* 기간 - 종료일 */}
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
          <Select value={currentStatus} onValueChange={setCurrentStatus}>
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              {Object.entries(VIRTUAL_CODE_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 현재 소유자 */}
        <div className="space-y-2">
          <Label className="text-xs">현재 소유자</Label>
          <Select value={currentOwnerId} onValueChange={setCurrentOwnerId}>
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 최초 생산자 */}
        <div className="space-y-2">
          <Label className="text-xs">최초 생산자</Label>
          <Select value={originalProducerId} onValueChange={setOriginalProducerId}>
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              {manufacturers.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 제품 종류 */}
        <div className="space-y-2">
          <Label className="text-xs">제품 종류</Label>
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name} ({product.manufacturerName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 회수 포함 */}
        <div className="space-y-2">
          <Label className="text-xs">회수 이력</Label>
          <Select
            value={includeRecalled ? 'true' : 'false'}
            onValueChange={(v) => setIncludeRecalled(v === 'true')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">포함</SelectItem>
              <SelectItem value="false">제외</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={applyFilters}>
          <Search className="h-4 w-4 mr-2" />
          조회
        </Button>
      </div>
    </div>
  );
}
