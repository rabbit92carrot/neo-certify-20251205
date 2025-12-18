'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition, useEffect } from 'react';
import { OrganizationAlertTable } from '@/components/tables/OrganizationAlertTable';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  getOrganizationAlertsAction,
  markAlertAsReadAction,
  markAlertsAsReadAction,
  markAllAlertsAsReadAction,
} from '../actions';
import type { OrganizationAlert, PaginatedResponse } from '@/types/api.types';
import { ALERT_TYPE_LABELS } from '@/types/api.types';

interface InboxTableWrapperProps {
  page: number;
  isRead?: boolean;
  alertType?: string;
}

export function InboxTableWrapper({
  page: initialPage,
  isRead: initialIsRead,
  alertType: initialAlertType,
}: InboxTableWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<PaginatedResponse<OrganizationAlert> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [readFilter, setReadFilter] = useState<string>(
    initialIsRead === undefined ? 'all' : initialIsRead ? 'read' : 'unread'
  );
  const [typeFilter, setTypeFilter] = useState<string>(initialAlertType || 'all');

  // 상세 보기 모달
  const [selectedAlert, setSelectedAlert] = useState<OrganizationAlert | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 데이터 로드
  const loadData = async (page: number, isRead?: boolean, alertType?: string) => {
    setIsLoading(true);
    const result = await getOrganizationAlertsAction({
      page,
      isRead,
      alertType: alertType === 'all' ? undefined : alertType,
    });
    if (result.success && result.data) {
      setData(result.data);
    }
    setIsLoading(false);
  };

  // 초기 로드
  useEffect(() => {
    void loadData(
      initialPage,
      initialIsRead,
      initialAlertType === 'all' ? undefined : initialAlertType
    );
  }, [initialPage, initialIsRead, initialAlertType]);

  // URL 파라미터 업데이트
  const updateUrl = (params: Record<string, string | undefined>) => {
    const urlParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === 'all') {
        urlParams.delete(key);
      } else {
        urlParams.set(key, value);
      }
    });
    return urlParams.toString();
  };

  // 읽음 필터 변경
  const handleReadFilterChange = (value: string) => {
    setReadFilter(value);
    const isRead = value === 'all' ? undefined : value === 'read';
    const newUrl = updateUrl({
      page: undefined,
      isRead: value === 'all' ? undefined : String(value === 'read'),
    });

    startTransition(() => {
      router.push(`/manufacturer/inbox${newUrl ? `?${newUrl}` : ''}`);
      loadData(1, isRead, typeFilter === 'all' ? undefined : typeFilter);
    });
  };

  // 유형 필터 변경
  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    const newUrl = updateUrl({
      page: undefined,
      type: value === 'all' ? undefined : value,
    });

    startTransition(() => {
      router.push(`/manufacturer/inbox${newUrl ? `?${newUrl}` : ''}`);
      loadData(
        1,
        readFilter === 'all' ? undefined : readFilter === 'read',
        value === 'all' ? undefined : value
      );
    });
  };

  // 페이지 변경
  const handlePageChange = (page: number) => {
    const newUrl = updateUrl({ page: String(page) });

    startTransition(() => {
      router.push(`/manufacturer/inbox?${newUrl}`);
      loadData(
        page,
        readFilter === 'all' ? undefined : readFilter === 'read',
        typeFilter === 'all' ? undefined : typeFilter
      );
    });
  };

  // 읽음 처리
  const handleMarkAsRead = async (alertId: string) => {
    const result = await markAlertAsReadAction(alertId);
    if (result.success) {
      loadData(
        data?.meta.page || 1,
        readFilter === 'all' ? undefined : readFilter === 'read',
        typeFilter === 'all' ? undefined : typeFilter
      );
    }
  };

  // 선택 항목 읽음 처리
  const handleMarkSelectedAsRead = async (alertIds: string[]) => {
    const result = await markAlertsAsReadAction(alertIds);
    if (result.success) {
      loadData(
        data?.meta.page || 1,
        readFilter === 'all' ? undefined : readFilter === 'read',
        typeFilter === 'all' ? undefined : typeFilter
      );
    }
  };

  // 전체 읽음 처리
  const handleMarkAllAsRead = async () => {
    const result = await markAllAlertsAsReadAction();
    if (result.success) {
      loadData(
        data?.meta.page || 1,
        readFilter === 'all' ? undefined : readFilter === 'read',
        typeFilter === 'all' ? undefined : typeFilter
      );
    }
  };

  // 상세 보기
  const handleViewDetail = async (alert: OrganizationAlert) => {
    setSelectedAlert(alert);
    setIsDetailOpen(true);

    // 읽지 않은 알림이면 읽음 처리
    if (!alert.isRead) {
      await markAlertAsReadAction(alert.id);
      loadData(
        data?.meta.page || 1,
        readFilter === 'all' ? undefined : readFilter === 'read',
        typeFilter === 'all' ? undefined : typeFilter
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">상태:</span>
          <Select value={readFilter} onValueChange={handleReadFilterChange}>
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
          <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
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

        {readFilter === 'unread' && data && data.items.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={isPending}
          >
            모두 읽음 처리
          </Button>
        )}
      </div>

      {/* 테이블 */}
      <OrganizationAlertTable
        data={data}
        isLoading={isLoading || isPending}
        onPageChange={handlePageChange}
        onMarkAsRead={handleMarkAsRead}
        onMarkSelectedAsRead={handleMarkSelectedAsRead}
        onViewDetail={handleViewDetail}
      />

      {/* 상세 보기 모달 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAlert?.title}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 pt-2">
              <Badge variant="outline">
                {selectedAlert && ALERT_TYPE_LABELS[selectedAlert.alertType]}
              </Badge>
              <span className="text-muted-foreground">
                {selectedAlert &&
                  format(new Date(selectedAlert.createdAt), 'yyyy년 M월 d일 HH:mm', {
                    locale: ko,
                  })}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* 본문 */}
            <div className="text-sm whitespace-pre-wrap">{selectedAlert?.content}</div>

            {/* 메타데이터 (있는 경우) */}
            {selectedAlert?.metadata && Object.keys(selectedAlert.metadata).length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">상세 정보</h4>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  {selectedAlert.metadata.productName && (
                    <>
                      <dt className="text-muted-foreground">제품명</dt>
                      <dd>{selectedAlert.metadata.productName as string}</dd>
                    </>
                  )}
                  {selectedAlert.metadata.organizationName && (
                    <>
                      <dt className="text-muted-foreground">사용 조직</dt>
                      <dd>{selectedAlert.metadata.organizationName as string}</dd>
                    </>
                  )}
                  {selectedAlert.metadata.quantity && (
                    <>
                      <dt className="text-muted-foreground">수량</dt>
                      <dd>{selectedAlert.metadata.quantity as number}개</dd>
                    </>
                  )}
                  {selectedAlert.metadata.usageType && (
                    <>
                      <dt className="text-muted-foreground">사용 유형</dt>
                      <dd>
                        {selectedAlert.metadata.usageType === 'SHIPMENT' ? '출고' : '시술'}
                      </dd>
                    </>
                  )}
                </dl>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
