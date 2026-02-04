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
 * 개발/테스트 환경에서 실제 알림톡 API 발송을 테스트하기 위한 페이지
 *
 * 주요 기능:
 * - 템플릿 선택 및 변수 실시간 편집
 * - 카카오톡 스타일 메시지 미리보기
 * - 다중 수신자 동적 관리 (1~10명)
 * - Mock/Real 모드 지원 (ALIGO_TEST_MODE 환경변수)
 *
 * URL 파라미터:
 * - template: 초기 선택할 템플릿 코드 (기본값: CERT_COMPLETE)
 * - phone: 초기 수신자 전화번호
 */
export default async function AlimtalkTestSendPage({
  searchParams,
}: AlimtalkTestSendPageProps): Promise<React.ReactElement> {
  // 프로덕션 환경 접근 제어
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_TEST_SEND !== 'true'
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-xl font-semibold text-gray-900">
            접근이 제한되었습니다
          </h1>
          <p className="text-gray-600">
            이 페이지는 개발 환경에서만 사용 가능합니다.
          </p>
        </div>
      </div>
    );
  }

  const { template, phone } = await searchParams;

  return <AlimtalkTestSendClient initialTemplate={template} initialPhone={phone} />;
}
