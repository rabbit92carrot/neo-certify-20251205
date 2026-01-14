import Link from 'next/link';
import { Paintbrush, Layout } from 'lucide-react';

/**
 * 디자인 프리뷰 인덱스 페이지
 * 두 가지 프리뷰 페이지로의 링크를 제공합니다.
 */
export default function DesignPreviewIndexPage(): React.ReactElement {
  return (
    <div className="min-h-screen daou-bg-main p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold daou-text-primary mb-3">디자인 프리뷰</h1>
          <p className="daou-text-secondary">
            다우오피스 스타일을 참고한 디자인 변경 예시를 확인하세요.
          </p>
        </div>

        {/* 프리뷰 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 스타일만 변경 */}
          <Link href="/design-preview/style-only" className="block">
            <div className="daou-bg-card daou-radius-lg daou-shadow-card daou-card-hover p-8 h-full">
              <div className="daou-accent-lavender daou-radius-md w-14 h-14 flex items-center justify-center mb-6">
                <Paintbrush className="w-7 h-7 daou-icon-lavender" />
              </div>
              <h2 className="text-xl font-semibold daou-text-primary mb-3">스타일만 변경</h2>
              <p className="daou-text-secondary text-sm leading-relaxed">
                현재 레이아웃 구조(사이드바 w-64, StatCard 4개)를 유지하면서 다우오피스 스타일만
                적용한 예시입니다.
              </p>
              <ul className="mt-4 space-y-2 text-sm daou-text-muted">
                <li>- 둥근 카드 모서리 (16-20px)</li>
                <li>- 부드러운 그림자</li>
                <li>- 파스텔 톤 아이콘 배경</li>
                <li>- 새로운 색상 팔레트</li>
              </ul>
            </div>
          </Link>

          {/* 레이아웃 + 스타일 변경 */}
          <Link href="/design-preview/full-redesign" className="block">
            <div className="daou-bg-card daou-radius-lg daou-shadow-card daou-card-hover p-8 h-full">
              <div className="daou-accent-mint daou-radius-md w-14 h-14 flex items-center justify-center mb-6">
                <Layout className="w-7 h-7 daou-icon-mint" />
              </div>
              <h2 className="text-xl font-semibold daou-text-primary mb-3">레이아웃 + 스타일</h2>
              <p className="daou-text-secondary text-sm leading-relaxed">
                아이콘 중심의 좁은 사이드바와 위젯 그리드 레이아웃을 적용한 풀 리디자인 예시입니다.
              </p>
              <ul className="mt-4 space-y-2 text-sm daou-text-muted">
                <li>- 아이콘 사이드바 (w-16)</li>
                <li>- 위젯 그리드 레이아웃</li>
                <li>- 캘린더/차트/활동 위젯</li>
                <li>- 다양한 크기의 카드</li>
              </ul>
            </div>
          </Link>
        </div>

        {/* 안내 문구 */}
        <div className="text-center mt-12">
          <p className="daou-text-muted text-sm">
            이 페이지들은 디자인 검토용 프리뷰입니다. 실제 데이터는 표시되지 않습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
