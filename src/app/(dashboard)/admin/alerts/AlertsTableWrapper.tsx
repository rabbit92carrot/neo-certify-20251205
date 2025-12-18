'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition, useEffect } from 'react';
import { InactiveProductUsageTable } from '@/components/tables/InactiveProductUsageTable';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { getInactiveProductUsageLogsAction, acknowledgeUsageLogAction, acknowledgeUsageLogsAction } from '../actions';
import type { InactiveProductUsageLog, PaginatedResponse } from '@/types/api.types';

interface AlertsTableWrapperProps {
  page: number;
  acknowledged?: boolean;
}

export function AlertsTableWrapper({
  page: initialPage,
  acknowledged: initialAcknowledged,
}: AlertsTableWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<PaginatedResponse<InactiveProductUsageLog> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>(
    initialAcknowledged === undefined ? 'all' : initialAcknowledged ? 'acknowledged' : 'unacknowledged'
  );

  // 데이터 로드
  const loadData = async (page: number, acknowledged?: boolean) => {
    setIsLoading(true);
    const result = await getInactiveProductUsageLogsAction({ page, acknowledged });
    if (result.success && result.data) {
      setData(result.data);
    }
    setIsLoading(false);
  };

  // 초기 로드
  useEffect(() => {
    void loadData(initialPage, initialAcknowledged);
  }, [initialPage, initialAcknowledged]);

  // 필터 변경
  const handleFilterChange = (value: string) => {
    setFilter(value);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');

    if (value === 'all') {
      params.delete('acknowledged');
    } else {
      params.set('acknowledged', value === 'acknowledged' ? 'true' : 'false');
    }

    startTransition(() => {
      router.push(`/admin/alerts?${params.toString()}`);
      loadData(1, value === 'all' ? undefined : value === 'acknowledged');
    });
  };

  // 페이지 변경
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());

    startTransition(() => {
      router.push(`/admin/alerts?${params.toString()}`);
      loadData(page, initialAcknowledged);
    });
  };

  // 확인 처리
  const handleAcknowledge = async (logId: string) => {
    const result = await acknowledgeUsageLogAction(logId);
    if (result.success) {
      // 리로드
      loadData(data?.meta.page || 1, initialAcknowledged);
    }
  };

  // 일괄 확인 처리
  const handleBulkAcknowledge = async () => {
    if (!data || data.items.length === 0) {
      return;
    }

    const unacknowledgedIds = data.items
      .filter(item => !item.acknowledgedAt)
      .map(item => item.id);

    if (unacknowledgedIds.length === 0) {
      toast.info('확인 처리할 항목이 없습니다.');
      return;
    }

    const result = await acknowledgeUsageLogsAction(unacknowledgedIds);
    if (result.success) {
      toast.success(`${unacknowledgedIds.length}건이 확인 처리되었습니다.`);
      loadData(data?.meta.page || 1, initialAcknowledged);
    } else {
      toast.error('일괄 확인 처리에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">상태:</span>
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="unacknowledged">미확인</SelectItem>
              <SelectItem value="acknowledged">확인됨</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filter === 'unacknowledged' && data && data.items.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkAcknowledge}
            disabled={isPending}
          >
            전체 확인 처리
          </Button>
        )}
      </div>

      {/* 테이블 */}
      <InactiveProductUsageTable
        data={data}
        isLoading={isLoading || isPending}
        onPageChange={handlePageChange}
        onAcknowledge={handleAcknowledge}
      />
    </div>
  );
}
