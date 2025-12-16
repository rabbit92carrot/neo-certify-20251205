'use client';

/**
 * 생산 등록 제품 선택 UI 패턴 샘플 페이지
 * 4가지 UX 개선 옵션을 비교하여 선택할 수 있는 샘플 페이지
 */

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Star, ThumbsUp, ThumbsDown, ExternalLink, Smartphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { OptionA_SearchDropdown } from './_components/OptionA_SearchDropdown';
import { OptionB_TwoColumn } from './_components/OptionB_TwoColumn';
import { OptionC_Accordion } from './_components/OptionC_Accordion';
import { OptionD_TwoColumnSearch } from './_components/OptionD_TwoColumnSearch';

const OPTIONS = [
  {
    id: 'a',
    title: 'A: 검색 + 드롭다운',
    description: '검색과 2단계 드롭다운 선택',
    recommended: true,
    mobileOptimized: true,
    pros: ['컴팩트한 UI', '검색으로 빠른 찾기', '모바일 친화적'],
    cons: ['전체 목록 한눈에 보기 어려움', '2단계 선택 필요'],
    reference: 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/',
  },
  {
    id: 'b',
    title: 'B: 2열 레이아웃',
    description: '좌측 카드 목록 + 우측 폼 고정',
    recommended: false,
    mobileOptimized: false,
    pros: ['기존 카드 UI 유지', '생산 정보 항상 보임', '직관적인 선택'],
    cons: ['스크롤 여전히 필요', '모바일에서 좁아짐'],
    reference: 'https://www.nngroup.com/articles/split-screen-design/',
  },
  {
    id: 'c',
    title: 'C: 아코디언 그룹',
    description: '제품명별 아코디언 그룹화',
    recommended: false,
    mobileOptimized: true,
    pros: ['제품명별 그룹화', '필요한 것만 펼침', '모바일 친화적'],
    cons: ['클릭 2번 필요', '펼치면 길어질 수 있음'],
    reference: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
  },
  {
    id: 'd',
    title: 'D: 2열 + 검색',
    description: '옵션 B에 검색 필터 추가',
    recommended: false,
    mobileOptimized: false,
    pros: ['카드 UI + 검색', '하이라이트 표시', '필터링 가능'],
    cons: ['여전히 스크롤 필요', '모바일 불편'],
    reference: 'https://www.nngroup.com/articles/search-visible-and-simple/',
  },
];

export default function ProductionSelectorSamplePage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState('a');

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            href="/sample/admin-history-detail"
            className="inline-flex items-center text-sm text-blue-600 hover:underline mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            다른 샘플 보기
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            생산 등록 제품 선택 UI 패턴 비교
          </h1>
          <p className="text-gray-600">
            제품이 많을 때 효율적으로 선택할 수 있는 4가지 UX 패턴을 비교합니다.
            각 탭을 클릭하여 실제 동작을 확인해보세요.
          </p>
        </div>

        {/* 옵션 개요 카드 */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-8">
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
                <div className="flex items-start justify-between gap-1">
                  <CardTitle className="text-sm">{option.title}</CardTitle>
                  <div className="flex gap-1">
                    {option.recommended && (
                      <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5">
                        <Star className="h-2.5 w-2.5 mr-0.5" />
                        권장
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription className="text-xs mt-1">
                  {option.description}
                </CardDescription>
                {option.mobileOptimized && (
                  <div className="flex items-center gap-1 mt-2">
                    <Smartphone className="h-3 w-3 text-blue-600" />
                    <span className="text-[10px] text-blue-600">모바일 최적화</span>
                  </div>
                )}
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
                <OptionA_SearchDropdown />
              </TabsContent>
              <TabsContent value="b" className="mt-0">
                <OptionB_TwoColumn />
              </TabsContent>
              <TabsContent value="c" className="mt-0">
                <OptionC_Accordion />
              </TabsContent>
              <TabsContent value="d" className="mt-0">
                <OptionD_TwoColumnSearch />
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
                    {option.mobileOptimized && (
                      <div className="flex items-center gap-1 mt-2">
                        <Smartphone className="h-4 w-4 text-blue-600" />
                        <span className="text-xs text-blue-600 font-medium">
                          모바일 최적화됨
                        </span>
                      </div>
                    )}
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
            <li>
              • <strong>제품군 6종</strong>: epiticon JAMBER, FILLUP, JAMBER AI, JAMBER
              Classic, LIPOLIF-T, Medistream Standard
            </li>
            <li>
              • <strong>총 34개 제품</strong>: 각 제품군별 4~7개의 모델
            </li>
            <li>
              • <strong>데이터 구조</strong>: 제품명(name), 모델명(model_name),
              UDI(udi_di)
            </li>
            <li>• 샘플 페이지이므로 실제 생산 등록은 동작하지 않습니다.</li>
          </ul>
        </div>

        {/* 구현 시 고려사항 */}
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <h2 className="font-semibold text-gray-900 mb-2">구현 시 수정 필요 파일</h2>
          <ul className="text-sm text-gray-700 space-y-1 font-mono">
            <li>• src/components/forms/LotForm.tsx - 제품 선택 UI 교체</li>
            <li>
              • src/components/shared/ProductSelector.tsx - 새 컴포넌트 (선택된 옵션
              기반)
            </li>
            <li>• src/components/ui/accordion.tsx - 옵션 C 선택 시 필요</li>
          </ul>
        </div>

        {/* 모바일 테스트 안내 */}
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <h2 className="font-semibold text-yellow-900 mb-2">모바일 테스트</h2>
          <p className="text-sm text-yellow-800">
            브라우저 개발자 도구에서 모바일 뷰포트로 전환하여 각 옵션의 모바일 대응을
            확인해보세요. 옵션 A와 C는 모바일에 최적화되어 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
