'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Pagination } from '@/components/shared/Pagination';
import {
  MailOpen,
  AlertTriangle,
  Bell,
  MessageSquare,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

/**
 * OrganizationAlertTable은 Server Actions에 의존합니다.
 * Storybook에서는 Mock 컴포넌트로 UI를 시뮬레이션합니다.
 */

type AlertType = 'INACTIVE_PRODUCT_USAGE' | 'SYSTEM_NOTICE' | 'CUSTOM_MESSAGE';

const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  INACTIVE_PRODUCT_USAGE: '비활성 제품 사용',
  SYSTEM_NOTICE: '시스템 공지',
  CUSTOM_MESSAGE: '관리자 메시지',
};

interface MockAlert {
  id: string;
  alertType: AlertType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const mockAlerts: MockAlert[] = [
  {
    id: 'alert-001',
    alertType: 'INACTIVE_PRODUCT_USAGE',
    title: '비활성 제품 사용 감지',
    message: 'PDO Thread Type A 제품이 비활성화된 상태에서 출고되었습니다.',
    isRead: false,
    createdAt: '2024-12-10T09:30:00Z',
  },
  {
    id: 'alert-002',
    alertType: 'SYSTEM_NOTICE',
    title: '시스템 점검 안내',
    message: '2024년 12월 15일 오전 2시부터 4시까지 시스템 점검이 예정되어 있습니다.',
    isRead: false,
    createdAt: '2024-12-09T14:20:00Z',
  },
  {
    id: 'alert-003',
    alertType: 'CUSTOM_MESSAGE',
    title: '신규 기능 안내',
    message: '새로운 대시보드 기능이 추가되었습니다. 확인해보세요.',
    isRead: true,
    createdAt: '2024-12-08T11:15:00Z',
  },
  {
    id: 'alert-004',
    alertType: 'INACTIVE_PRODUCT_USAGE',
    title: '비활성 제품 시술 감지',
    message: 'PDO Thread Premium 제품이 비활성화된 상태에서 시술에 사용되었습니다.',
    isRead: false,
    createdAt: '2024-12-07T16:45:00Z',
  },
  {
    id: 'alert-005',
    alertType: 'SYSTEM_NOTICE',
    title: '개인정보 처리방침 변경',
    message: '개인정보 처리방침이 일부 변경되었습니다. 변경 내용을 확인해주세요.',
    isRead: true,
    createdAt: '2024-12-06T10:00:00Z',
  },
];

function getAlertTypeIcon(type: AlertType) {
  switch (type) {
    case 'INACTIVE_PRODUCT_USAGE':
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case 'SYSTEM_NOTICE':
      return <Bell className="h-4 w-4 text-blue-500" />;
    case 'CUSTOM_MESSAGE':
      return <MessageSquare className="h-4 w-4 text-purple-500" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
}

interface MockOrganizationAlertTableProps {
  alerts?: MockAlert[];
  showPagination?: boolean;
}

function MockOrganizationAlertTable({
  alerts = mockAlerts,
  showPagination = true,
}: MockOrganizationAlertTableProps) {
  const [items, setItems] = useState(alerts);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    const unreadIds = items.filter((a) => !a.isRead).map((a) => a.id);
    if (selectedIds.size === unreadIds.length && unreadIds.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unreadIds));
    }
  };

  const handleMarkAsRead = (alertId: string) => {
    setItems(items.map((item) =>
      item.id === alertId ? { ...item, isRead: true } : item
    ));
    const newSelected = new Set(selectedIds);
    newSelected.delete(alertId);
    setSelectedIds(newSelected);
    toast.success('알림이 읽음 처리되었습니다.');
  };

  const handleMarkSelectedAsRead = () => {
    setItems(items.map((item) =>
      selectedIds.has(item.id) ? { ...item, isRead: true } : item
    ));
    setSelectedIds(new Set());
    toast.success(`${selectedIds.size}개 알림이 읽음 처리되었습니다.`);
  };

  const handleViewDetail = (alert: MockAlert) => {
    toast.info(`알림 상세: ${alert.title}`);
    if (!alert.isRead) {
      handleMarkAsRead(alert.id);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <MailOpen className="h-12 w-12 mb-4" />
        <p>알림이 없습니다.</p>
      </div>
    );
  }

  const unreadItems = items.filter((a) => !a.isRead);
  const allUnreadSelected = unreadItems.length > 0 && selectedIds.size === unreadItems.length;

  return (
    <div className="space-y-4">
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 p-3 bg-muted rounded-md">
          <span className="text-sm font-medium">{selectedIds.size}개 선택됨</span>
          <Button size="sm" variant="outline" onClick={handleMarkSelectedAsRead}>
            선택 항목 읽음 처리
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={allUnreadSelected}
                  onCheckedChange={toggleSelectAll}
                  disabled={unreadItems.length === 0}
                />
              </TableHead>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="w-[120px]">유형</TableHead>
              <TableHead>제목</TableHead>
              <TableHead className="w-[160px]">일시</TableHead>
              <TableHead className="w-[100px]">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((alert) => (
              <TableRow
                key={alert.id}
                className={cn(
                  'transition-colors',
                  !alert.isRead && 'bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-950/20 dark:hover:bg-blue-950/30'
                )}
              >
                <TableCell>
                  {!alert.isRead && (
                    <Checkbox
                      checked={selectedIds.has(alert.id)}
                      onCheckedChange={() => toggleSelect(alert.id)}
                    />
                  )}
                </TableCell>
                <TableCell>
                  {!alert.isRead && (
                    <Badge className="bg-blue-500 hover:bg-blue-500 text-white text-[10px] px-1.5 py-0">
                      NEW
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getAlertTypeIcon(alert.alertType)}
                    <Badge variant="outline" className="font-normal">
                      {ALERT_TYPE_LABELS[alert.alertType]}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <button
                    className={cn(
                      'text-left hover:underline cursor-pointer',
                      !alert.isRead && 'font-semibold'
                    )}
                    onClick={() => handleViewDetail(alert)}
                  >
                    {alert.title}
                  </button>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(alert.createdAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewDetail(alert)}
                      title="상세 보기"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!alert.isRead && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkAsRead(alert.id)}
                        title="읽음으로 표시"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <MailOpen className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {showPagination && (
        <Pagination
          currentPage={currentPage}
          totalPages={3}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

const meta = {
  title: 'Tables/Shared/OrganizationAlertTable',
  component: MockOrganizationAlertTable,
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
} satisfies Meta<typeof MockOrganizationAlertTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    alerts: mockAlerts,
  },
};

export const AllUnread: Story = {
  args: {
    alerts: mockAlerts.map((a) => ({ ...a, isRead: false })),
  },
};

export const AllRead: Story = {
  args: {
    alerts: mockAlerts.map((a) => ({ ...a, isRead: true })),
  },
};

export const Empty: Story = {
  args: {
    alerts: [],
  },
};

export const NoPagination: Story = {
  args: {
    alerts: mockAlerts.slice(0, 3),
    showPagination: false,
  },
};
