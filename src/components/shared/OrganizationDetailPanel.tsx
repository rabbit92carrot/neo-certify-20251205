'use client';

/**
 * 조직 상세 정보 패널 컴포넌트
 *
 * Split View의 우측 패널로 사용됩니다.
 * - 조직 기본 정보 표시
 * - 사업자등록증 미리보기
 * - 승인/거부 액션 버튼
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
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Loader2,
  Power,
  Trash2,
  Package,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { BusinessLicensePreview } from './BusinessLicensePreview';
import { cn } from '@/lib/utils';
import type { Organization, OrganizationType, OrganizationStatus, OrganizationWithStats } from '@/types/api.types';
import { ORGANIZATION_TYPE_LABELS, ORGANIZATION_STATUS_LABELS } from '@/constants/organization';

// ============================================================================
// 타입
// ============================================================================

type ActionMode = 'approval' | 'management';

interface OrganizationDetailPanelProps {
  /** 선택된 조직 (null이면 빈 상태 표시) */
  organization: Organization | OrganizationWithStats | null;
  /** 사업자등록증 Signed URL */
  signedUrl: string | null;
  /** Signed URL 로딩 상태 */
  isLoading?: boolean;
  /** 승인 핸들러 */
  onApprove?: (id: string) => Promise<void>;
  /** 거부 핸들러 */
  onReject?: (id: string) => Promise<void>;
  /** 비활성화 핸들러 */
  onDeactivate?: (id: string) => Promise<void>;
  /** 활성화 핸들러 */
  onActivate?: (id: string) => Promise<void>;
  /** 삭제 핸들러 */
  onDelete?: (id: string) => Promise<void>;
  /** 액션 모드: approval(승인 대기), management(회원 관리) */
  actionMode?: ActionMode;
  /** 추가 클래스명 */
  className?: string;
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
      return <Factory className="h-5 w-5" />;
    case 'DISTRIBUTOR':
      return <Truck className="h-5 w-5" />;
    case 'HOSPITAL':
      return <Stethoscope className="h-5 w-5" />;
    default:
      return <Building2 className="h-5 w-5" />;
  }
}

/**
 * 파일 경로에서 파일명 추출
 */
function getFileName(filePath: string): string {
  return filePath.split('/').pop() || 'business_license';
}

// ============================================================================
// 서브 컴포넌트
// ============================================================================

/**
 * 정보 항목
 */
function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-md bg-muted p-1.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value}</p>
      </div>
    </div>
  );
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================

type ActionType = 'approve' | 'reject' | 'deactivate' | 'activate' | 'delete';

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
 * 액션별 다이얼로그 내용
 */
function getDialogContent(
  action: ActionType | null,
  orgName: string
): { title: string; description: string } {
  switch (action) {
    case 'approve':
      return {
        title: '조직 승인',
        description: `"${orgName}" 조직을 승인하시겠습니까?`,
      };
    case 'reject':
      return {
        title: '조직 거부',
        description: `"${orgName}" 조직의 가입을 거부하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
      };
    case 'deactivate':
      return {
        title: '조직 비활성화',
        description: `"${orgName}" 조직을 비활성화하시겠습니까? 해당 조직은 더 이상 로그인할 수 없습니다.`,
      };
    case 'activate':
      return {
        title: '조직 활성화',
        description: `"${orgName}" 조직을 활성화하시겠습니까?`,
      };
    case 'delete':
      return {
        title: '조직 삭제',
        description: `"${orgName}" 조직을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
      };
    default:
      return { title: '', description: '' };
  }
}

