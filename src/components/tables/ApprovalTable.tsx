'use client';

/**
 * 승인 대기 조직 테이블 컴포넌트
 * 관리자 가입 승인 페이지용
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
  FileText,
  Eye,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';
import type { Organization, OrganizationType } from '@/types/api.types';
import { ORGANIZATION_TYPE_LABELS } from '@/constants/organization';

interface ApprovalTableProps {
  organizations: Organization[];
  onApprove?: (id: string) => Promise<void>;
  onReject?: (id: string) => Promise<void>;
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
 * 조직 상세 정보 다이얼로그
 */
function OrganizationDetailDialog({
  organization,
  open,
  onClose,
}: {
  organization: Organization | null;
  open: boolean;
  onClose: () => void;
}): React.ReactElement | null {
  if (!organization) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon(organization.type as OrganizationType)}
            {organization.name}
          </DialogTitle>
          <DialogDescription>
            {ORGANIZATION_TYPE_LABELS[organization.type as OrganizationType]} 조직 상세 정보
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                기본 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">이메일</span>
                <span>{organization.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">사업자등록번호</span>
                <span>{organization.business_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">대표자명</span>
                <span>{organization.representative_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">대표 연락처</span>
                <span>{organization.representative_contact}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">주소</span>
                <span>{organization.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">신청일</span>
                <span>
                  {format(new Date(organization.created_at), 'yyyy년 M월 d일 HH:mm', {
                    locale: ko,
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {organization.business_license_file && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  사업자등록증
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild className="w-full">
                  <a
                    href={organization.business_license_file}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    사업자등록증 보기
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 승인 대기 조직 테이블
 */
export function ApprovalTable({
  organizations,
  onApprove,
  onReject,
}: ApprovalTableProps): React.ReactElement {
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | null;
    organization: Organization | null;
  }>({ open: false, action: null, organization: null });
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    if (!confirmDialog.organization || !confirmDialog.action) return;

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
              <TableHead>이메일</TableHead>
              <TableHead>사업자등록번호</TableHead>
              <TableHead>대표자</TableHead>
              <TableHead>신청일</TableHead>
              <TableHead className="w-[150px]"></TableHead>
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
                  <Badge variant="outline">
                    {ORGANIZATION_TYPE_LABELS[org.type as OrganizationType]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{org.email}</TableCell>
                <TableCell>{org.business_number}</TableCell>
                <TableCell>{org.representative_name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(org.created_at), 'MM.dd HH:mm', { locale: ko })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedOrg(org);
                        setDetailOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() =>
                        setConfirmDialog({ open: true, action: 'approve', organization: org })
                      }
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() =>
                        setConfirmDialog({ open: true, action: 'reject', organization: org })
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 상세 정보 다이얼로그 */}
      <OrganizationDetailDialog
        organization={selectedOrg}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedOrg(null);
        }}
      />

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
