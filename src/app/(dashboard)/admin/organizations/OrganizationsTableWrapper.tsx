'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OrganizationsTable } from '@/components/tables/OrganizationsTable';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import {
  approveOrganizationAction,
  deactivateOrganizationAction,
  activateOrganizationAction,
  deleteOrganizationAction,
} from '../actions';
import * as adminService from '@/services/admin.service';
import type { OrganizationWithStats } from '@/types/api.types';
import {
  ORGANIZATION_STATUS_LABELS,
  ORGANIZATION_TYPE_LABELS,
  ORGANIZATION_STATUSES,
  ORGANIZATION_TYPES,
} from '@/constants/organization';

interface OrganizationsTableWrapperProps {
  status?: string;
  type?: string;
  search?: string;
  page?: number;
}

export function OrganizationsTableWrapper({
  status,
  type,
  search,
  page = 1,
}: OrganizationsTableWrapperProps): React.ReactElement {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [organizations, setOrganizations] = useState<OrganizationWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(search || '');

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    const result = await adminService.getOrganizations({
      page,
      pageSize: 20,
      status: status as 'PENDING_APPROVAL' | 'ACTIVE' | 'INACTIVE' | 'DELETED' | undefined,
      type: type as 'MANUFACTURER' | 'DISTRIBUTOR' | 'HOSPITAL' | undefined,
      search,
    });
    if (result.success && result.data) {
      setOrganizations(result.data.items);
    }
    setLoading(false);
  }, [page, status, type, search]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const updateUrl = (params: { status?: string; type?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.type) searchParams.set('type', params.type);
    if (params.search) searchParams.set('search', params.search);
    router.push(`/admin/organizations?${searchParams.toString()}`);
  };

  const handleApprove = async (id: string) => {
    startTransition(async () => {
      await approveOrganizationAction(id);
      fetchOrganizations();
    });
  };

  const handleDeactivate = async (id: string) => {
    startTransition(async () => {
      await deactivateOrganizationAction(id);
      fetchOrganizations();
    });
  };

  const handleActivate = async (id: string) => {
    startTransition(async () => {
      await activateOrganizationAction(id);
      fetchOrganizations();
    });
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      await deleteOrganizationAction(id);
      fetchOrganizations();
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ status, type, search: searchInput });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
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

        <Select
          value={status || ''}
          onValueChange={(value) => updateUrl({ status: value, type, search })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="상태 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">전체 상태</SelectItem>
            {Object.entries(ORGANIZATION_STATUSES).map(([key, value]) => (
              <SelectItem key={key} value={value}>
                {ORGANIZATION_STATUS_LABELS[value as keyof typeof ORGANIZATION_STATUS_LABELS]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={type || ''}
          onValueChange={(value) => updateUrl({ status, type: value, search })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="유형 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">전체 유형</SelectItem>
            {Object.entries(ORGANIZATION_TYPES)
              .filter(([key]) => key !== 'ADMIN')
              .map(([key, value]) => (
                <SelectItem key={key} value={value}>
                  {ORGANIZATION_TYPE_LABELS[value as keyof typeof ORGANIZATION_TYPE_LABELS]}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* 테이블 */}
      <OrganizationsTable
        organizations={organizations}
        onApprove={handleApprove}
        onDeactivate={handleDeactivate}
        onActivate={handleActivate}
        onDelete={handleDelete}
      />
    </div>
  );
}
