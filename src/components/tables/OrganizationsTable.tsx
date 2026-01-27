'use client';

/**
 * 조직 목록 테이블 컴포넌트
 * 관리자 조직 관리 페이지용
 *
 * Phase 3A/3B 최적화:
 * - OrganizationRow: memo로 행 리렌더 최적화
 * - ConfirmActionDialog: 별도 컴포넌트로 상태 분리
 */

import { useState, memo, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Building2,
  Factory,
  Truck,
  Stethoscope,
  MoreHorizontal,
  Check,
  X,
  Trash2,
  Power,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';
import type { OrganizationWithStats, OrganizationType, OrganizationStatus } from '@/types/api.types';
import {
  ORGANIZATION_TYPE_LABELS,
  ORGANIZATION_STATUS_LABELS,
} from '@/constants/organization';

interface OrganizationsTableProps {
  organizations: OrganizationWithStats[];
  onApprove?: (id: string) => Promise<void>;
  onDeactivate?: (id: string) => Promise<void>;
  onActivate?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

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
 * 상태별 배지 스타일
 */
function getStatusBadgeVariant(
  status: OrganizationStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'ACTIVE':
      return 'default';
    case 'PENDING_APPROVAL':
      return 'secondary';
    case 'INACTIVE':
      return 'outline';
    case 'DELETED':
      return 'destructive';
    default:
      return 'outline';
  }
}

// ============================================================================
// Phase 3A: 행 컴포넌트 메모이제이션
// ============================================================================

type ActionType = 'approve' | 'deactivate' | 'activate' | 'delete';

interface OrganizationRowProps {
  organization: OrganizationWithStats;
  onOpenDialog: (action: ActionType, org: OrganizationWithStats) => void;
}

/**
 * 메모이제이션된 조직 행 컴포넌트
 */
const OrganizationRow = memo(function OrganizationRow({
  organization: org,
  onOpenDialog,
}: OrganizationRowProps) {
  // useMemo로 아이콘 및 배지 스타일 캐싱
  const icon = useMemo(() => getTypeIcon(org.type as OrganizationType), [org.type]);
  const badgeVariant = useMemo(
    () => getStatusBadgeVariant(org.status as OrganizationStatus),
    [org.status]
  );
  const formattedDate = useMemo(
    () => format(new Date(org.created_at), 'yyyy.MM.dd', { locale: ko }),
    [org.created_at]
  );

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-gray-100">{icon}</div>
          {org.name}
        </div>
      </TableCell>
      <TableCell>{ORGANIZATION_TYPE_LABELS[org.type as OrganizationType]}</TableCell>
      <TableCell>
        <Badge variant={badgeVariant}>
          {ORGANIZATION_STATUS_LABELS[org.status as OrganizationStatus]}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{org.email}</TableCell>
      <TableCell>{org.virtualCodeCount.toLocaleString()}개</TableCell>
      <TableCell className="text-muted-foreground">{formattedDate}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {org.status === 'PENDING_APPROVAL' && (
              <DropdownMenuItem onClick={() => onOpenDialog('approve', org)}>
                <Check className="h-4 w-4 mr-2" />
                승인
              </DropdownMenuItem>
            )}
            {org.status === 'ACTIVE' && (
              <DropdownMenuItem onClick={() => onOpenDialog('deactivate', org)}>
                <Power className="h-4 w-4 mr-2" />
                비활성화
              </DropdownMenuItem>
            )}
            {org.status === 'INACTIVE' && (
              <DropdownMenuItem onClick={() => onOpenDialog('activate', org)}>
                <Check className="h-4 w-4 mr-2" />
                활성화
              </DropdownMenuItem>
            )}
            {org.status === 'PENDING_APPROVAL' && (
              <DropdownMenuItem
                onClick={() => onOpenDialog('delete', org)}
                className="text-red-600"
              >
                <X className="h-4 w-4 mr-2" />
                거부
              </DropdownMenuItem>
            )}
            {org.status !== 'DELETED' && org.status !== 'PENDING_APPROVAL' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onOpenDialog('delete', org)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  삭제
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}, (prev, next) => {
  // 커스텀 비교 함수: ID와 상태가 같으면 리렌더 스킵
  return prev.organization.id === next.organization.id
    && prev.organization.status === next.organization.status
    && prev.organization.virtualCodeCount === next.organization.virtualCodeCount;
});

// ============================================================================
// Phase 3B: AlertDialog 상태 분리
// ============================================================================

interface ConfirmDialogState {
  open: boolean;
  action: ActionType | null;
  organization: OrganizationWithStats | null;
}

interface ConfirmActionDialogProps {
  dialogState: ConfirmDialogState;
  onClose: () => void;
  onApprove?: (id: string) => Promise<void>;
  onDeactivate?: (id: string) => Promise<void>;
  onActivate?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

/**
 * 별도 상태 관리되는 확인 다이얼로그 (Phase 3B)
 */
const ConfirmActionDialog = memo(function ConfirmActionDialog({
  dialogState,
  onClose,
  onApprove,
  onDeactivate,
  onActivate,
  onDelete,
}: ConfirmActionDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    if (!dialogState.organization || !dialogState.action) return;

    setLoading(true);
    try {
      switch (dialogState.action) {
        case 'approve':
          await onApprove?.(dialogState.organization.id);
          break;
        case 'deactivate':
          await onDeactivate?.(dialogState.organization.id);
          break;
        case 'activate':
          await onActivate?.(dialogState.organization.id);
          break;
        case 'delete':
          await onDelete?.(dialogState.organization.id);
          break;
      }
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const dialogContent = useMemo(() => {
    const org = dialogState.organization;
    if (!org) return { title: '', description: '' };

    switch (dialogState.action) {
      case 'approve':
        return {
          title: '조직 승인',
          description: `"${org.name}" 조직을 승인하시겠습니까?`,
        };
      case 'deactivate':
        return {
          title: '조직 비활성화',
          description: `"${org.name}" 조직을 비활성화하시겠습니까? 해당 조직은 더 이상 로그인할 수 없습니다.`,
        };
      case 'activate':
        return {
          title: '조직 활성화',
          description: `"${org.name}" 조직을 활성화하시겠습니까?`,
        };
      case 'delete':
        return {
          title: '조직 삭제',
          description: `"${org.name}" 조직을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
        };
      default:
        return { title: '', description: '' };
    }
  }, [dialogState.organization, dialogState.action]);

  return (
    <AlertDialog open={dialogState.open} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
          <AlertDialogDescription>{dialogContent.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAction}
            disabled={loading}
            className={cn(dialogState.action === 'delete' && 'bg-red-600 hover:bg-red-700')}
          >
            {loading ? '처리 중...' : '확인'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});

// ============================================================================
// 메인 테이블 컴포넌트
// ============================================================================

/**
 * 조직 목록 테이블
 */
export function OrganizationsTable({
  organizations,
  onApprove,
  onDeactivate,
  onActivate,
  onDelete,
}: OrganizationsTableProps): React.ReactElement {
  // Phase 3B: Dialog 상태를 별도로 관리하여 테이블 리렌더 방지
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    action: null,
    organization: null,
  });

  // useCallback으로 핸들러 안정화 (행 컴포넌트에 전달)
  const handleOpenDialog = useCallback(
    (action: ActionType, org: OrganizationWithStats) => {
      setConfirmDialog({ open: true, action, organization: org });
    },
    []
  );

  const handleCloseDialog = useCallback(() => {
    setConfirmDialog({ open: false, action: null, organization: null });
  }, []);

  if (organizations.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="조직이 없습니다"
        description="등록된 조직이 없습니다."
      />
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>조직명</TableHead>
              <TableHead>유형</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>보유 코드</TableHead>
              <TableHead>등록일</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Phase 3A: 메모이제이션된 행 컴포넌트 사용 */}
            {organizations.map((org) => (
              <OrganizationRow
                key={org.id}
                organization={org}
                onOpenDialog={handleOpenDialog}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Phase 3B: 별도 컴포넌트로 분리된 다이얼로그 */}
      <ConfirmActionDialog
        dialogState={confirmDialog}
        onClose={handleCloseDialog}
        onApprove={onApprove}
        onDeactivate={onDeactivate}
        onActivate={onActivate}
        onDelete={onDelete}
      />
    </>
  );
}
