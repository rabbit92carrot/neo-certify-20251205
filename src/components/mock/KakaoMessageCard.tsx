import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn, formatDateTimeKorea, maskPhoneNumber } from '@/lib/utils';
import type { NotificationItem } from '@/services/notification.service';

interface KakaoMessageCardProps {
  message: NotificationItem;
  /** 전화번호 마스킹 여부 (기본: true) */
  maskPhone?: boolean;
}

/**
 * 카카오톡 스타일 메시지 카드
 * 알림 유형에 따라 다른 스타일 적용
 */
export function KakaoMessageCard({
  message,
  maskPhone = true,
}: KakaoMessageCardProps): React.ReactElement {
  const isCertification = message.type === 'CERTIFICATION';
  const displayPhone = maskPhone ? maskPhoneNumber(message.patientPhone) : message.patientPhone;

  return (
    <div className="flex gap-3 px-4 py-3">
      {/* 프로필 아이콘 */}
      <div className="flex-shrink-0">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full',
            isCertification ? 'bg-emerald-100' : 'bg-amber-100'
          )}
        >
          {isCertification ? (
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          )}
        </div>
      </div>

      {/* 메시지 내용 */}
      <div className="min-w-0 flex-1">
        {/* 발신자 정보 */}
        <div className="mb-1 flex items-center gap-2">
          <span className="font-medium text-gray-900">네오인증서</span>
          <span
            className={cn(
              'rounded px-1.5 py-0.5 text-xs font-medium',
              isCertification
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            )}
          >
            {message.typeLabel}
          </span>
        </div>

        {/* 말풍선 */}
        <div
          className={cn(
            'relative rounded-lg rounded-tl-none p-3 shadow-sm',
            isCertification ? 'bg-white' : 'bg-amber-50'
          )}
        >
          {/* 메시지 본문 - 줄바꿈 유지 */}
          <pre className="whitespace-pre-wrap break-words font-sans text-sm text-gray-800">
            {message.content}
          </pre>

          {/* 구분선 */}
          <div className="my-2 border-t border-gray-200" />

          {/* 하단 정보 */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>수신: {displayPhone}</span>
            <span
              className={cn(
                'rounded px-1.5 py-0.5',
                message.isSent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              )}
            >
              {message.isSent ? '발송완료' : '대기중'}
            </span>
          </div>
        </div>

        {/* 타임스탬프 */}
        <div className="mt-1 text-right text-xs text-gray-400">
          {formatDateTimeKorea(message.createdAt)}
        </div>
      </div>
    </div>
  );
}
