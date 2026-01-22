'use client';

import { Badge } from '@/components/ui/badge';
import { Factory, Truck, Stethoscope, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ORGANIZATION_TYPE_LABELS } from '@/constants/organization';
import type { OrganizationType } from '@/types/api.types';
import type { PendingOrganization } from './AdminDashboardView';

/**
 * 조직 타입별 아이콘
 */
function getTypeIcon(type: OrganizationType): React.ReactNode {
  switch (type) {
    case 'MANUFACTURER':
      return <Factory className="h-4 w-4" />;
    case 'DISTRIBUTOR':
      return <Truck className="h-4 w-4" />;
    case 'HOSPITAL':
      return <Stethoscope className="h-4 w-4" />;
    default:
      return <Building2 className="h-4 w-4" />;
  }
}

/**
 * PendingOrganizationsList Props
 */
export interface PendingOrganizationsListProps {
  pendingOrganizations: PendingOrganization[];
}

/**
 * 승인 대기 조직 목록 컴포넌트
 * props 기반으로 UI만 렌더링
 */
export function PendingOrganizationsList({
  pendingOrganizations,
}: PendingOrganizationsListProps): React.ReactElement {
  if (pendingOrganizations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        승인 대기 중인 조직이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {pendingOrganizations.map((pending) => (
        <div
          key={pending.id}
          className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-white">
              {getTypeIcon(pending.type)}
            </div>
            <div>
              <p className="font-medium text-sm">{pending.name}</p>
              <p className="text-xs text-muted-foreground">{pending.email}</p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="text-xs">
              {ORGANIZATION_TYPE_LABELS[pending.type]}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(pending.created_at), 'MM.dd HH:mm', { locale: ko })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
