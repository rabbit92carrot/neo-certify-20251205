'use client';

/**
 * 관리자 이력 상세 UI 옵션 샘플 페이지
 * 5가지 UI 패턴을 비교하여 선택할 수 있는 샘플 페이지
 */

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Star, ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { OptionA_NestedAccordion } from './_components/OptionA_NestedAccordion';
import { OptionB_SlidePanel } from './_components/OptionB_SlidePanel';
import { OptionC_TabView } from './_components/OptionC_TabView';
import { OptionD_InlineScroll } from './_components/OptionD_InlineScroll';
import { OptionE_SubModal } from './_components/OptionE_SubModal';

const OPTIONS = [
  {
    id: 'a',
    title: 'A: 중첩 아코디언',
    description: 'Lot 클릭 시 아래로 펼쳐지는 방식',
    recommended: true,
    pros: ['현재 구조와 유사', '컨텍스트 유지', '직관적인 확장'],
    cons: ['여러 Lot 펼치면 길어짐', '스크롤 위치 이동'],
    reference: 'https://cloudscape.design/patterns/resource-management/view/table-with-expandable-rows/',
  },
  {
    id: 'b',
    title: 'B: 슬라이드 패널',
    description: '좌측 Lot 목록 + 우측 상세 패널',
    recommended: false,
    pros: ['세로 길이 제어 용이', '명확한 분리', '비교 가능'],
    cons: ['좁은 화면에서 불편', '모달 내 공간 제한'],
    reference: 'https://developer.adobe.com/commerce/admin-developer/pattern-library/containers/slideouts-modals-overlays/',
  },
  {
    id: 'c',
    title: 'C: 탭 기반',
    description: '요약/Lot/코드를 탭으로 분리',
    recommended: false,
    pros: ['깔끔한 분리', '고정 높이 유지', '정보 과부하 방지'],
    cons: ['탭 전환 필요', 'Lot 비교 어려움'],
    reference: 'https://www.designmonks.co/blog/nested-tab-ui',
  },
  {
    id: 'd',
    title: 'D: 인라인 + 스크롤',
    description: '확장 영역 내 스크롤 제한',
    recommended: false,
    pros: ['컴팩트', '최대 높이 제한', '페이지 길이 제어'],
    cons: ['이중 스크롤 혼란', '작은 영역'],
    reference: 'https://blog.logrocket.com/ux-design/data-table-design-best-practices/',
  },
  {
    id: 'e',
    title: 'E: 서브 모달',
    description: 'Lot 클릭 시 별도 모달',
    recommended: false,
    pros: ['충분한 공간', '완전한 분리', '상세 정보 집중'],
    cons: ['모달 위 모달 권장 안됨', '컨텍스트 전환'],
    reference: 'https://uxpatterns.dev/patterns/content-management/modal',
  },
];

export default function AdminHistoryDetailSamplePage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState('a');

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/sample/mobile-nav" className="inline-flex items-center text-sm text-blue-600 hover:underline mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            샘플 목록으로
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            관리자 이력 상세 UI 패턴 비교
          </h1>
          <p className="text-gray-600">
            Lot별 상세 정보와 고유식별코드를 표시하는 5가지 UI 패턴을 비교합니다.
            각 탭을 클릭하여 실제 동작을 확인해보세요.
          </p>
        </div>

        {/* 옵션 개요 카드 */}
        <div className="grid gap-4 md:grid-cols-5 mb-8">
          {OPTIONS.map((option) => (
            <Card
              key={option.id}
              className={`cursor-pointer transition-all ${
                activeTab === option.id
                  ? 'border-blue-500 bg-blue-50/50 shadow-md'
                  : 'hover:border-gray-300'
              }`}
              onClick={() => setActiveTab(option.id)}
            >
              <CardHeader className="p-4">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm">{option.title}</CardTitle>
                  {option.recommended && (
                    <Badge className="bg-green-100 text-green-700 text-xs">
                      <Star className="h-3 w-3 mr-0.5" />
                      권장
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs">
                  {option.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="hidden">
            {OPTIONS.map((option) => (
              <TabsTrigger key={option.id} value={option.id}>
                {option.title}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* 메인: 데모 영역 */}
            <div className="lg:col-span-2">
              <TabsContent value="a" className="mt-0">
                <OptionA_NestedAccordion />
              </TabsContent>
              <TabsContent value="b" className="mt-0">
                <OptionB_SlidePanel />
              </TabsContent>
              <TabsContent value="c" className="mt-0">
                <OptionC_TabView />
              </TabsContent>
              <TabsContent value="d" className="mt-0">
                <OptionD_InlineScroll />
              </TabsContent>
              <TabsContent value="e" className="mt-0">
                <OptionE_SubModal />
              </TabsContent>
            </div>

            {/* 사이드: 옵션 상세 */}
            <div className="lg:col-span-1">
              {OPTIONS.filter((o) => o.id === activeTab).map((option) => (
                <Card key={option.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {option.title}
                      {option.recommended && (
                        <Badge className="bg-green-100 text-green-700">권장</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{option.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 장점 */}
                    <div>
                      <div className="flex items-center gap-1 text-sm font-medium text-green-700 mb-2">
                        <ThumbsUp className="h-4 w-4" />
                        장점
                      </div>
                      <ul className="space-y-1">
                        {option.pros.map((pro, i) => (
                          <li
                            key={i}
                            className="text-sm text-gray-600 flex items-start gap-2"
                          >
                            <span className="text-green-500 mt-0.5">+</span>
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
                        {option.cons.map((con, i) => (
                          <li
                            key={i}
                            className="text-sm text-gray-600 flex items-start gap-2"
                          >
                            <span className="text-red-500 mt-0.5">-</span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 참고 링크 */}
                    <div className="pt-2 border-t">
                      <a
                        href={option.reference}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        UX 패턴 참고 문서
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </Tabs>

        {/* 테스트 데이터 안내 */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h2 className="font-semibold text-blue-900 mb-2">테스트 데이터 안내</h2>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Lot 3개</strong>: ND23060251106 (45개), ND23060251107 (30개), ND23060251108 (25개)</li>
            <li>• <strong>페이지네이션</strong>: 20개씩 표시, 각 Lot별 별도 페이징</li>
            <li>• <strong>데이터 구조</strong>: 제품명, 모델번호(model_name), 고유식별코드(NC-XXXXXXXX)</li>
            <li>• 실제 구현 시에는 DB에서 데이터를 조회하며, Server Action을 통해 페이지네이션됩니다.</li>
          </ul>
        </div>

        {/* 구현 가이드 */}
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <h2 className="font-semibold text-gray-900 mb-2">구현 시 수정 필요 파일</h2>
          <ul className="text-sm text-gray-700 space-y-1 font-mono">
            <li>• src/types/api.types.ts - AdminEventLotSummary에 modelName 추가</li>
            <li>• supabase/migrations/ - get_admin_event_summary 함수 수정</li>
            <li>• src/services/admin.service.ts - Lot별 코드 조회 함수 추가</li>
            <li>• src/app/(dashboard)/admin/actions.ts - Server Action 추가</li>
            <li>• src/components/tables/AdminEventSummaryTable.tsx - UI 컴포넌트 수정</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
