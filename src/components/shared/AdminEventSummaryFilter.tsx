'use client';

/**
 * 관리자 이벤트 요약 필터 컴포넌트
 * 기간, 이벤트 타입, Lot 번호, 조직, 제품 필터
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
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
import type { OrganizationType } from '@/types/api.types';

// 이벤트 타입 정의
const EVENT_TYPE_OPTIONS = [
  { value: 'PRODUCED', label: '생산' },
  { value: 'SHIPPED', label: '출고' },
  { value: 'RECEIVED', label: '입고' },
  { value: 'TREATED', label: '시술' },
  { value: 'RECALLED', label: '회수' },
  { value: 'DISPOSED', label: '폐기' },
] as const;

interface AdminEventSummaryFilterProps {
  organizations: { id: string; name: string; type: OrganizationType }[];
  products: { id: string; name: string; manufacturerName: string }[];
}

export function AdminEventSummaryFilter({
  organizations,
  products,
}: AdminEventSummaryFilterProps): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 필터 상태
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [lotNumber, setLotNumber] = useState<string>('');
  const [organizationId, setOrganizationId] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [includeRecalled, setIncludeRecalled] = useState<boolean>(true);

  // URL에서 초기값 로드
  useEffect(() => {
    let ignore = false;

    const syncFromUrl = (): void => {
      if (ignore) {return;}

      const start = searchParams.get('startDate');
      const end = searchParams.get('endDate');
      setStartDate(start ? new Date(start) : undefined);
      setEndDate(end ? new Date(end) : undefined);

      // actionTypes는 콤마로 구분된 문자열
      const types = searchParams.get('actionTypes');
      setActionTypes(types ? types.split(',').filter(Boolean) : []);

      setLotNumber(searchParams.get('lotNumber') || '');
      setOrganizationId(searchParams.get('organizationId') || '');
      setProductId(searchParams.get('productId') || '');
      setIncludeRecalled(searchParams.get('includeRecalled') !== 'false');
    };

    syncFromUrl();

    return (): void => {
      ignore = true;
    };
  }, [searchParams]);

  // 필터 적용
  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (startDate) {params.set('startDate', format(startDate, 'yyyy-MM-dd'));}
    if (endDate) {params.set('endDate', format(endDate, 'yyyy-MM-dd'));}
    if (actionTypes.length > 0) {params.set('actionTypes', actionTypes.join(','));}
    if (lotNumber.trim()) {params.set('lotNumber', lotNumber.trim());}
    if (organizationId) {params.set('organizationId', organizationId);}
    if (productId) {params.set('productId', productId);}
    if (!includeRecalled) {params.set('includeRecalled', 'false');}

    router.push(`/admin/history?${params.toString()}`);
  }, [startDate, endDate, actionTypes, lotNumber, organizationId, productId, includeRecalled, router]);

  // 필터 초기화
  const resetFilters = useCallback(() => {
    setStartDate(undefined);
    setEndDate(undefined);
    setActionTypes([]);
    setLotNumber('');
    setOrganizationId('');
    setProductId('');
    setIncludeRecalled(true);
    router.push('/admin/history');
  }, [router]);

  // 이벤트 타입 토글
  const toggleActionType = useCallback((type: string) => {
    setActionTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  // 활성 필터 수 계산
  const activeFilterCount = [
    startDate,
    endDate,
    actionTypes.length > 0,
    lotNumber.trim(),
    organizationId,
    productId,
    !includeRecalled,
  ].filter(Boolean).length;

  // 조직 아이콘 헬퍼
  const getOrgIcon = useCallback((type: OrganizationType) => {
    switch (type) {
      case 'MANUFACTURER':
        return <Factory className="h-4 w-4" />;
      case 'HOSPITAL':
        return <Hospital className="h-4 w-4" />;
      default:
        return <Building2 className="h-4 w-4" />;
    }
  }, []);

  // 조직 옵션 (출발지/도착지 통합)
  const organizationOptions: ComboboxOption[] = useMemo(
    () => [
      { value: '', label: '전체' },
      ...organizations.map((org) => ({
        value: org.id,
        label: org.name,
        icon: getOrgIcon(org.type),
      })),
    ],
    [organizations, getOrgIcon]
  );

  // 제품 옵션
  const productOptions: ComboboxOption[] = useMemo(
    () => [
      { value: '', label: '전체' },
      ...products.map((product) => ({
        value: product.id,
        label: product.name,
        description: product.manufacturerName,
      })),
    ],
    [products]
  );

  // 회수 이력 옵션
  const recallOptions: ComboboxOption[] = useMemo(
    () => [
      { value: 'true', label: '포함' },
      { value: 'false', label: '제외' },
    ],
    []
  );

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

        {/* Lot 번호 검색 */}
        <div className="space-y-2">
          <Label className="text-xs">Lot 번호</Label>
          <Input
            placeholder="LOT 번호 검색..."
            value={lotNumber}
            onChange={(e) => setLotNumber(e.target.value)}
            className="h-10"
          />
        </div>

        {/* 조직 (출발지/도착지 통합) */}
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

      {/* 이벤트 타입 멀티셀렉트 */}
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
        <Button onClick={applyFilters}>
          <Search className="h-4 w-4 mr-2" />
          조회
        </Button>
      </div>
    </div>
  );
}
