import { getNotificationMessages, getNotificationStats } from '@/services/notification.service';
import { KakaoMessageList } from '@/components/mock/KakaoMessageList';
import { loadMoreMessages } from './actions';

export const metadata = {
  title: '카카오 알림톡 Mock | 네오인증서',
  description: '환자에게 발송되는 알림톡 메시지 미리보기',
};

/**
 * 카카오 알림톡 Mock 페이지
 * DB에 저장된 알림 메시지를 카카오톡 스타일로 표시
 */
export default async function KakaoMockPage(): Promise<React.ReactElement> {
  // 초기 데이터 로드
  const [messagesResult, statsResult] = await Promise.all([
    getNotificationMessages({ page: 1, pageSize: 20 }),
    getNotificationStats(),
  ]);

  const initialMessages = messagesResult.success && messagesResult.data
    ? messagesResult.data.items
    : [];

  const initialStats = statsResult.success && statsResult.data
    ? {
        totalCount: statsResult.data.totalCount,
        certificationCount: statsResult.data.certificationCount,
        recallCount: statsResult.data.recallCount,
      }
    : undefined;

  return (
    <div className="min-h-[calc(100vh-60px)]">
      {/* 안내 배너 */}
      <div className="bg-[#FEE500]/20 px-4 py-3">
        <p className="text-center text-sm text-[#3C1E1E]">
          <span className="font-medium">Mock 페이지</span>
          <span className="mx-2">|</span>
          실제 알림톡은 2차 개발에서 연동됩니다
        </p>
      </div>

      {/* 메시지 목록 */}
      <KakaoMessageList
        initialMessages={initialMessages}
        initialStats={initialStats}
        onLoadMore={loadMoreMessages}
      />
    </div>
  );
}
