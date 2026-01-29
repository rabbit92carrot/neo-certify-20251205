import { FindAccountForm } from '@/components/forms/FindAccountForm';

export const metadata = {
  title: '계정 찾기 | 네오인증서',
  description: '가입된 이메일 조회',
};

/**
 * 계정 찾기 페이지
 */
export default function FindAccountPage(): React.ReactElement {
  return <FindAccountForm />;
}
