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
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * OrganizationsTable은 관리자 조직 관리 페이지용 테이블입니다.
 */

type OrganizationType = 'MANUFACTURER' | 'DISTRIBUTOR' | 'HOSPITAL';
type OrganizationStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'INACTIVE' | 'DELETED';

interface MockOrganization {
  id: string;
  name: string;
  type: OrganizationType;
  status: OrganizationStatus;
  email: string;
  created_at: string;
  virtualCodeCount: number;
}

const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  MANUFACTURER: '제조사',
  DISTRIBUTOR: '유통사',
  HOSPITAL: '병원',
};

const ORGANIZATION_STATUS_LABELS: Record<OrganizationStatus, string> = {
  ACTIVE: '활성',
  PENDING_APPROVAL: '승인 대기',
  INACTIVE: '비활성',
  DELETED: '삭제됨',
};

const mockOrganizations: MockOrganization[] = [
  {
    id: 'org-001',
    name: '네오메디컬',
    type: 'MANUFACTURER',
    status: 'ACTIVE',
    email: 'contact@neomedical.com',
    created_at: '2024-01-15T09:00:00Z',
    virtualCodeCount: 5000,
  },
  {
    id: 'org-002',
    name: '메디컬유통',
    type: 'DISTRIBUTOR',
    status: 'ACTIVE',
    email: 'info@medicaldist.com',
    created_at: '2024-02-10T10:00:00Z',
    virtualCodeCount: 2000,
  },
  {
    id: 'org-003',
    name: '강남피부과의원',
    type: 'HOSPITAL',
    status: 'PENDING_APPROVAL',
    email: 'gangnam@hospital.com',
    created_at: '2024-03-05T11:00:00Z',
    virtualCodeCount: 0,
  },
  {
    id: 'org-004',
    name: '서울미래병원',
    type: 'HOSPITAL',
    status: 'INACTIVE',
    email: 'seoul@hospital.com',
    created_at: '2024-04-01T12:00:00Z',
    virtualCodeCount: 500,
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

function MockOrganizationsTable({ organizations = mockOrganizations }: { organizations?: MockOrganization[] }) {
  const [orgList, setOrgList] = useState(organizations);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'approve' | 'deactivate' | 'activate' | 'delete' | null;
    organization: MockOrganization | null;
  }>({ open: false, action: null, organization: null });
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    if (!confirmDialog.organization || !confirmDialog.action) return;

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const { action, organization } = confirmDialog;

    switch (action) {
      case 'approve':
        setOrgList(orgList.map((org) =>
          org.id === organization.id ? { ...org, status: 'ACTIVE' as OrganizationStatus } : org
        ));
        toast.success(`${organization.name} 승인됨`);
        break;
      case 'deactivate':
        setOrgList(orgList.map((org) =>
          org.id === organization.id ? { ...org, status: 'INACTIVE' as OrganizationStatus } : org
        ));
        toast.success(`${organization.name} 비활성화됨`);
        break;
      case 'activate':
        setOrgList(orgList.map((org) =>
          org.id === organization.id ? { ...org, status: 'ACTIVE' as OrganizationStatus } : org
        ));
        toast.success(`${organization.name} 활성화됨`);
        break;
      case 'delete':
        setOrgList(orgList.filter((org) => org.id !== organization.id));
        toast.success(`${organization.name} 삭제됨`);
        break;
    }

    setLoading(false);
    setConfirmDialog({ open: false, action: null, organization: null });
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

  if (orgList.length === 0) {
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
                  {ORGANIZATION_TYPE_LABELS[org.type]}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(org.status)}>
                    {ORGANIZATION_STATUS_LABELS[org.status]}
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

const meta = {
  title: 'Tables/Admin/OrganizationsTable',
  component: MockOrganizationsTable,
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
} satisfies Meta<typeof MockOrganizationsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    organizations: [],
  },
};

export const AllActive: Story = {
  args: {
    organizations: mockOrganizations.filter((org) => org.status === 'ACTIVE'),
  },
};

export const MixedStatuses: Story = {
  args: {
    organizations: mockOrganizations,
  },
};
