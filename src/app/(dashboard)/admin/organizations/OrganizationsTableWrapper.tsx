'use client';

import { useState, useEffect, useTransition, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Factory, Building2, Hospital, CheckCircle, XCircle, Clock, Trash2, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { OrganizationsTable } from '@/components/tables/OrganizationsTable';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { StatCard } from '@/components/shared/StatCard';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import {
  approveOrganizationAction,
  deactivateOrganizationAction,
  activateOrganizationAction,
  deleteOrganizationAction,
  getOrganizationsAction,
  getOrganizationStatusCountsAction,
  refreshOrgCodeCountsAction,
} from '../actions';
import type { OrganizationWithStats, PaginationMeta } from '@/types/api.types';
import {
  ORGANIZATION_STATUS_LABELS,
  ORGANIZATION_TYPE_LABELS,
  ORGANIZATION_STATUSES,
  ORGANIZATION_TYPES,
} from '@/constants/organization';

interface StatusCounts {
  total: number;
  active: number;
  inactive: number;
  pendingApproval: number;
  deleted: number;
}

interface OrganizationsTableWrapperProps {
  status?: string;
  type?: string;
  search?: string;
  page?: number;
}

const PAGE_SIZE = 20;

export function OrganizationsTableWrapper({
  status,
  type,
  search,
  page = 1,
}: OrganizationsTableWrapperProps): React.ReactElement {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [organizations, setOrganizations] = useState<OrganizationWithStats[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [statusCounts, setStatusCounts] = useState<StatusCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(search ?? '');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let ignore = false;

    const fetchData = async (): Promise<void> => {
      setLoading(true);

      // 조직 목록과 상태별 통계를 병렬로 조회
      const [orgsResult, countsResult] = await Promise.all([
        getOrganizationsAction({
          page,
          pageSize: PAGE_SIZE,
          status: status as 'PENDING_APPROVAL' | 'ACTIVE' | 'INACTIVE' | 'DELETED' | undefined,
          type: type as 'MANUFACTURER' | 'DISTRIBUTOR' | 'HOSPITAL' | undefined,
          search,
        }),
        getOrganizationStatusCountsAction(),
      ]);

      if (!ignore) {
        if (orgsResult.success && orgsResult.data) {
          setOrganizations(orgsResult.data.items);
          setMeta(orgsResult.data.meta);
        }
        if (countsResult.success && countsResult.data) {
          setStatusCounts(countsResult.data);
        }
        setLoading(false);
      }
    };

    void fetchData();

    return (): void => {
      ignore = true;
    };
  }, [page, status, type, search, refreshKey]);

  const refreshData = (): void => {
    setRefreshKey((prev) => prev + 1);
  };

  /**
   * MV 수동 갱신 핸들러
   * 조직별 코드 카운트 Materialized View를 즉시 갱신하고 테이블 새로고침
   */
  const handleManualRefresh = async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      const result = await refreshOrgCodeCountsAction();
      if (result.success) {
        refreshData();
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const updateUrl = useCallback((params: { status?: string; type?: string; search?: string; page?: number }): void => {
    const searchParams = new URLSearchParams();
    if (params.page && params.page > 1) {
      searchParams.set('page', String(params.page));
    }
    if (params.status) {
      searchParams.set('status', params.status);
    }
    if (params.type) {
      searchParams.set('type', params.type);
    }
    if (params.search) {
      searchParams.set('search', params.search);
    }
    router.push(`/admin/organizations?${searchParams.toString()}`);
  }, [router]);

  const goToPage = useCallback((newPage: number): void => {
    updateUrl({ status, type, search, page: newPage });
  }, [status, type, search, updateUrl]);

  const handleApprove = async (id: string): Promise<void> => {
    startTransition(async () => {
      await approveOrganizationAction(id);
      refreshData();
    });
  };

  const handleDeactivate = async (id: string): Promise<void> => {
    startTransition(async () => {
      await deactivateOrganizationAction(id);
      refreshData();
    });
  };

  const handleActivate = async (id: string): Promise<void> => {
    startTransition(async () => {
      await activateOrganizationAction(id);
      refreshData();
    });
  };

  const handleDelete = async (id: string): Promise<void> => {
    startTransition(async () => {
      await deleteOrganizationAction(id);
      refreshData();
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ status, type, search: searchInput, page: 1 });
  };

  // 상태 옵션
  const statusOptions: ComboboxOption[] = useMemo(() => [
    { value: '', label: '전체 상태' },
    ...Object.entries(ORGANIZATION_STATUSES).map(([, value]) => ({
      value,
      label: ORGANIZATION_STATUS_LABELS[value as keyof typeof ORGANIZATION_STATUS_LABELS],
    })),
  ], []);

  // 유형 옵션
  const typeOptions: ComboboxOption[] = useMemo(() => {
    const getIcon = (orgType: string) => {
      switch (orgType) {
        case 'MANUFACTURER':
          return <Factory className="h-4 w-4" />;
        case 'HOSPITAL':
          return <Hospital className="h-4 w-4" />;
        default:
          return <Building2 className="h-4 w-4" />;
      }
    };

    return [
      { value: '', label: '전체 유형' },
      ...Object.entries(ORGANIZATION_TYPES)
        .filter(([key]) => key !== 'ADMIN')
        .map(([, value]) => ({
          value,
          label: ORGANIZATION_TYPE_LABELS[value as keyof typeof ORGANIZATION_TYPE_LABELS],
          icon: getIcon(value),
        })),
    ];
  }, []);

  // 페이지네이션 페이지 번호 생성
  const getPageNumbers = useCallback((): (number | 'ellipsis')[] => {
    if (!meta) {return [];}

    const { totalPages } = meta;
    const currentPage = page;
    const pages: (number | 'ellipsis')[] = [];

    if (totalPages <= 7) {
      // 7페이지 이하면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 처음 페이지
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      // 현재 페이지 주변
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      // 마지막 페이지
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  }, [meta, page]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* 상태별 통계 카드 */}
      {statusCounts && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="활성 조직"
            value={statusCounts.active.toLocaleString()}
            icon={CheckCircle}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => updateUrl({ status: 'ACTIVE', type, search, page: 1 })}
          />
          <StatCard
            title="비활성 조직"
            value={statusCounts.inactive.toLocaleString()}
            icon={XCircle}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => updateUrl({ status: 'INACTIVE', type, search, page: 1 })}
          />
          <StatCard
            title="승인 대기"
            value={statusCounts.pendingApproval.toLocaleString()}
            icon={Clock}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => updateUrl({ status: 'PENDING_APPROVAL', type, search, page: 1 })}
          />
          <StatCard
            title="삭제됨"
            value={statusCounts.deleted.toLocaleString()}
            icon={Trash2}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => updateUrl({ status: 'DELETED', type, search, page: 1 })}
          />
        </div>
      )}

      {/* 필터 */}
      <div className="flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="조직명, 이메일 검색..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>

        <div className="w-[180px]">
          <Combobox
            options={statusOptions}
            value={status || ''}
            onValueChange={(value) => updateUrl({ status: value, type, search, page: 1 })}
            placeholder="상태 선택"
            searchPlaceholder="상태 검색..."
          />
        </div>

        <div className="w-[180px]">
          <Combobox
            options={typeOptions}
            value={type || ''}
            onValueChange={(value) => updateUrl({ status, type: value, search, page: 1 })}
            placeholder="유형 선택"
            searchPlaceholder="유형 검색..."
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleManualRefresh}
          disabled={isRefreshing || loading}
          title="코드 수 통계 새로고침 (MV 갱신)"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* 테이블 */}
      <OrganizationsTable
        organizations={organizations}
        onApprove={handleApprove}
        onDeactivate={handleDeactivate}
        onActivate={handleActivate}
        onDelete={handleDelete}
      />

      {/* 페이지네이션 */}
      {meta && meta.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
          <p className="text-sm text-muted-foreground">
            총 {meta.total.toLocaleString()}개 중{' '}
            {((page - 1) * PAGE_SIZE + 1).toLocaleString()}-
            {Math.min(page * PAGE_SIZE, meta.total).toLocaleString()}개
          </p>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => page > 1 && goToPage(page - 1)}
                  className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>

              {getPageNumbers().map((pageNum, idx) => (
                <PaginationItem key={idx}>
                  {pageNum === 'ellipsis' ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      onClick={() => goToPage(pageNum)}
                      isActive={pageNum === page}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() => page < meta.totalPages && goToPage(page + 1)}
                  className={page === meta.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
