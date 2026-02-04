import { AlimtalkTestSendClient } from './client';

export const metadata = {
  title: '알림톡 발송 테스트 | 네오인증서',
  description: '카카오 알림톡 실제 발송 테스트 페이지',
};

interface AlimtalkTestSendPageProps {
  searchParams: Promise<{
    template?: string;
    phone?: string;
  }>;
}

/**
 * 알림톡 발송 테스트 페이지
 * 비밀번호로 보호된 알림톡 API 발송 테스트 페이지
 *
 * 주요 기능:
 * - 템플릿 선택 및 변수 실시간 편집
 * - 카카오톡 스타일 메시지 미리보기
 * - 다중 수신자 동적 관리 (1~10명)
 * - Mock/Real 모드 지원 (ALIGO_TEST_MODE 환경변수)
 *
 * 접근 제어:
 * - ALIMTALK_TEST_PASSWORD 환경 변수로 비밀번호 설정
 * - 세션 스토리지에 인증 상태 저장 (브라우저 세션 동안 유효)
 *
 * URL 파라미터:
 * - template: 초기 선택할 템플릿 코드 (기본값: CERT_COMPLETE)
 * - phone: 초기 수신자 전화번호
 */
export default async function AlimtalkTestSendPage({
  searchParams,
}: AlimtalkTestSendPageProps): Promise<React.ReactElement> {
  const { template, phone } = await searchParams;

  return <AlimtalkTestSendClient initialTemplate={template} initialPhone={phone} />;
}
