'use client';

import { useState, useCallback, useMemo } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageMapCanvas } from '@/components/design-system/PageMapCanvas';
import { PreviewPanel } from '@/components/design-system/PreviewPanel';
import { type PageNodeData, type RoleType, ROLE_LABELS } from '@/components/design-system/types';
import { getPreviewComponent } from '@/components/design-system/previews';
import { getPageMap } from '@/config/design-system/page-maps';
import { getMockData } from '@/config/design-system/mock-data';

const VALID_ROLES: RoleType[] = ['manufacturer', 'distributor', 'hospital', 'admin'];

interface RolePageProps {
  params: Promise<{ role: string }>;
}

/**
 * 역할별 페이지 맵 페이지
 * React Flow 캔버스와 프리뷰 패널을 표시
 */
export default function RolePageMapPage({ params }: RolePageProps): React.ReactElement {
  const [resolvedParams, setResolvedParams] = useState<{ role: string } | null>(null);
  const [selectedNode, setSelectedNode] = useState<PageNodeData | null>(null);

  // params Promise 해결
  useMemo(() => {
    params.then(setResolvedParams);
  }, [params]);

  const role = resolvedParams?.role as RoleType | undefined;

  const handleNodeSelect = useCallback((node: PageNodeData | null) => {
    setSelectedNode(node);
  }, []);

  // 로딩 상태
  if (!role) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  // 유효하지 않은 역할
  if (!VALID_ROLES.includes(role)) {
    notFound();
  }

  const pageMap = getPageMap(role);
  const roleLabel = ROLE_LABELS[role];

  // 선택된 노드의 프리뷰 컴포넌트와 mock 데이터
  const PreviewComponent = selectedNode ? getPreviewComponent(role, selectedNode) : null;
  const mockData = selectedNode ? getMockData(role, selectedNode.route.split('/').pop() ?? '') : null;

  return (
    <div className="h-full flex flex-col">
      {/* 서브 헤더 */}
      <div className="flex-shrink-0 px-4 py-3 bg-white border-b flex items-center gap-4">
        <Link href="/design-system">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            돌아가기
          </Button>
        </Link>
        <div className="h-4 w-px bg-gray-300" />
        <h2 className="font-semibold text-gray-900">{roleLabel} 페이지 맵</h2>
        <span className="text-sm text-gray-500">
          ({pageMap.nodes.length}개 페이지)
        </span>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex min-h-0">
        {/* 캔버스 (70%) */}
        <div className="flex-[7] min-w-0">
          <PageMapCanvas config={pageMap} onNodeSelect={handleNodeSelect} />
        </div>

        {/* 프리뷰 패널 (30%) */}
        <div className="flex-[3] min-w-[300px] max-w-[500px]">
          <PreviewPanel
            selectedNode={selectedNode}
            PreviewComponent={PreviewComponent}
            mockData={mockData}
          />
        </div>
      </div>
    </div>
  );
}
