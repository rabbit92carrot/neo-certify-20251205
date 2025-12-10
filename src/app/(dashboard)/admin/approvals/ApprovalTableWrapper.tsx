'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { ApprovalTable } from '@/components/tables/ApprovalTable';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import {
  approveOrganizationAction,
  rejectOrganizationAction,
} from '../actions';
import * as adminService from '@/services/admin.service';
import type { Organization } from '@/types/api.types';

export function ApprovalTableWrapper(): React.ReactElement {
  const [, startTransition] = useTransition();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    const result = await adminService.getPendingOrganizations({
      page: 1,
      pageSize: 50,
    });
    if (result.success && result.data) {
      setOrganizations(result.data.items);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const handleApprove = async (id: string) => {
    startTransition(async () => {
      await approveOrganizationAction(id);
      fetchOrganizations();
    });
  };

  const handleReject = async (id: string) => {
    startTransition(async () => {
      await rejectOrganizationAction(id);
      fetchOrganizations();
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
