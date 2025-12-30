'use client';

/**
 * 관리자 이벤트 요약 필터 컴포넌트
 * 기간, 이벤트 타입, Lot 번호, 조직, 제품 필터
 *
 * 성능 최적화:
 * - 조직/제품 필터: Lazy Load 방식 (2글자 이상 입력 시 서버 검색)
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, Search, X, Filter, Building2, Hospital, Factory } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import {
  SearchableCombobox,
  type SearchableComboboxOption,
} from '@/components/ui/searchable-combobox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  searchOrganizationsAction,
  searchProductsAction,
} from '@/app/(dashboard)/admin/actions';
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
  products: { id: string; name: string; modelName: string; manufacturerName: string }[];
}

export function AdminEventSummaryFilter({
  organizations,
  products,
}: AdminEventSummaryFilterProps): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 필터 상태 (기본값: 3일 전~오늘)
  const [startDate, setStartDate] = useState<Date | undefined>(() => subDays(new Date(), 3));
  const [endDate, setEndDate] = useState<Date | undefined>(() => new Date());
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
      // URL에 날짜가 없으면 기본값 (3일 전~오늘) 사용
      setStartDate(start ? new Date(start) : subDays(new Date(), 3));
      setEndDate(end ? new Date(end) : new Date());

      // actionTypes는 콤마로 구분된 문자열
      const types = searchParams.get('actionTypes');
      setActionTypes(types ? types.split(',').filter(Boolean) : []);

      setLotNumber(searchParams.get('lotNumber') ?? '');
      setOrganizationId(searchParams.get('organizationId') ?? '');
      setProductId(searchParams.get('productId') ?? '');
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

  // 필터 초기화 (기본값: 3일 전~오늘로 리셋)
  const resetFilters = useCallback(() => {
    setStartDate(subDays(new Date(), 3));
    setEndDate(new Date());
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

  // 조직 검색 함수 (Lazy Load)
  const handleOrganizationSearch = useCallback(
    async (query: string): Promise<SearchableComboboxOption[]> => {
      const result = await searchOrganizationsAction(query, 20);
      if (result.success && result.data) {
        return result.data.map((org) => ({
          value: org.id,
          label: org.name,
          icon: getOrgIcon(org.type),
        }));
      }
      return [];
    },
    [getOrgIcon]
  );

  // 제품 검색 함수 (Lazy Load)
  const handleProductSearch = useCallback(
    async (query: string): Promise<SearchableComboboxOption[]> => {
      const result = await searchProductsAction(query, 20);
      if (result.success && result.data) {
        return result.data.map((product) => ({
          value: product.id,
          label: product.modelName,
          description: `${product.name} · ${product.manufacturerName}`,
        }));
      }
      return [];
    },
    []
  );

  // 초기 조직 옵션 (이미 선택된 값 표시용)
  const initialOrgOptions: SearchableComboboxOption[] = useMemo(
    () =>
      organizations
        .filter((org) => org.id === organizationId)
        .map((org) => ({
          value: org.id,
          label: org.name,
          icon: getOrgIcon(org.type),
        })),
    [organizations, organizationId, getOrgIcon]
  );

  // 초기 제품 옵션 (이미 선택된 값 표시용)
  const initialProductOptions: SearchableComboboxOption[] = useMemo(
    () =>
      products
        .filter((product) => product.id === productId)
        .map((product) => ({
          value: product.id,
          label: product.modelName,
          description: `${product.name} · ${product.manufacturerName}`,
        })),
    [products, productId]
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

        {/* 조직 (Lazy Load 검색) */}
        <div className="space-y-2">
          <Label className="text-xs">관련 조직</Label>
          <SearchableCombobox
            value={organizationId}
            onValueChange={setOrganizationId}
            onSearch={handleOrganizationSearch}
            defaultOption={{ value: '', label: '전체' }}
            initialOptions={initialOrgOptions}
            placeholder="전체"
            searchPlaceholder="조직명 검색 (2자 이상)..."
            emptyMessage="검색 결과가 없습니다."
            minCharsMessage="2글자 이상 입력하세요."
          />
        </div>

        {/* 제품 종류 (Lazy Load 검색) */}
        <div className="space-y-2">
          <Label className="text-xs">제품 종류</Label>
          <SearchableCombobox
            value={productId}
            onValueChange={setProductId}
            onSearch={handleProductSearch}
            defaultOption={{ value: '', label: '전체' }}
            initialOptions={initialProductOptions}
            placeholder="전체"
            searchPlaceholder="제품 검색 (2자 이상)..."
            emptyMessage="검색 결과가 없습니다."
            minCharsMessage="2글자 이상 입력하세요."
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
