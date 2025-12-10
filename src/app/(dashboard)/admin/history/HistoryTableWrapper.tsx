'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminHistoryTable } from '@/components/tables/AdminHistoryTable';
import { AdminHistoryFilter } from '@/components/shared/AdminHistoryFilter';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import * as adminService from '@/services/admin.service';
import type { AdminHistoryItem, OrganizationType, VirtualCodeStatus } from '@/types/api.types';

interface HistoryTableWrapperProps {
  page?: number;
  startDate?: string;
  endDate?: string;
  currentStatus?: string;
  currentOwnerId?: string;
  originalProducerId?: string;
  productId?: string;
  includeRecalled?: boolean;
}

export function HistoryTableWrapper({
  page = 1,
  startDate,
  endDate,
  currentStatus,
  currentOwnerId,
  originalProducerId,
  productId,
  includeRecalled = true,
}: HistoryTableWrapperProps): React.ReactElement {
  const [histories, setHistories] = useState<AdminHistoryItem[]>([]);
  const [organizations, setOrganizations] = useState<
    { id: string; name: string; type: OrganizationType }[]
  >([]);
  const [products, setProducts] = useState<
    { id: string; name: string; manufacturerName: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);

    // 병렬로 데이터 조회
    const [historyResult, orgsResult, productsResult] = await Promise.all([
      adminService.getAdminHistory({
        page,
        pageSize: 50,
        startDate,
        endDate,
        currentStatus: currentStatus as VirtualCodeStatus | undefined,
        currentOwnerId,
        originalProducerId,
        productId,
        includeRecalled,
      }),
      adminService.getAllOrganizationsForSelect(),
      adminService.getAllProductsForSelect(),
    ]);

    if (historyResult.success && historyResult.data) {
      setHistories(historyResult.data.items);
    }
    if (orgsResult.success && orgsResult.data) {
      setOrganizations(orgsResult.data);
    }
    if (productsResult.success && productsResult.data) {
      setProducts(productsResult.data);
    }

    setLoading(false);
  }, [
    page,
    startDate,
    endDate,
    currentStatus,
    currentOwnerId,
    originalProducerId,
    productId,
    includeRecalled,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* 필터 */}
      <AdminHistoryFilter organizations={organizations} products={products} />

      {/* 테이블 */}
      <AdminHistoryTable histories={histories} />
    </div>
  );
}
