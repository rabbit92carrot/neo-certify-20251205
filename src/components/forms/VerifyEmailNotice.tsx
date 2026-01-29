'use client';

/**
 * 이메일 인증 안내 컴포넌트
 * 회원가입 완료 후 이메일 인증을 안내하고 재발송 기능을 제공합니다.
 */

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, RefreshCw } from 'lucide-react';

import { resendVerificationAction } from '@/app/(auth)/actions';
import { Button } from '@/components/ui/button';

export function VerifyEmailNotice(): React.ReactElement {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  async function handleResend() {
    if (!email || isResending) return;

    setIsResending(true);
    setResendMessage(null);
    setResendError(null);

    try {
      const result = await resendVerificationAction(email);
      if (result.success) {
        setResendMessage('인증 메일을 재발송했습니다. 메일함을 확인해주세요.');
      } else {
        setResendError(result.error?.message || '재발송에 실패했습니다.');
      }
    } catch {
      setResendError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <Mail className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">이메일 인증</h2>
        <p className="mt-2 text-sm text-gray-600">
          가입하신 이메일로 인증 메일을 보냈습니다.
          <br />
          메일함을 확인해주세요.
        </p>
        {email && (
          <p className="mt-2 text-sm font-medium text-gray-800">{email}</p>
        )}
      </div>

      {resendMessage && (
        <div className="p-3 rounded-md bg-green-50 text-green-700 text-sm">
          {resendMessage}
        </div>
      )}

      {resendError && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
          {resendError}
        </div>
      )}

      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleResend}
          disabled={isResending || !email}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isResending ? 'animate-spin' : ''}`} />
          {isResending ? '발송 중…' : '인증 메일 재발송'}
        </Button>

        <div className="text-center text-sm">
          <Link href="/login" className="text-primary hover:underline font-medium">
            로그인 페이지로 이동
          </Link>
        </div>
      </div>

      <div className="rounded-md bg-gray-50 p-4 text-xs text-gray-500 space-y-1">
        <p>• 메일이 도착하지 않으면 스팸함을 확인해주세요.</p>
        <p>• 인증 메일은 발송 후 24시간 동안 유효합니다.</p>
        <p>• 이메일 인증 완료 후 로그인할 수 있습니다.</p>
      </div>
    </div>
  );
}
