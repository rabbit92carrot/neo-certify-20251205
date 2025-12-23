import { cn, maskPhoneNumber } from '@/lib/utils';
import type { NotificationItem } from '@/services/notification.service';

interface KakaoMessageCardProps {
  message: NotificationItem;
  /** 전화번호 마스킹 여부 (기본: true) */
  maskPhone?: boolean;
}

/**
 * 카카오톡 알림톡 스타일 메시지 카드
 * 실제 카카오톡 알림톡 UI를 모방
 */
export function KakaoMessageCard({
  message,
  maskPhone = true,
}: KakaoMessageCardProps): React.ReactElement {
  const isCertification = message.type === 'CERTIFICATION';
  const displayPhone = maskPhone ? maskPhoneNumber(message.patientPhone) : message.patientPhone;

  // 시간 포맷 (오전/오후 HH:MM)
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
      {/* 프로필 이미지 - 카카오톡 스타일 */}
      <div className="flex-shrink-0">
        <div className="h-10 w-10 overflow-hidden rounded-[12px] bg-[#FEE500]">
          {/* 네오인증서 로고 또는 기본 아이콘 */}
          <div className="flex h-full w-full items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6 text-[#3C1E1E]"
              fill="currentColor"
            >
              <path d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.86 5.25 4.64 6.65-.15.55-.82 2.98-.85 3.18 0 0-.02.13.05.18.07.05.16.03.16.03.22-.03 2.54-1.67 3.6-2.35.77.12 1.58.18 2.4.18 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="min-w-0 max-w-[280px] flex-1">
        {/* 발신자 이름 */}
        <div className="mb-1 text-xs font-medium text-gray-800">네오인증서</div>

        {/* 말풍선 - 카카오톡 알림톡 스타일 */}
        <div className="relative">
          <div
            className={cn(
              'rounded-[18px] rounded-tl-[4px] px-3 py-2.5 shadow-sm',
              'bg-white border border-gray-200'
            )}
          >
            {/* 알림톡 헤더 (카카오 알림톡 스타일) */}
            <div className="mb-2 flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <div
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full',
                  isCertification ? 'bg-blue-500' : 'bg-orange-500'
                )}
              >
                {isCertification ? (
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <span className="text-xs font-medium text-gray-700">
                {isCertification ? '정품 인증 알림' : '인증 회수 알림'}
              </span>
            </div>

            {/* 메시지 본문 */}
            <pre className="whitespace-pre-wrap break-words font-sans text-[13px] leading-[1.4] text-gray-900">
              {message.content}
            </pre>

            {/* URL 버튼 영역 (카카오 알림톡 스타일) */}
            {message.metadata?.buttons && message.metadata.buttons.length > 0 && (
              <div className="mt-3 space-y-2">
                {message.metadata.buttons.map((button, idx) => (
                  <a
                    key={idx}
                    href={button.url}
                    className="block w-full rounded-md bg-[#FEE500] py-2.5 text-center text-sm font-medium text-[#3C1E1E] transition-colors hover:bg-[#FDD835]"
                  >
                    {button.name}
                  </a>
                ))}
              </div>
            )}

            {/* 하단 정보 */}
            <div className="mt-3 border-t border-gray-100 pt-2">
              <div className="flex items-center justify-between text-[11px] text-gray-500">
                <span>수신자: {displayPhone}</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-medium',
                    message.isSent
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  )}
                >
                  {message.isSent ? '발송완료' : '발송대기'}
                </span>
              </div>
            </div>
          </div>

          {/* 타임스탬프 - 말풍선 옆에 표시 (카카오톡 스타일) */}
          <div className="absolute -right-14 bottom-0 text-[10px] text-gray-400">
            {formatTime(message.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}
