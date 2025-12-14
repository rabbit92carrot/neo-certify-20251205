/**
 * 모바일 네비게이션 샘플 인덱스 페이지
 * 3가지 네비게이션 패턴을 비교할 수 있는 목록을 제공합니다.
 */

import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Menu, LayoutList, Star, ThumbsUp, ThumbsDown } from 'lucide-react';

const SAMPLES = [
  {
    title: 'Bottom Navigation',
    description: '하단 고정 네비게이션 바 + 더보기 시트',
    href: '/sample/mobile-nav/bottom-nav',
    icon: Smartphone,
    recommended: true,
    pros: ['엄지 접근성 우수', '주요 기능 빠른 탐색', '발견성 높음'],
    cons: ['5개 이상 메뉴 제한', '화면 하단 공간 차지'],
  },
  {
    title: 'Hamburger Menu',
    description: '전체 화면 오버레이 메뉴',
    href: '/sample/mobile-nav/hamburger',
    icon: Menu,
    recommended: false,
    pros: ['무제한 메뉴 수용', '화면 공간 효율적', '익숙한 패턴'],
    cons: ['숨겨진 메뉴로 발견성 낮음', '추가 탭 필요', '참여도 감소 가능'],
  },
  {
    title: 'Top Tabs',
    description: '상단 수평 스크롤 탭',
    href: '/sample/mobile-nav/top-tabs',
    icon: LayoutList,
    recommended: false,
    pros: ['모든 메뉴 노출', '스와이프 친화적', '현재 위치 명확'],
    cons: ['많은 탭은 스크롤 필요', '상단 공간 차지', '엄지 접근성 낮음'],
  },
];

export default function MobileNavIndexPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            모바일 네비게이션 패턴 비교
          </h1>
          <p className="text-gray-600">
            Neo-Certify 제조사 페이지(8개 메뉴)를 대상으로 3가지 모바일 네비게이션
            패턴을 비교합니다. 각 카드를 클릭하여 실제 동작을 확인해보세요.
          </p>
        </div>

        {/* 샘플 카드 그리드 */}
        <div className="grid gap-6 md:grid-cols-3">
          {SAMPLES.map((sample) => (
            <Link key={sample.href} href={sample.href} className="block">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <sample.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    {sample.recommended && (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        <Star className="h-3 w-3 mr-1" />
                        권장
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{sample.title}</CardTitle>
                  <CardDescription>{sample.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 장점 */}
                  <div>
                    <div className="flex items-center gap-1 text-sm font-medium text-green-700 mb-2">
                      <ThumbsUp className="h-4 w-4" />
                      장점
                    </div>
                    <ul className="space-y-1">
                      {sample.pros.map((pro, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-green-500 mt-1">+</span>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 단점 */}
                  <div>
                    <div className="flex items-center gap-1 text-sm font-medium text-red-700 mb-2">
                      <ThumbsDown className="h-4 w-4" />
                      단점
                    </div>
                    <ul className="space-y-1">
                      {sample.cons.map((con, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-red-500 mt-1">-</span>
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* 참고 사항 */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h2 className="font-semibold text-blue-900 mb-2">참고</h2>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • 각 샘플은 iPhone 14 Pro Max (430px) 크기로 시뮬레이션됩니다.
            </li>
            <li>
              • 메뉴 클릭 시 선택 상태가 표시됩니다 (실제 페이지 이동 없음).
            </li>
            <li>
              • 실제 구현 시에는 반응형 분기점(md: 768px)을 기준으로 데스크톱/모바일
              레이아웃을 전환합니다.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
