import { ForgotPasswordForm } from '@/components/forms/ForgotPasswordForm';

export const metadata = {
  title: '비밀번호 찾기 | 네오인증서',
  description: '비밀번호 재설정 메일 발송',
};

/**
 * 비밀번호 찾기 페이지
 */
export default function ForgotPasswordPage(): React.ReactElement {
  return <ForgotPasswordForm />;
}
