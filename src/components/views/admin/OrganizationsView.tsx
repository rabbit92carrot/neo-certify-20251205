'use client';

/**
 * 조직 관리 View 컴포넌트
 * Admin 조직 관리 페이지 뷰 (props 기반)
 */

import { Search, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { OrganizationsTable } from '@/components/tables/OrganizationsTable';
import { StatCard } from '@/components/shared/StatCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { OrganizationWithStats } from '@/types/api.types';

export interface OrganizationsViewProps {
  /** 조직 목록 */
  organizations: OrganizationWithStats[];
  /** 상태별 통계 */
  statusCounts: {
    active: number;
    inactive: number;
    pendingApproval: number;
    deleted: number;
  };
}

export function OrganizationsView({
  organizations,
  statusCounts,
}: OrganizationsViewProps): React.ReactElement {
  // Preview용 no-op 핸들러
  const handleApprove = async () => {};
  const handleDeactivate = async () => {};
  const handleActivate = async () => {};
  const handleDelete = async () => {};

  return (
    <div className="space-y-6">
      {/* 상태별 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="활성 조직"
          value={statusCounts.active.toLocaleString()}
          icon={CheckCircle}
        />
        <StatCard
          title="비활성 조직"
          value={statusCounts.inactive.toLocaleString()}
          icon={XCircle}
        />
        <StatCard
          title="승인 대기"
          value={statusCounts.pendingApproval.toLocaleString()}
          icon={Clock}
        />
        <StatCard
          title="삭제됨"
          value={statusCounts.deleted.toLocaleString()}
          icon={Trash2}
        />
      </div>

      {/* 필터 영역 */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="조직명, 이메일 검색..."
            className="pl-10"
            disabled
          />
        </div>

        <div className="w-[180px]">
          <Select value="all" disabled>
            <SelectTrigger>
              <SelectValue placeholder="상태 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="ACTIVE">활성</SelectItem>
              <SelectItem value="INACTIVE">비활성</SelectItem>
              <SelectItem value="PENDING_APPROVAL">승인대기</SelectItem>
              <SelectItem value="DELETED">삭제</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-[180px]">
          <Select value="all" disabled>
            <SelectTrigger>
              <SelectValue placeholder="유형 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 유형</SelectItem>
              <SelectItem value="MANUFACTURER">제조사</SelectItem>
              <SelectItem value="DISTRIBUTOR">유통사</SelectItem>
              <SelectItem value="HOSPITAL">병원</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
