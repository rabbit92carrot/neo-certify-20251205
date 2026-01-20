'use client';

/**
 * 메시지함 View 컴포넌트
 * Admin/Manufacturer 공통 메시지함 페이지 뷰 (props 기반)
 */

import { PageHeader } from '@/components/shared/PageHeader';
import { OrganizationAlertTable } from '@/components/tables/OrganizationAlertTable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { OrganizationAlert, PaginatedResponse } from '@/types/api.types';

export interface InboxViewProps {
  /** 알림 목록 */
  alerts: OrganizationAlert[];
  /** 페이지 제목 */
  title?: string;
  /** 페이지 설명 */
  description?: string;
}

export function InboxView({
  alerts,
  title = '알림 보관함',
  description = '비활성 제품 사용 알림 및 시스템 메시지를 확인합니다.',
}: InboxViewProps): React.ReactElement {
  // Preview용 PaginatedResponse 구조로 변환
  const paginatedData: PaginatedResponse<OrganizationAlert> = {
    items: alerts,
    meta: {
      page: 1,
      pageSize: 20,
      total: alerts.length,
      totalPages: 1,
      hasMore: false,
    },
  };

  // Preview용 no-op 핸들러
  const handlePageChange = () => {};
  const handleMarkAsRead = () => {};
  const handleMarkSelectedAsRead = () => {};
  const handleViewDetail = () => {};

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />

      {/* 필터 영역 */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">상태:</span>
          <Select value="all" disabled>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="unread">안읽음</SelectItem>
              <SelectItem value="read">읽음</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">유형:</span>
          <Select value="all" disabled>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="INACTIVE_PRODUCT_USAGE">비활성 제품 사용</SelectItem>
              <SelectItem value="SYSTEM_NOTICE">시스템 공지</SelectItem>
              <SelectItem value="CUSTOM_MESSAGE">메시지</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 테이블 */}
      <OrganizationAlertTable
        data={paginatedData}
        isLoading={false}
        onPageChange={handlePageChange}
        onMarkAsRead={handleMarkAsRead}
        onMarkSelectedAsRead={handleMarkSelectedAsRead}
        onViewDetail={handleViewDetail}
      />
    </div>
  );
}
