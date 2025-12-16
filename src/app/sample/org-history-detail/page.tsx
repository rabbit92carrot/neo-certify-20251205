'use client';

/**
 * 조직별 거래이력 상세보기 샘플 페이지
 *
 * 테스트 시나리오:
 * 1. 소량 코드 (10개): 전체 표시
 * 2. 중간 코드 (50개): 20개씩 표시 + "더 보기"
 * 3. 대량 코드 (200개): 스크롤 + 페이지네이션
 * 4. 회수 거래: 회수 사유 표시
 * 5. 시술: 환자에게 시술
 * 6. 초대량 코드 (500개): 성능 테스트
 */

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MockTransactionCard } from './_components/MockTransactionCard';
import { mockTransactions } from './_data/mock-data';

// 현재 조직 ID 옵션 (테스트용)
const ORG_OPTIONS = [
  { id: 'org-001', name: '(주)네오메디컬', type: '제조사' },
  { id: 'org-002', name: '서울의료기기유통', type: '유통사' },
  { id: 'org-003', name: '강남뷰티클리닉', type: '병원' },
  { id: 'org-004', name: '부산의료유통센터', type: '유통사' },
];

export default function OrgHistoryDetailSamplePage(): React.ReactElement {
  const [currentOrgId, setCurrentOrgId] = useState('org-001');

  const currentOrg = ORG_OPTIONS.find((org) => org.id === currentOrgId);

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      {/* 헤더 */}
      <div className="mb-6">
        <Link href="/sample" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          샘플 목록으로
        </Link>
        <h1 className="text-2xl font-bold">거래이력 상세보기 샘플</h1>
        <p className="text-muted-foreground mt-1">
          제품을 클릭하여 고유식별코드를 확인할 수 있습니다.
        </p>
      </div>

      {/* 설정 패널 */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            테스트 설정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">
                현재 조직 (시점 변경)
              </label>
              <Select value={currentOrgId} onValueChange={setCurrentOrgId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORG_OPTIONS.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name} ({org.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Badge variant="outline" className="h-9 px-3">
                {currentOrg?.name}
              </Badge>
            </div>
          </div>

          {/* 테스트 시나리오 안내 */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
            <p className="font-medium text-blue-900 mb-2">테스트 시나리오:</p>
            <ul className="space-y-1 text-blue-800">
              <li>• <strong>생산 (10개)</strong>: 소량 코드 - 전체 표시</li>
              <li>• <strong>출고 (50개)</strong>: 중간 코드 - "더 보기" 기능</li>
              <li>• <strong>입고 (200개)</strong>: 대량 코드 - 스크롤 + 페이지네이션</li>
              <li>• <strong>회수 (5개)</strong>: 회수 사유 표시</li>
              <li>• <strong>시술 (3개)</strong>: 환자에게 시술</li>
              <li>• <strong>출고 (500개)</strong>: 초대량 코드 - 성능 테스트</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 거래이력 목록 */}
      <div className="space-y-4">
        {mockTransactions.map((transaction) => (
          <MockTransactionCard
            key={transaction.id}
            transaction={transaction}
            currentOrgId={currentOrgId}
          />
        ))}
      </div>

      {/* 푸터 정보 */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg text-sm text-muted-foreground">
        <p className="font-medium mb-2">구현 노트:</p>
        <ul className="space-y-1">
          <li>• 코드 클릭 시 클립보드에 복사</li>
          <li>• "전체 복사" 버튼으로 모든 코드 복사</li>
          <li>• 반응형 그리드: 모바일 2열 / 태블릿 3열 / 데스크톱 4열</li>
          <li>• 대량 코드 시 스크롤 영역 (max-height: 300px)</li>
          <li>• "더 보기" 클릭 시 20개씩 추가 로드</li>
        </ul>
      </div>
    </div>
  );
}
