/**
 * 알림 관리 View 컴포넌트
 * Admin 알림 관리 페이지 뷰 (props 기반)
 */

import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
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
import { Bell, BellRing, CheckCircle, Clock, Plus } from 'lucide-react';

export interface AlertItem {
  id: string;
  title: string;
  content: string;
  targetType: 'ALL' | 'MANUFACTURER' | 'DISTRIBUTOR' | 'HOSPITAL';
  status: 'DRAFT' | 'SCHEDULED' | 'SENT';
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
}

export interface AlertsViewProps {
  /** 알림 목록 */
  alerts: AlertItem[];
  /** 통계 */
  stats: {
    total: number;
    sent: number;
    scheduled: number;
    draft: number;
  };
}

const TARGET_LABELS = {
  ALL: '전체',
  MANUFACTURER: '제조사',
  DISTRIBUTOR: '유통사',
  HOSPITAL: '병원',
};

const STATUS_BADGES = {
  DRAFT: <Badge variant="secondary">임시저장</Badge>,
  SCHEDULED: <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">예약됨</Badge>,
  SENT: <Badge className="bg-green-100 text-green-800 hover:bg-green-100">발송완료</Badge>,
};

export function AlertsView({
  alerts,
  stats,
}: AlertsViewProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="알림 관리"
          description="전체 조직 또는 특정 유형의 조직에게 공지사항을 발송합니다."
        />
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          새 알림 작성
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="전체"
          value={stats.total}
          icon={Bell}
        />
        <StatCard
          title="발송완료"
          value={stats.sent}
          icon={CheckCircle}
        />
        <StatCard
          title="예약됨"
          value={stats.scheduled}
          icon={Clock}
        />
        <StatCard
          title="임시저장"
          value={stats.draft}
          icon={BellRing}
        />
      </div>

      {/* 알림 테이블 */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead>대상</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>예약/발송일시</TableHead>
              <TableHead>작성일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell className="font-medium max-w-[300px]">
                  <p className="truncate">{alert.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {alert.content}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{TARGET_LABELS[alert.targetType]}</Badge>
                </TableCell>
                <TableCell>{STATUS_BADGES[alert.status]}</TableCell>
                <TableCell>
                  {alert.sentAt || alert.scheduledAt || '-'}
                </TableCell>
                <TableCell>{alert.createdAt}</TableCell>
              </TableRow>
            ))}
            {alerts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  등록된 알림이 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
