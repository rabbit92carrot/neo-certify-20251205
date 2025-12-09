import { RegisterForm } from '@/components/forms/RegisterForm';

export const metadata = {
  title: '회원가입 | 네오인증서',
  description: 'PDO threads 정품 인증 시스템 회원가입',
};

/**
 * 회원가입 페이지
 */
export default function RegisterPage(): React.ReactElement {
  return <RegisterForm />;
}
