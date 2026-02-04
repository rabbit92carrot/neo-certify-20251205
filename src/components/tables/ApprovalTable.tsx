'use client';

/**
 * 승인 대기 조직 테이블 컴포넌트
 * 관리자 가입 승인 페이지용
 *
 * Split View 레이아웃에서 좌측 테이블로 사용됩니다.
 * - 행 클릭 시 조직 선택 (우측 패널에 상세 정보 표시)
 * - 승인/거부 버튼으로 직접 액션 가능
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Building2,
  Factory,
  Truck,
  Stethoscope,
  Check,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import type { Organization, OrganizationType } from '@/types/api.types';
import { ORGANIZATION_TYPE_LABELS } from '@/constants/organization';

// ============================================================================
// 타입
// ============================================================================

interface ApprovalTableProps {
  /** 조직 목록 */
  organizations: Organization[];
  /** 선택된 조직 ID (행 하이라이트용) */
  selectedOrgId?: string | null;
  /** 조직 선택 핸들러 (행 클릭 시) */
  onSelectOrg?: (org: Organization) => void;
  /** 승인 핸들러 */
  onApprove?: (id: string) => Promise<void>;
  /** 거부 핸들러 */
  onReject?: (id: string) => Promise<void>;
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

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

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export function ApprovalTable({
  organizations,
  selectedOrgId,
  onSelectOrg,
  onApprove,
  onReject,
}: ApprovalTableProps): React.ReactElement {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | null;
    organization: Organization | null;
  }>({ open: false, action: null, organization: null });
  const [loading, setLoading] = useState(false);

  // 승인/거부 액션 실행
  const handleAction = async (): Promise<void> => {
    if (!confirmDialog.organization || !confirmDialog.action) {return;}

    setLoading(true);
    try {
      if (confirmDialog.action === 'approve') {
        await onApprove?.(confirmDialog.organization.id);
      } else {
        await onReject?.(confirmDialog.organization.id);
      }
    } finally {
      setLoading(false);
      setConfirmDialog({ open: false, action: null, organization: null });
    }
  };

  // 행 클릭 핸들러
  const handleRowClick = (org: Organization): void => {
    onSelectOrg?.(org);
  };

  // 버튼 클릭 시 이벤트 버블링 방지
  const handleButtonClick = (
    e: React.MouseEvent,
    action: 'approve' | 'reject',
    org: Organization
  ): void => {
    e.stopPropagation();
    setConfirmDialog({ open: true, action, organization: org });
  };

  // 빈 상태
  if (organizations.length === 0) {
    return (
      <EmptyState
        icon={Check}
        title="승인 대기 중인 조직이 없습니다"
        description="모든 가입 신청이 처리되었습니다."
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
              <TableHead className="hidden md:table-cell">이메일</TableHead>
              <TableHead className="hidden lg:table-cell">사업자등록번호</TableHead>
              <TableHead className="hidden sm:table-cell">대표자</TableHead>
              <TableHead className="hidden sm:table-cell">신청일</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.map((org) => {
              const isSelected = selectedOrgId === org.id;

              return (
                <TableRow
                  key={org.id}
                  className={cn(
                    'cursor-pointer transition-colors',
                    isSelected
                      ? 'bg-primary/5 hover:bg-primary/10'
                      : 'hover:bg-muted/50'
                  )}
                  onClick={() => handleRowClick(org)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'p-1.5 rounded-full',
                          isSelected ? 'bg-primary/10' : 'bg-gray-100'
                        )}
                      >
                        {getTypeIcon(org.type as OrganizationType)}
                      </div>
                      <span className="truncate max-w-[150px]">{org.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {ORGANIZATION_TYPE_LABELS[org.type as OrganizationType]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    <span className="truncate max-w-[180px] block">{org.email}</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {org.business_number}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {org.representative_name}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {format(new Date(org.created_at), 'MM.dd HH:mm', { locale: ko })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={(e) => handleButtonClick(e, 'approve', org)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => handleButtonClick(e, 'reject', org)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* 확인 다이얼로그 */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          !open && setConfirmDialog({ open: false, action: null, organization: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'approve' ? '조직 승인' : '조직 거부'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'approve'
                ? `"${confirmDialog.organization?.name}" 조직을 승인하시겠습니까?`
                : `"${confirmDialog.organization?.name}" 조직의 가입을 거부하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={loading}
              className={cn(confirmDialog.action === 'reject' && 'bg-red-600 hover:bg-red-700')}
            >
              {loading ? '처리 중...' : confirmDialog.action === 'approve' ? '승인' : '거부'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
