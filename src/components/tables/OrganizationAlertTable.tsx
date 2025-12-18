'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Pagination } from '@/components/shared/Pagination';
import type { OrganizationAlert, PaginatedResponse } from '@/types/api.types';
import { ALERT_TYPE_LABELS } from '@/types/api.types';
import {
  Mail,
  MailOpen,
  AlertTriangle,
  Bell,
  MessageSquare,
  Eye,
} from 'lucide-react';

interface OrganizationAlertTableProps {
  data: PaginatedResponse<OrganizationAlert> | null;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onMarkAsRead?: (alertId: string) => void;
  onMarkSelectedAsRead?: (alertIds: string[]) => void;
  onViewDetail?: (alert: OrganizationAlert) => void;
}

export function OrganizationAlertTable({
  data,
  isLoading,
  onPageChange,
  onMarkAsRead,
  onMarkSelectedAsRead,
  onViewDetail,
}: OrganizationAlertTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 알림 유형별 아이콘
  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'INACTIVE_PRODUCT_USAGE':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'SYSTEM_NOTICE':
        return <Bell className="h-4 w-4 text-blue-500" />;
      case 'CUSTOM_MESSAGE':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  // 체크박스 토글
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (!data) return;
    const unreadIds = data.items.filter((a) => !a.isRead).map((a) => a.id);
    if (selectedIds.size === unreadIds.length && unreadIds.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unreadIds));
    }
  };

  // 읽음 처리
  const handleMarkAsRead = async (alertId: string) => {
    if (!onMarkAsRead) return;
    setProcessingId(alertId);
    await onMarkAsRead(alertId);
    setProcessingId(null);
    // 선택 해제
    const newSelected = new Set(selectedIds);
    newSelected.delete(alertId);
    setSelectedIds(newSelected);
  };

  // 선택 항목 읽음 처리
  const handleMarkSelectedAsRead = async () => {
    if (!onMarkSelectedAsRead || selectedIds.size === 0) return;
    await onMarkSelectedAsRead(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <MailOpen className="h-12 w-12 mb-4" />
        <p>알림이 없습니다.</p>
      </div>
    );
  }

  const unreadItems = data.items.filter((a) => !a.isRead);
  const allUnreadSelected =
    unreadItems.length > 0 && selectedIds.size === unreadItems.length;

  return (
    <div className="space-y-4">
      {/* 선택 항목 작업 */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 p-3 bg-muted rounded-md">
          <span className="text-sm font-medium">{selectedIds.size}개 선택됨</span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkSelectedAsRead}
          >
            선택 항목 읽음 처리
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={allUnreadSelected}
                  onCheckedChange={toggleSelectAll}
                  disabled={unreadItems.length === 0}
                />
              </TableHead>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="w-[120px]">유형</TableHead>
              <TableHead>제목</TableHead>
              <TableHead className="w-[160px]">일시</TableHead>
              <TableHead className="w-[100px]">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-16" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              data.items.map((alert) => (
                <TableRow
                  key={alert.id}
                  className={alert.isRead ? 'opacity-60' : 'font-medium'}
                >
                  <TableCell>
                    {!alert.isRead && (
                      <Checkbox
                        checked={selectedIds.has(alert.id)}
                        onCheckedChange={() => toggleSelect(alert.id)}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {alert.isRead ? (
                      <MailOpen className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Mail className="h-4 w-4 text-primary" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getAlertTypeIcon(alert.alertType)}
                      <Badge variant="outline" className="font-normal">
                        {ALERT_TYPE_LABELS[alert.alertType]}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <button
                      className="text-left hover:underline cursor-pointer"
                      onClick={() => onViewDetail?.(alert)}
                    >
                      {alert.title}
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(alert.createdAt), 'yyyy-MM-dd HH:mm', {
                      locale: ko,
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewDetail?.(alert)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!alert.isRead && onMarkAsRead && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkAsRead(alert.id)}
                          disabled={processingId === alert.id}
                        >
                          {processingId === alert.id ? '...' : '읽음'}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 */}
      {data.meta.totalPages > 1 && (
        <Pagination
          currentPage={data.meta.page}
          totalPages={data.meta.totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
