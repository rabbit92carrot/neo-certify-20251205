/**
 * 메시지함 View 컴포넌트
 * Admin/Manufacturer 공통 메시지함 페이지 뷰 (props 기반)
 */

import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Inbox, Mail, MailOpen, Clock, User, Building2 } from 'lucide-react';

export interface MessageItem {
  id: string;
  subject: string;
  content: string;
  senderName: string;
  senderType: 'SYSTEM' | 'ORGANIZATION' | 'ADMIN';
  isRead: boolean;
  createdAt: string;
}

export interface InboxViewProps {
  /** 메시지 목록 */
  messages: MessageItem[];
  /** 읽지 않은 메시지 수 */
  unreadCount: number;
  /** 페이지 제목 */
  title?: string;
  /** 페이지 설명 */
  description?: string;
}

const SENDER_ICONS = {
  SYSTEM: <Inbox className="h-4 w-4" />,
  ORGANIZATION: <Building2 className="h-4 w-4" />,
  ADMIN: <User className="h-4 w-4" />,
};

export function InboxView({
  messages,
  unreadCount,
  title = '메시지함',
  description = '수신된 메시지를 확인합니다.',
}: InboxViewProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />

      {/* 읽지 않은 메시지 통계 */}
      {unreadCount > 0 && (
        <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Mail className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-blue-800">
            {unreadCount}개의 읽지 않은 메시지
          </span>
        </div>
      )}

      {/* 메시지 목록 */}
      <div className="space-y-3">
        {messages.map((message) => (
          <Card
            key={message.id}
            className={`cursor-pointer hover:bg-gray-50 ${!message.isRead ? 'border-l-4 border-l-blue-500' : ''}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`mt-1 ${message.isRead ? 'text-gray-400' : 'text-blue-600'}`}>
                  {message.isRead ? (
                    <MailOpen className="h-5 w-5" />
                  ) : (
                    <Mail className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-medium ${!message.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                      {message.subject}
                    </span>
                    {!message.isRead && (
                      <Badge className="bg-blue-100 text-blue-800 text-xs">NEW</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate mb-2">
                    {message.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {SENDER_ICONS[message.senderType]}
                      <span>{message.senderName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{message.createdAt}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {messages.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Inbox className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>메시지가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
