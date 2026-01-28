import { AlimtalkTemplatesPageClient } from './client';

export const metadata = {
  title: '알림톡 템플릿 미리보기 | 네오인증서',
  description: '카카오 알림톡 템플릿 미리보기 및 변수 테스트',
};

/**
 * 알림톡 템플릿 미리보기 페이지
 *
 * 용도:
 * - 카카오 알림톡 템플릿 심사 전 미리보기
 * - 변수 치환 결과 확인
 * - 발송 시뮬레이션 (mock 메시지 저장)
 * - 템플릿 정보 (글자수, 버튼 개수 등) 확인
 */
export default function AlimtalkTemplatesPage(): React.ReactElement {
  return <AlimtalkTemplatesPageClient />;
}
