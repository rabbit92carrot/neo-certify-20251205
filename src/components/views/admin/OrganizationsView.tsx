/**
 * 조직 관리 View 컴포넌트
 * Admin 조직 관리 페이지 뷰 (props 기반)
 */

import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Building2, Factory, Stethoscope, Search, CheckCircle, Clock, XCircle, Trash2 } from 'lucide-react';

export interface OrganizationItem {
  id: string;
  name: string;
  email: string;
  type: 'MANUFACTURER' | 'DISTRIBUTOR' | 'HOSPITAL';
  status: 'PENDING_APPROVAL' | 'ACTIVE' | 'INACTIVE' | 'DELETED';
  createdAt: string;
}

export interface OrganizationsViewProps {
  /** 조직 목록 */
  organizations: OrganizationItem[];
  /** 상태별 통계 */
  statusCounts: {
    total: number;
    active: number;
    inactive: number;
    pendingApproval: number;
    deleted: number;
  };
}

const TYPE_ICONS = {
  MANUFACTURER: <Factory className="h-4 w-4" />,
  DISTRIBUTOR: <Building2 className="h-4 w-4" />,
  HOSPITAL: <Stethoscope className="h-4 w-4" />,
};

const TYPE_LABELS = {
  MANUFACTURER: '제조사',
  DISTRIBUTOR: '유통사',
  HOSPITAL: '병원',
};

const STATUS_BADGES = {
  ACTIVE: <Badge className="bg-green-100 text-green-800 hover:bg-green-100">활성</Badge>,
  INACTIVE: <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">비활성</Badge>,
  PENDING_APPROVAL: <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">승인대기</Badge>,
  DELETED: <Badge className="bg-red-100 text-red-800 hover:bg-red-100">삭제</Badge>,
};

export function OrganizationsView({
  organizations,
  statusCounts,
}: OrganizationsViewProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <PageHeader
        title="조직 관리"
        description="전체 조직을 관리합니다. 조직 승인, 비활성화, 삭제 등의 작업을 수행할 수 있습니다."
      />

      {/* 상태별 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          title="전체"
          value={statusCounts.total}
          icon={Building2}
        />
        <StatCard
          title="활성"
          value={statusCounts.active}
          icon={CheckCircle}
        />
        <StatCard
          title="비활성"
          value={statusCounts.inactive}
          icon={XCircle}
        />
        <StatCard
          title="승인대기"
          value={statusCounts.pendingApproval}
          icon={Clock}
        />
        <StatCard
          title="삭제"
          value={statusCounts.deleted}
          icon={Trash2}
        />
      </div>

      {/* 검색 및 필터 */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="조직명, 이메일, 사업자번호로 검색..."
            className="pl-9"
            disabled
          />
        </div>
      </div>

      {/* 조직 테이블 */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>조직명</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>유형</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>등록일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.map((org) => (
              <TableRow key={org.id}>
                <TableCell>{TYPE_ICONS[org.type]}</TableCell>
                <TableCell className="font-medium">{org.name}</TableCell>
                <TableCell>{org.email}</TableCell>
                <TableCell>{TYPE_LABELS[org.type]}</TableCell>
                <TableCell>{STATUS_BADGES[org.status]}</TableCell>
                <TableCell>{org.createdAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
