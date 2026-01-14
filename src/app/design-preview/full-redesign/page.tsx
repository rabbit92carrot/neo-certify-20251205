import { Package, Factory, Truck, Boxes } from 'lucide-react';
import { IconSidebar } from '@/components/design-preview/layout/IconSidebar';
import { PreviewHeader } from '@/components/design-preview/layout/PreviewHeader';
import { DaouCard, DaouCardHeader, DaouCardContent, DaouCardTitle } from '@/components/design-preview/shared/DaouCard';
import { DaouStatCard } from '@/components/design-preview/shared/DaouStatCard';
import { ChartPlaceholder } from '@/components/design-preview/shared/ChartPlaceholder';
import { CalendarWidget } from '@/components/design-preview/widgets/CalendarWidget';
import { ActivityWidget } from '@/components/design-preview/widgets/ActivityWidget';
import { NoticeWidget } from '@/components/design-preview/widgets/NoticeWidget';

// Mock 데이터
const mockStats = {
  totalInventory: 12450,
  todayProduction: 350,
  todayShipments: 180,
  activeProducts: 24,
};

const mockOrg = {
  name: '(주)잼버코리아',
};

export const metadata = {
  title: '레이아웃+스타일 변경 | 디자인 프리뷰',
  description: '아이콘 사이드바 + 위젯 그리드 레이아웃',
};

/**
 * 풀 리디자인 프리뷰 페이지
 * 아이콘 사이드바 (w-20) + 위젯 그리드 레이아웃
 */
export default function FullRedesignPreviewPage(): React.ReactElement {
  return (
    <div className="min-h-screen daou-bg-main">
      {/* 아이콘 사이드바 */}
      <IconSidebar />

      {/* 메인 영역 */}
      <div className="md:pl-20">
        {/* 헤더 */}
        <PreviewHeader title="대시보드" />

        {/* 컨텐츠 */}
        <main className="p-6">
          {/* 위젯 그리드 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* 상단 영역: 환영 메시지 + 통계 카드 */}
            <div className="lg:col-span-8">
              <DaouCard className="mb-5">
                <DaouCardHeader>
                  <DaouCardTitle>환영합니다, {mockOrg.name}님</DaouCardTitle>
                </DaouCardHeader>
                <DaouCardContent>
                  <p className="daou-text-secondary">
                    JAMBER 정품 인증 시스템에 로그인되었습니다. 오늘도 좋은 하루 되세요.
                  </p>
                </DaouCardContent>
              </DaouCard>

              {/* 통계 카드 그리드 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                <DaouStatCard
                  title="총 재고량"
                  value={mockStats.totalInventory}
                  icon={Package}
                  accentColor="sky"
                />
                <DaouStatCard
                  title="오늘 생산량"
                  value={mockStats.todayProduction}
                  icon={Factory}
                  accentColor="mint"
                  trend={12}
                />
                <DaouStatCard
                  title="오늘 출고량"
                  value={mockStats.todayShipments}
                  icon={Truck}
                  accentColor="lavender"
                  trend={-5}
                />
                <DaouStatCard
                  title="활성 제품"
                  value={mockStats.activeProducts}
                  icon={Boxes}
                  accentColor="peach"
                />
              </div>

              {/* 차트 영역 */}
              <ChartPlaceholder title="월별 생산/출고 현황" height="h-56" />
            </div>

            {/* 우측 영역: 캘린더 + 활동 */}
            <div className="lg:col-span-4 space-y-5">
              <CalendarWidget />
              <ActivityWidget />
            </div>

            {/* 하단 영역: 공지사항 */}
            <div className="lg:col-span-12">
              <NoticeWidget />
            </div>
          </div>

          {/* 프리뷰 안내 */}
          <div className="text-center py-8">
            <p className="daou-text-muted text-sm">
              이 페이지는 레이아웃+스타일 변경 프리뷰입니다. 실제 데이터는 표시되지 않습니다.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
