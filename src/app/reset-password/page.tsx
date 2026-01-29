import { ResetPasswordForm } from '@/components/forms/ResetPasswordForm';

export const metadata = {
  title: '비밀번호 재설정 | 네오인증서',
  description: '새 비밀번호 설정',
};

/**
 * 비밀번호 재설정 페이지
 * recovery 토큰으로 인증된 세션에서 접근
 * (auth) 레이아웃 밖에 위치 (로그인 상태에서도 접근 가능하도록)
 */
export default function ResetPasswordPage(): React.ReactElement {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">네오인증서</h1>
          <p className="mt-2 text-sm text-gray-600">JAMBER 정품 인증 시스템</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}
