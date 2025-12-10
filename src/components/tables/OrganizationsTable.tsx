'use client';

/**
 * 조직 목록 테이블 컴포넌트
 * 관리자 조직 관리 페이지용
 */

import { useState } from 'react';
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
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'approve' | 'deactivate' | 'activate' | 'delete' | null;
    organization: OrganizationWithStats | null;
  }>({ open: false, action: null, organization: null });
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    if (!confirmDialog.organization || !confirmDialog.action) return;

    setLoading(true);
    try {
      switch (confirmDialog.action) {
        case 'approve':
          await onApprove?.(confirmDialog.organization.id);
          break;
        case 'deactivate':
          await onDeactivate?.(confirmDialog.organization.id);
          break;
        case 'activate':
          await onActivate?.(confirmDialog.organization.id);
          break;
        case 'delete':
          await onDelete?.(confirmDialog.organization.id);
          break;
      }
    } finally {
      setLoading(false);
      setConfirmDialog({ open: false, action: null, organization: null });
    }
  };

  const getDialogContent = () => {
    const org = confirmDialog.organization;
    if (!org) return { title: '', description: '' };

    switch (confirmDialog.action) {
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
  };

  if (organizations.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="조직이 없습니다"
        description="등록된 조직이 없습니다."
      />
    );
  }

  const dialogContent = getDialogContent();

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
            {organizations.map((org) => (
              <TableRow key={org.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-gray-100">
                      {getTypeIcon(org.type as OrganizationType)}
                    </div>
                    {org.name}
                  </div>
                </TableCell>
                <TableCell>
                  {ORGANIZATION_TYPE_LABELS[org.type as OrganizationType]}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(org.status as OrganizationStatus)}>
                    {ORGANIZATION_STATUS_LABELS[org.status as OrganizationStatus]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{org.email}</TableCell>
                <TableCell>{org.virtualCodeCount.toLocaleString()}개</TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(org.created_at), 'yyyy.MM.dd', { locale: ko })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {org.status === 'PENDING_APPROVAL' && (
                        <DropdownMenuItem
                          onClick={() =>
                            setConfirmDialog({ open: true, action: 'approve', organization: org })
                          }
                        >
                          <Check className="h-4 w-4 mr-2" />
                          승인
                        </DropdownMenuItem>
                      )}
                      {org.status === 'ACTIVE' && (
                        <DropdownMenuItem
                          onClick={() =>
                            setConfirmDialog({ open: true, action: 'deactivate', organization: org })
                          }
                        >
                          <Power className="h-4 w-4 mr-2" />
                          비활성화
                        </DropdownMenuItem>
                      )}
                      {org.status === 'INACTIVE' && (
                        <DropdownMenuItem
                          onClick={() =>
                            setConfirmDialog({ open: true, action: 'activate', organization: org })
                          }
                        >
                          <Check className="h-4 w-4 mr-2" />
                          활성화
                        </DropdownMenuItem>
                      )}
                      {org.status === 'PENDING_APPROVAL' && (
                        <DropdownMenuItem
                          onClick={() =>
                            setConfirmDialog({ open: true, action: 'delete', organization: org })
                          }
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
                            onClick={() =>
                              setConfirmDialog({ open: true, action: 'delete', organization: org })
                            }
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
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          !open && setConfirmDialog({ open: false, action: null, organization: null })
        }
      >
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
              className={cn(confirmDialog.action === 'delete' && 'bg-red-600 hover:bg-red-700')}
            >
              {loading ? '처리 중...' : '확인'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
