import { VerifyEmailNotice } from '@/components/forms/VerifyEmailNotice';

export const metadata = {
  title: '이메일 인증 | 네오인증서',
  description: '이메일 인증 안내',
};

/**
 * 이메일 인증 안내 페이지
 * 회원가입 완료 후 리다이렉트되는 페이지
 */
export default function VerifyEmailPage(): React.ReactElement {
  return <VerifyEmailNotice />;
}
