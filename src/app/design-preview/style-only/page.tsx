import { Package, Factory, Truck, Boxes } from 'lucide-react';
import { StyleOnlySidebar } from '@/components/design-preview/layout/StyleOnlySidebar';
import { PreviewHeader } from '@/components/design-preview/layout/PreviewHeader';
import { DaouCard, DaouCardHeader, DaouCardContent, DaouCardTitle } from '@/components/design-preview/shared/DaouCard';
import { DaouStatCard } from '@/components/design-preview/shared/DaouStatCard';

// Mock 데이터
const mockStats = {
  totalInventory: 12450,
  todayProduction: 350,
  todayShipments: 180,
  activeProducts: 24,
};

const mockOrg = {
  name: '(주)잼버코리아',
  email: 'contact@jamber.co.kr',
  businessNumber: '123-45-67890',
  representative: '홍길동',
};

export const metadata = {
  title: '스타일만 변경 | 디자인 프리뷰',
  description: '기존 레이아웃 구조 유지 + 다우오피스 스타일 적용',
};

/**
 * 스타일만 변경 프리뷰 페이지
 * 현재 제조사 대시보드 구조(사이드바 w-64, StatCard 4개) 유지
 * 다우오피스 스타일만 적용
 */
export default function StyleOnlyPreviewPage(): React.ReactElement {
  return (
    <div className="min-h-screen daou-bg-main">
      {/* 사이드바 */}
      <StyleOnlySidebar />

      {/* 메인 영역 */}
      <div className="md:pl-64">
        {/* 헤더 */}
        <PreviewHeader title="대시보드" />

        {/* 컨텐츠 */}
        <main className="p-6 space-y-6">
          {/* 환영 메시지 카드 */}
          <DaouCard>
            <DaouCardHeader>
              <DaouCardTitle>환영합니다, {mockOrg.name}님</DaouCardTitle>
            </DaouCardHeader>
            <DaouCardContent>
              <p className="daou-text-secondary">JAMBER 정품 인증 시스템에 로그인되었습니다.</p>
              <div className="mt-4 space-y-2 text-sm daou-text-muted">
                <p>이메일: {mockOrg.email}</p>
                <p>사업자번호: {mockOrg.businessNumber}</p>
                <p>대표자: {mockOrg.representative}</p>
              </div>
            </DaouCardContent>
          </DaouCard>

          {/* 통계 카드 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <DaouStatCard
              title="총 재고량"
              value={mockStats.totalInventory}
              icon={Package}
              accentColor="sky"
              description="현재 보유 중인 총 재고"
            />
            <DaouStatCard
              title="오늘 생산량"
              value={mockStats.todayProduction}
              icon={Factory}
              accentColor="mint"
              description="오늘 등록된 생산 수량"
              trend={12}
            />
            <DaouStatCard
              title="오늘 출고량"
              value={mockStats.todayShipments}
              icon={Truck}
              accentColor="lavender"
              description="오늘 출고된 수량"
              trend={-5}
            />
            <DaouStatCard
              title="활성 제품"
              value={mockStats.activeProducts}
              icon={Boxes}
              accentColor="peach"
              description="등록된 제품 종류"
            />
          </div>

          {/* 프리뷰 안내 */}
          <div className="text-center py-8">
            <p className="daou-text-muted text-sm">
              이 페이지는 스타일 변경 프리뷰입니다. 실제 데이터는 표시되지 않습니다.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
