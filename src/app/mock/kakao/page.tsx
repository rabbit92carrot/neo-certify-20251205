import { getNotificationMessages, getNotificationStats } from '@/services/notification.service';
import { KakaoMessageList } from '@/components/mock/KakaoMessageList';
import { loadMoreMessages } from './actions';

// 이 페이지는 Admin Client를 사용하는 서비스를 호출하므로 동적 렌더링 필요
export const dynamic = 'force-dynamic';

export const metadata = {
  title: '카카오 알림톡 Mock | 네오인증서',
  description: '환자에게 발송되는 알림톡 메시지 미리보기',
};

interface KakaoMockPageProps {
  searchParams: Promise<{ phone?: string }>;
}

/**
 * 카카오 알림톡 Mock 페이지
 * DB에 저장된 알림 메시지를 카카오톡 스타일로 표시
 *
 * 용도:
 * - 개발/테스트 과정에서 알림톡 메시지 형태 확인
 * - 메시지 구성 및 포맷 검증
 * - 실제 카카오톡 UI와 유사한 형태로 미리보기
 *
 * URL 파라미터:
 * - phone: 필터링할 전화번호 (시술 등록 후 해당 환자만 표시)
 */
export default async function KakaoMockPage({
  searchParams,
}: KakaoMockPageProps): Promise<React.ReactElement> {
  const { phone } = await searchParams;
  // 전화번호 정규화 (하이픈, 공백 제거)
  const normalizedPhone = phone?.replace(/[\s-]/g, '') || undefined;

  // 초기 데이터 로드 (RLS 우회 - Admin Client 사용)
  const [messagesResult, statsResult] = await Promise.all([
    getNotificationMessages({ page: 1, pageSize: 20, phoneNumber: normalizedPhone }),
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
    <div className="min-h-screen bg-gray-100">
      {/* 상단 네비게이션 바 - 카카오톡 스타일 */}
      <header className="sticky top-0 z-50 bg-[#FEE500]">
        <div className="mx-auto flex h-[60px] max-w-md items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {/* 카카오톡 로고 */}
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-[#3C1E1E]" fill="currentColor">
              <path d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.86 5.25 4.64 6.65-.15.55-.82 2.98-.85 3.18 0 0-.02.13.05.18.07.05.16.03.16.03.22-.03 2.54-1.67 3.6-2.35.77.12 1.58.18 2.4.18 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
            </svg>
            <div>
              <span className="text-lg font-bold text-[#3C1E1E]">네오인증서</span>
              <span className="ml-1.5 text-xs text-[#5C4033]">알림톡 Mock</span>
            </div>
          </div>

          {/* Mock 배지 */}
          <div className="rounded-full bg-[#3C1E1E]/10 px-3 py-1">
            <span className="text-xs font-medium text-[#3C1E1E]">테스트용</span>
          </div>
        </div>
      </header>

      {/* 메시지 목록 - 카카오톡 채팅방 스타일 */}
      <KakaoMessageList
        initialMessages={initialMessages}
        initialStats={initialStats}
        initialPhoneFilter={phone || ''}
        onLoadMore={loadMoreMessages}
      />
    </div>
  );
}
