'use client';

import { useState, useCallback, useTransition } from 'react';
import { Search, Filter, Loader2, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { KakaoMessageCard } from './KakaoMessageCard';
import type { NotificationItem, NotificationType } from '@/services/notification.service';
import { normalizePhoneNumber } from '@/lib/utils';

interface KakaoMessageListProps {
  /** 초기 메시지 목록 */
  initialMessages: NotificationItem[];
  /** 초기 통계 */
  initialStats?: {
    totalCount: number;
    certificationCount: number;
    recallCount: number;
  };
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
 * 카카오 알림톡 메시지 목록 컴포넌트
 * 필터링 및 무한 스크롤 지원
 */
export function KakaoMessageList({
  initialMessages,
  initialStats,
  onLoadMore,
}: KakaoMessageListProps): React.ReactElement {
  const [messages, setMessages] = useState<NotificationItem[]>(initialMessages);
  const [phoneFilter, setPhoneFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('ALL');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialMessages.length >= 20);
  const [isPending, startTransition] = useTransition();
  const [isFiltering, setIsFiltering] = useState(false);

  // 필터링된 메시지 (클라이언트 사이드 필터링)
  const filteredMessages = messages.filter((msg) => {
    // 전화번호 필터
    if (phoneFilter) {
      const normalizedFilter = normalizePhoneNumber(phoneFilter);
      if (!msg.patientPhone.includes(normalizedFilter)) {
        return false;
      }
    }

    // 유형 필터
    if (typeFilter !== 'ALL' && msg.type !== typeFilter) {
      return false;
    }

    return true;
  });

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

  return (
    <div className="flex flex-col">
      {/* 통계 요약 */}
      {initialStats && (
        <div className="border-b bg-white px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">전체 메시지</span>
            <span className="font-medium">{initialStats.totalCount}건</span>
          </div>
          <div className="mt-1 flex gap-4 text-xs text-gray-500">
            <span>인증: {initialStats.certificationCount}건</span>
            <span>회수: {initialStats.recallCount}건</span>
          </div>
        </div>
      )}

      {/* 필터 영역 */}
      <div className="sticky top-0 z-10 border-b bg-white p-4 shadow-sm">
        <div className="flex gap-2">
          {/* 전화번호 검색 */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="전화번호 검색"
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 유형 필터 */}
          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as FilterType)}
          >
            <SelectTrigger className="w-[120px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체</SelectItem>
              <SelectItem value="CERTIFICATION">인증</SelectItem>
              <SelectItem value="RECALL">회수</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 필터 액션 */}
        {onLoadMore && (
          <div className="mt-2 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleApplyFilter}
              disabled={isPending}
              className="flex-1"
            >
              {isFiltering ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              검색
            </Button>
            <Button variant="ghost" size="sm" onClick={handleResetFilter} disabled={isPending}>
              초기화
            </Button>
          </div>
        )}
      </div>

      {/* 메시지 목록 */}
      <div className="divide-y divide-gray-100 bg-gray-50">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <MessageSquare className="mb-4 h-12 w-12 text-gray-300" />
            <p className="text-sm">알림 메시지가 없습니다.</p>
            {(phoneFilter || typeFilter !== 'ALL') && (
              <p className="mt-1 text-xs text-gray-400">필터 조건을 변경해보세요.</p>
            )}
          </div>
        ) : (
          filteredMessages.map((message) => (
            <KakaoMessageCard key={message.id} message={message} />
          ))
        )}
      </div>

      {/* 더보기 버튼 */}
      {hasMore && onLoadMore && (
        <div className="border-t bg-white p-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLoadMore}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                불러오는 중...
              </>
            ) : (
              '더보기'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
