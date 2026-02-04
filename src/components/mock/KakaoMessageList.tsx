'use client';

import { useState, useCallback, useTransition, useMemo, useRef } from 'react';
import { Search, Loader2, MessageSquare, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { KakaoMessageCard } from './KakaoMessageCard';
import type { NotificationItem, NotificationType } from '@/services/notification.service';

interface KakaoMessageListProps {
  /** 초기 메시지 목록 */
  initialMessages: NotificationItem[];
  /** 초기 통계 */
  initialStats?: {
    totalCount: number;
    certificationCount: number;
    recallCount: number;
  };
  /** 초기 전화번호 필터 (URL 파라미터로 전달됨) */
  initialPhoneFilter?: string;
  /** 메시지 더 불러오기 함수 */
  onLoadMore?: (params: {
    phoneNumber?: string;
    type?: NotificationType;
    page: number;
  }) => Promise<{
    items: NotificationItem[];
    hasMore: boolean;
  }>;
}

type FilterType = 'ALL' | NotificationType;

/**
 * 카카오톡 채팅방 스타일 메시지 목록
 * 날짜별 그룹핑 및 무한 스크롤 지원
 */
export function KakaoMessageList({
  initialMessages,
  initialStats,
  initialPhoneFilter = '',
  onLoadMore,
}: KakaoMessageListProps): React.ReactElement {
  const [messages, setMessages] = useState<NotificationItem[]>(initialMessages);
  const [phoneFilter, setPhoneFilter] = useState(initialPhoneFilter);
  const [typeFilter, setTypeFilter] = useState<FilterType>('ALL');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialMessages.length >= 20);
  const [isPending, startTransition] = useTransition();
  const [isFiltering, setIsFiltering] = useState(false);
  // 초기 필터가 있으면 필터 영역 자동 표시
  const [showFilters, setShowFilters] = useState(!!initialPhoneFilter);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 날짜별 그룹핑
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: NotificationItem[] }[] = [];
    let currentDate = '';

    // 최신순으로 정렬된 메시지를 역순으로 (오래된 것부터)
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

  // 더보기 로드
  const handleLoadMore = useCallback(() => {
    if (!onLoadMore || isPending) {
      return;
    }

    startTransition(async () => {
      const nextPage = page + 1;
      const result = await onLoadMore({
        phoneNumber: phoneFilter || undefined,
        type: typeFilter === 'ALL' ? undefined : typeFilter,
        page: nextPage,
      });

      setMessages((prev) => [...prev, ...result.items]);
      setPage(nextPage);
      setHasMore(result.hasMore);
    });
  }, [onLoadMore, isPending, page, phoneFilter, typeFilter]);

  // 필터 적용 (서버 재조회)
  const handleApplyFilter = useCallback(() => {
    if (!onLoadMore) {
      return;
    }

    setIsFiltering(true);
    startTransition(async () => {
      const result = await onLoadMore({
        phoneNumber: phoneFilter || undefined,
        type: typeFilter === 'ALL' ? undefined : typeFilter,
        page: 1,
      });

      setMessages(result.items);
      setPage(1);
      setHasMore(result.hasMore);
      setIsFiltering(false);
    });
  }, [onLoadMore, phoneFilter, typeFilter]);

  // 필터 초기화
  const handleResetFilter = useCallback(() => {
    setPhoneFilter('');
    setTypeFilter('ALL');

    if (onLoadMore) {
      startTransition(async () => {
        const result = await onLoadMore({ page: 1 });
        setMessages(result.items);
        setPage(1);
        setHasMore(result.hasMore);
      });
    }
  }, [onLoadMore]);

  // 유형 필터 옵션
  const typeFilterOptions: ComboboxOption[] = useMemo(
    () => [
      { value: 'ALL', label: '전체' },
      { value: 'CERTIFICATION', label: '인증' },
      { value: 'RECALL', label: '회수' },
    ],
    []
  );

  return (
    <div className="mx-auto flex h-[calc(100vh-60px)] max-w-md flex-col bg-[#B2C7D9]">
      {/* 채팅방 헤더 - 카카오톡 스타일 */}
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
            {initialStats && (
              <p className="text-xs text-gray-600">
                총 {initialStats.totalCount}건 (인증 {initialStats.certificationCount} / 회수{' '}
                {initialStats.recallCount})
              </p>
            )}
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

      {/* 필터 영역 (토글) */}
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
                onValueChange={(value) => setTypeFilter(value as FilterType)}
                placeholder="전체"
                searchPlaceholder="유형..."
              />
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleApplyFilter}
              disabled={isPending}
              className="h-8 flex-1 bg-[#FEE500] text-[#3C1E1E] hover:bg-[#FDD835]"
            >
              {isFiltering ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              검색
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilter}
              disabled={isPending}
              className="h-8"
            >
              초기화
            </Button>
          </div>
        </div>
      )}

      {/* 메시지 영역 - 카카오톡 채팅방 배경 */}
      <div className="flex-1 overflow-y-auto">
        {/* 메시지 목록 */}
        {groupedMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-16 text-gray-500">
            <div className="mb-4 rounded-full bg-white/50 p-4">
              <MessageSquare className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-sm font-medium">알림 메시지가 없습니다</p>
            <p className="mt-1 text-xs text-gray-400">
              시술 등록 시 자동으로 메시지가 생성됩니다
            </p>
          </div>
        ) : (
          <div className="pb-4">
            {groupedMessages.map((group, groupIndex) => (
              <div key={groupIndex}>
                {/* 날짜 구분선 - 카카오톡 스타일 */}
                <div className="flex items-center justify-center py-3">
                  <div className="rounded-full bg-gray-500/20 px-3 py-1">
                    <span className="text-xs text-gray-600">{group.date}</span>
                  </div>
                </div>

                {/* 해당 날짜의 메시지들 */}
                {group.messages.map((message) => (
                  <KakaoMessageCard key={message.id} message={message} />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* 더보기 버튼 (하단에 위치 - 이전 메시지 로드) */}
        {hasMore && onLoadMore && (
          <div className="py-3 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLoadMore}
              disabled={isPending}
              className="h-8 rounded-full bg-white/60 px-4 text-xs text-gray-600 hover:bg-white/80"
            >
              {isPending ? (
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
        <div ref={messagesEndRef} />
      </div>

      {/* 하단 Mock 안내 */}
      <div className="border-t border-gray-300 bg-white/90 px-4 py-2 text-center">
        <p className="text-[11px] text-gray-500">
          이 화면은 테스트용 Mock 페이지입니다. 실제 알림톡은 카카오 API로 발송됩니다.
        </p>
      </div>
    </div>
  );
}
