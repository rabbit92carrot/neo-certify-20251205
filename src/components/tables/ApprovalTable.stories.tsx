'use client';

import type { Meta, StoryObj } from '@storybook/react';
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
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * ApprovalTable은 Server Actions에 의존합니다.
 * Storybook에서는 Mock 컴포넌트로 UI를 시뮬레이션합니다.
 */

type OrganizationType = 'MANUFACTURER' | 'DISTRIBUTOR' | 'HOSPITAL';

interface MockOrganization {
  id: string;
  name: string;
  type: OrganizationType;
  email: string;
  business_number: string;
  representative_name: string;
  representative_contact: string;
  address: string;
  created_at: string;
  business_license_file?: string;
}

const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  MANUFACTURER: '제조사',
  DISTRIBUTOR: '유통사',
  HOSPITAL: '병원',
};

const mockOrganizations: MockOrganization[] = [
  {
    id: 'org-001',
    name: '네오메디컬',
    type: 'MANUFACTURER',
    email: 'contact@neomedical.com',
    business_number: '123-45-67890',
    representative_name: '김대표',
    representative_contact: '010-1234-5678',
    address: '서울특별시 강남구 테헤란로 123',
    created_at: '2024-01-15T09:00:00Z',
  },
  {
    id: 'org-002',
    name: '메디컬유통',
    type: 'DISTRIBUTOR',
    email: 'info@medicaldist.com',
    business_number: '234-56-78901',
    representative_name: '이사장',
    representative_contact: '010-2345-6789',
    address: '서울특별시 서초구 서초대로 456',
    created_at: '2024-01-16T10:00:00Z',
  },
  {
    id: 'org-003',
    name: '강남피부과의원',
    type: 'HOSPITAL',
    email: 'gangnam@hospital.com',
    business_number: '345-67-89012',
    representative_name: '박원장',
    representative_contact: '010-3456-7890',
    address: '서울특별시 강남구 압구정로 789',
    created_at: '2024-01-17T11:00:00Z',
  },
];

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

function OrganizationDetailDialog({
  organization,
  open,
  onClose,
}: {
  organization: MockOrganization | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!organization) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon(organization.type)}
            {organization.name}
          </DialogTitle>
          <DialogDescription>
            {ORGANIZATION_TYPE_LABELS[organization.type]} 조직 상세 정보
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MockApprovalTable({ organizations = mockOrganizations }: { organizations?: MockOrganization[] }) {
  const [orgList, setOrgList] = useState(organizations);
  const [selectedOrg, setSelectedOrg] = useState<MockOrganization | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | null;
    organization: MockOrganization | null;
  }>({ open: false, action: null, organization: null });
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    if (!confirmDialog.organization || !confirmDialog.action) return;

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (confirmDialog.action === 'approve') {
      toast.success(`${confirmDialog.organization.name} 승인됨`);
    } else {
      toast.success(`${confirmDialog.organization.name} 거부됨`);
    }

    setOrgList(orgList.filter((org) => org.id !== confirmDialog.organization?.id));
    setLoading(false);
    setConfirmDialog({ open: false, action: null, organization: null });
  };

  if (orgList.length === 0) {
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
            {orgList.map((org) => (
              <TableRow key={org.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-gray-100">
                      {getTypeIcon(org.type)}
                    </div>
                    {org.name}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {ORGANIZATION_TYPE_LABELS[org.type]}
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

      <OrganizationDetailDialog
        organization={selectedOrg}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedOrg(null);
        }}
      />

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

const meta = {
  title: 'Tables/Admin/ApprovalTable',
  component: MockApprovalTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
} satisfies Meta<typeof MockApprovalTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    organizations: [],
  },
};

export const SingleOrganization: Story = {
  args: {
    organizations: [mockOrganizations[0]],
  },
};
