import '@/components/design-preview/styles/design-preview.css';

export const metadata = {
  title: '디자인 프리뷰 | Neo-Certify',
  description: '디자인 변경 예시 페이지',
};

/**
 * 디자인 프리뷰 레이아웃
 * 인증 없이 접근 가능한 독립 레이아웃
 */
export default function DesignPreviewLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <>{children}</>;
}
