'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState, useMemo, useRef } from 'react';
import { Search, MessageSquare, ChevronDown, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { cn, maskPhoneNumber } from '@/lib/utils';

/**
 * 카카오톡 채팅방 스타일 메시지 목록
 * 날짜별 그룹핑 및 무한 스크롤을 지원합니다.
 */

type NotificationType = 'CERTIFICATION' | 'RECALL';

interface MockNotificationItem {
  id: string;
  patientPhone: string;
  type: NotificationType;
  content: string;
  isSent: boolean;
  createdAt: string;
  metadata?: {
    buttons?: Array<{ name: string; url: string }>;
  };
}

const mockMessages: MockNotificationItem[] = [
  {
    id: 'msg-001',
    patientPhone: '010-1234-5678',
    type: 'CERTIFICATION',
    content: '[네오인증서] 정품 인증 안내\n\n강남뷰티클리닉에서 시술받으신 PDO Thread Type A 5개가 정품 인증되었습니다.',
    isSent: true,
    createdAt: '2024-12-10T14:30:00Z',
    metadata: { buttons: [{ name: '정품 인증서 확인', url: '#' }] },
  },
  {
    id: 'msg-002',
    patientPhone: '010-2345-6789',
    type: 'CERTIFICATION',
    content: '[네오인증서] 정품 인증 안내\n\n청담스킨클리닉에서 시술받으신 PDO Thread Premium 3개가 정품 인증되었습니다.',
    isSent: true,
    createdAt: '2024-12-10T11:20:00Z',
    metadata: { buttons: [{ name: '정품 인증서 확인', url: '#' }] },
  },
  {
    id: 'msg-003',
    patientPhone: '010-1234-5678',
    type: 'RECALL',
    content: '[네오인증서] 인증 회수 안내\n\n2024년 12월 9일 시술받으신 PDO Thread Type A 2개의 정품 인증이 회수되었습니다.\n\n회수 사유: 환자 정보 오입력',
    isSent: true,
    createdAt: '2024-12-10T09:15:00Z',
  },
  {
    id: 'msg-004',
    patientPhone: '010-3456-7890',
    type: 'CERTIFICATION',
    content: '[네오인증서] 정품 인증 안내\n\n강남뷰티클리닉에서 시술받으신 PDO Thread Type B 4개가 정품 인증되었습니다.',
    isSent: true,
    createdAt: '2024-12-09T16:45:00Z',
    metadata: { buttons: [{ name: '정품 인증서 확인', url: '#' }] },
  },
  {
    id: 'msg-005',
    patientPhone: '010-4567-8901',
    type: 'CERTIFICATION',
    content: '[네오인증서] 정품 인증 안내\n\n압구정피부과에서 시술받으신 PDO Thread Type A 6개가 정품 인증되었습니다.',
    isSent: true,
    createdAt: '2024-12-09T10:30:00Z',
    metadata: { buttons: [{ name: '정품 인증서 확인', url: '#' }] },
  },
  {
    id: 'msg-006',
    patientPhone: '010-5678-9012',
    type: 'RECALL',
    content: '[네오인증서] 인증 회수 안내\n\n2024년 12월 8일 시술받으신 PDO Thread Premium 1개의 정품 인증이 회수되었습니다.\n\n회수 사유: 제품 불량 교환',
    isSent: true,
    createdAt: '2024-12-08T15:20:00Z',
  },
];

// 간단한 메시지 카드 (인라인으로 정의)
function MockMessageCard({ message }: { message: MockNotificationItem }) {
  const isCertification = message.type === 'CERTIFICATION';
  const displayPhone = maskPhoneNumber(message.patientPhone);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const period = hours < 12 ? '오전' : '오후';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${period} ${displayHours}:${minutes}`;
  };

  return (
    <div className="flex gap-2 px-4 py-2">
      <div className="flex-shrink-0">
        <div className="h-10 w-10 overflow-hidden rounded-[12px] bg-[#FEE500]">
          <div className="flex h-full w-full items-center justify-center">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#3C1E1E]" fill="currentColor">
              <path d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.86 5.25 4.64 6.65-.15.55-.82 2.98-.85 3.18 0 0-.02.13.05.18.07.05.16.03.16.03.22-.03 2.54-1.67 3.6-2.35.77.12 1.58.18 2.4.18 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="min-w-0 max-w-[280px] flex-1">
        <div className="mb-1 text-xs font-medium text-gray-800">네오인증서</div>

        <div className="relative">
          <div className="rounded-[18px] rounded-tl-[4px] px-3 py-2.5 shadow-sm bg-white border border-gray-200">
            <div className="mb-2 flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <div className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full',
                isCertification ? 'bg-blue-500' : 'bg-orange-500'
              )}>
                {isCertification ? (
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
                  </svg>
                )}
              </div>
              <span className="text-xs font-medium text-gray-700">
                {isCertification ? '정품 인증 알림' : '인증 회수 알림'}
              </span>
            </div>

            <pre className="whitespace-pre-wrap break-words font-sans text-[13px] leading-[1.4] text-gray-900">
              {message.content}
            </pre>

            {message.metadata?.buttons && (
              <div className="mt-3 space-y-2">
                {message.metadata.buttons.map((button, idx) => (
                  <a key={idx} href={button.url} className="block w-full rounded-md bg-[#FEE500] py-2.5 text-center text-sm font-medium text-[#3C1E1E]">
                    {button.name}
                  </a>
                ))}
              </div>
            )}

            <div className="mt-3 border-t border-gray-100 pt-2">
              <div className="flex items-center justify-between text-[11px] text-gray-500">
                <span>수신자: {displayPhone}</span>
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-medium',
                  message.isSent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                )}>
                  {message.isSent ? '발송완료' : '발송대기'}
                </span>
              </div>
            </div>
          </div>

          <div className="absolute -right-14 bottom-0 text-[10px] text-gray-400">
            {formatTime(message.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MockKakaoMessageListProps {
  messages?: MockNotificationItem[];
  stats?: {
    totalCount: number;
    certificationCount: number;
    recallCount: number;
  };
  hasMore?: boolean;
}

function MockKakaoMessageList({
  messages = mockMessages,
  stats = { totalCount: 6, certificationCount: 4, recallCount: 2 },
  hasMore = true,
}: MockKakaoMessageListProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [phoneFilter, setPhoneFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | NotificationType>('ALL');
  const [isLoading, setIsLoading] = useState(false);

  const typeFilterOptions: ComboboxOption[] = [
    { value: 'ALL', label: '전체' },
    { value: 'CERTIFICATION', label: '인증' },
    { value: 'RECALL', label: '회수' },
  ];

  // 날짜별 그룹핑
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: MockNotificationItem[] }[] = [];
    let currentDate = '';

    const sortedMessages = [...messages].reverse();

    for (const msg of sortedMessages) {
      const msgDate = new Date(msg.createdAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      });

      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1]?.messages.push(msg);
      }
    }

    return groups;
  }, [messages]);

  const handleLoadMore = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="mx-auto flex h-[600px] max-w-md flex-col bg-[#B2C7D9] rounded-lg overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between bg-[#B2C7D9] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-full bg-[#FEE500]">
            <div className="flex h-full w-full items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#3C1E1E]" fill="currentColor">
                <path d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.86 5.25 4.64 6.65-.15.55-.82 2.98-.85 3.18 0 0-.02.13.05.18.07.05.16.03.16.03.22-.03 2.54-1.67 3.6-2.35.77.12 1.58.18 2.4.18 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
              </svg>
            </div>
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-900">네오인증서 알림</h1>
            <p className="text-xs text-gray-600">
              총 {stats.totalCount}건 (인증 {stats.certificationCount} / 회수 {stats.recallCount})
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="h-8 w-8 p-0 hover:bg-white/30"
        >
          <Search className="h-5 w-5 text-gray-700" />
        </Button>
      </div>

      {/* 필터 */}
      {showFilters && (
        <div className="border-b border-gray-300 bg-white/80 p-3 backdrop-blur-sm">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="전화번호 검색"
                value={phoneFilter}
                onChange={(e) => setPhoneFilter(e.target.value)}
                className="h-9 bg-white pl-8 text-sm"
              />
            </div>
            <div className="w-24">
              <Combobox
                options={typeFilterOptions}
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value as typeof typeFilter)}
                placeholder="전체"
                searchPlaceholder="유형..."
              />
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <Button
              variant="default"
              size="sm"
              className="h-8 flex-1 bg-[#FEE500] text-[#3C1E1E] hover:bg-[#FDD835]"
            >
              검색
            </Button>
            <Button variant="outline" size="sm" className="h-8">
              초기화
            </Button>
          </div>
        </div>
      )}

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto">
        {groupedMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-16 text-gray-500">
            <div className="mb-4 rounded-full bg-white/50 p-4">
              <MessageSquare className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-sm font-medium">알림 메시지가 없습니다</p>
          </div>
        ) : (
          <div className="pb-4">
            {groupedMessages.map((group, groupIndex) => (
              <div key={groupIndex}>
                <div className="flex items-center justify-center py-3">
                  <div className="rounded-full bg-gray-500/20 px-3 py-1">
                    <span className="text-xs text-gray-600">{group.date}</span>
                  </div>
                </div>
                {group.messages.map((message) => (
                  <MockMessageCard key={message.id} message={message} />
                ))}
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="py-3 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLoadMore}
              disabled={isLoading}
              className="h-8 rounded-full bg-white/60 px-4 text-xs text-gray-600 hover:bg-white/80"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  불러오는 중...
                </>
              ) : (
                <>
                  <ChevronDown className="mr-1 h-3.5 w-3.5" />
                  이전 메시지 보기
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* 하단 안내 */}
      <div className="border-t border-gray-300 bg-white/90 px-4 py-2 text-center">
        <p className="text-[11px] text-gray-500">
          이 화면은 테스트용 Mock 페이지입니다. 실제 알림톡은 카카오 API로 발송됩니다.
        </p>
      </div>
    </div>
  );
}

const meta = {
  title: 'Mock/KakaoMessageList',
  component: MockKakaoMessageList,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MockKakaoMessageList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    messages: mockMessages,
    stats: { totalCount: 6, certificationCount: 4, recallCount: 2 },
    hasMore: true,
  },
};

export const Empty: Story = {
  args: {
    messages: [],
    stats: { totalCount: 0, certificationCount: 0, recallCount: 0 },
    hasMore: false,
  },
};

export const CertificationOnly: Story = {
  args: {
    messages: mockMessages.filter((m) => m.type === 'CERTIFICATION'),
    stats: { totalCount: 4, certificationCount: 4, recallCount: 0 },
    hasMore: false,
  },
};

export const RecallOnly: Story = {
  args: {
    messages: mockMessages.filter((m) => m.type === 'RECALL'),
    stats: { totalCount: 2, certificationCount: 0, recallCount: 2 },
    hasMore: false,
  },
};

export const NoMoreMessages: Story = {
  args: {
    messages: mockMessages.slice(0, 2),
    stats: { totalCount: 2, certificationCount: 1, recallCount: 1 },
    hasMore: false,
  },
};
