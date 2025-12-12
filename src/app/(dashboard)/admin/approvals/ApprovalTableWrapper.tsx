'use client';

import { useState, useEffect, useTransition } from 'react';
import { ApprovalTable } from '@/components/tables/ApprovalTable';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import {
  approveOrganizationAction,
  rejectOrganizationAction,
  getPendingOrganizationsAction,
} from '../actions';
import type { Organization } from '@/types/api.types';

export function ApprovalTableWrapper(): React.ReactElement {
  const [, startTransition] = useTransition();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    const fetchData = async (): Promise<void> => {
      setLoading(true);
      const result = await getPendingOrganizationsAction({
        page: 1,
        pageSize: 50,
      });
      if (!ignore) {
        if (result.success && result.data) {
          setOrganizations(result.data.items);
        }
        setLoading(false);
      }
    };

    void fetchData();

    return (): void => {
      ignore = true;
    };
  }, [refreshKey]);

  const refreshData = (): void => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleApprove = async (id: string): Promise<void> => {
    startTransition(async () => {
      await approveOrganizationAction(id);
      refreshData();
    });
  };

  const handleReject = async (id: string): Promise<void> => {
    startTransition(async () => {
      await rejectOrganizationAction(id);
      refreshData();
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ApprovalTable
      organizations={organizations}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  );
}