export function OrganizationDetailPanel({
  organization,
  signedUrl,
  isLoading = false,
  onApprove,
  onReject,
  onDeactivate,
  onActivate,
  onDelete,
  actionMode = 'approval',
  className,
}: OrganizationDetailPanelProps): React.ReactElement {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: ActionType | null;
  }>({ open: false, action: null });
  const [actionLoading, setActionLoading] = useState(false);

  // 조직 상태
  const orgStatus = organization?.status as OrganizationStatus | undefined;

  // OrganizationWithStats 타입 체크
  const hasStats = organization && 'virtualCodeCount' in organization;
  const virtualCodeCount = hasStats
    ? (organization as OrganizationWithStats).virtualCodeCount
    : null;

  // 액션 실행
  const handleAction = async (): Promise<void> => {
    if (!organization || !confirmDialog.action) {
      return;
    }

    setActionLoading(true);
    try {
      switch (confirmDialog.action) {
        case 'approve':
          await onApprove?.(organization.id);
          break;
        case 'reject':
          await onReject?.(organization.id);
          break;
        case 'deactivate':
          await onDeactivate?.(organization.id);
          break;
        case 'activate':
          await onActivate?.(organization.id);
          break;
        case 'delete':
          await onDelete?.(organization.id);
          break;
      }
    } finally {
      setActionLoading(false);
      setConfirmDialog({ open: false, action: null });
    }
  };

  // 다이얼로그 내용
  const dialogContent = getDialogContent(
    confirmDialog.action,
    organization?.name ?? ''
  );

  // 빈 상태
  if (!organization) {
    return (
      <div
        className={cn(
          'flex h-full flex-col items-center justify-center p-8',
          className
        )}
      >
        <div className="rounded-full bg-muted p-4">
          <Building2 className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          조직을 선택하면 상세 정보가 표시됩니다
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* 헤더 */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            {getTypeIcon(organization.type as OrganizationType)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold">{organization.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {ORGANIZATION_TYPE_LABELS[organization.type as OrganizationType]}
              </Badge>
              {actionMode === 'management' && orgStatus && (
                <Badge variant={getStatusBadgeVariant(orgStatus)}>
                  {ORGANIZATION_STATUS_LABELS[orgStatus]}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 스크롤 영역 */}
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {/* 기본 정보 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                기본 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoItem
                icon={Mail}
                label="이메일"
                value={organization.email}
              />
              <InfoItem
                icon={FileText}
                label="사업자등록번호"
                value={organization.business_number}
              />
              <InfoItem
                icon={Building2}
                label="대표자명"
                value={organization.representative_name}
              />
              <InfoItem
                icon={Phone}
                label="대표 연락처"
                value={organization.representative_contact}
              />
              <InfoItem
                icon={MapPin}
                label="주소"
                value={organization.address}
              />
              <InfoItem
                icon={Calendar}
                label={actionMode === 'approval' ? '신청일' : '등록일'}
                value={format(
                  new Date(organization.created_at),
                  'yyyy년 M월 d일 HH:mm',
                  { locale: ko }
                )}
              />
              {virtualCodeCount !== null && (
                <InfoItem
                  icon={Package}
                  label="보유 코드"
                  value={`${virtualCodeCount.toLocaleString()}개`}
                />
              )}
            </CardContent>
          </Card>

          {/* 사업자등록증 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                사업자등록증
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BusinessLicensePreview
                signedUrl={signedUrl}
                fileName={
                  organization.business_license_file
                    ? getFileName(organization.business_license_file)
                    : 'business_license'
                }
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* 액션 버튼 (하단 고정) */}
      {orgStatus !== 'DELETED' && (
        <div className="border-t bg-white p-4">
          {actionMode === 'approval' ? (
            // 승인 모드: 승인/거부 버튼
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setConfirmDialog({ open: true, action: 'reject' })}
              >
                <X className="mr-2 h-4 w-4" />
                거부
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => setConfirmDialog({ open: true, action: 'approve' })}
              >
                <Check className="mr-2 h-4 w-4" />
                승인
              </Button>
            </div>
          ) : (
            // 관리 모드: 상태에 따른 버튼
            <div className="flex gap-2">
              {orgStatus === 'PENDING_APPROVAL' && (
                <>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setConfirmDialog({ open: true, action: 'reject' })}
                  >
                    <X className="mr-2 h-4 w-4" />
                    거부
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => setConfirmDialog({ open: true, action: 'approve' })}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    승인
                  </Button>
                </>
              )}
              {orgStatus === 'ACTIVE' && (
                <Button
                  variant="outline"
                  className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                  onClick={() => setConfirmDialog({ open: true, action: 'deactivate' })}
                >
                  <Power className="mr-2 h-4 w-4" />
                  비활성화
                </Button>
              )}
              {orgStatus === 'INACTIVE' && (
                <>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setConfirmDialog({ open: true, action: 'delete' })}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    삭제
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => setConfirmDialog({ open: true, action: 'activate' })}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    활성화
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* 확인 다이얼로그 */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          !open && setConfirmDialog({ open: false, action: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialogContent.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={actionLoading}
              className={cn(
                (confirmDialog.action === 'reject' ||
                  confirmDialog.action === 'delete' ||
                  confirmDialog.action === 'deactivate') &&
                  'bg-red-600 hover:bg-red-700'
              )}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                '확인'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
