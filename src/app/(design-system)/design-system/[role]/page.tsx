'use client';

import { useState, useMemo, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FrameMapCanvas } from '@/components/design-system/PageMapCanvas';
import { PageMapSidebar } from '@/components/design-system/PageMapSidebar';
import {
  type FrameMapConfig,
  type RoleType,
  type FrameNodeData,
  ROLE_LABELS,
} from '@/components/design-system/types';
import { getPreviewComponent } from '@/components/design-system/previews';
import { getPageMap } from '@/config/design-system/page-maps';
import { getMockData } from '@/config/design-system/mock-data';

const VALID_ROLES: RoleType[] = ['manufacturer', 'distributor', 'hospital', 'admin'];

interface RolePageProps {
  params: Promise<{ role: string }>;
}

/**
 * 프레임 노드 데이터에 PreviewComponent와 mockData 주입
 * component-card 노드는 그대로 유지
 */
function injectPreviewData(pageMap: FrameMapConfig, role: RoleType): FrameMapConfig {
  return {
    ...pageMap,
    nodes: pageMap.nodes.map((node) => {
      // component-card 노드는 그대로 반환
      if (node.type === 'component-card') {
        return node;
      }

      // frame 노드에만 프리뷰 데이터 주입
      const frameData = node.data as FrameNodeData;
      const pageId = frameData.route.split('/').pop() ?? '';
      const PreviewComponent = getPreviewComponent(role, frameData);
      const mockData = getMockData(role, pageId);

      return {
        ...node,
        data: {
          ...frameData,
          PreviewComponent: PreviewComponent ?? undefined,
          mockData: mockData ?? undefined,
        },
      };
    }),
  };
}

/**
 * 역할별 페이지 맵 페이지 (Figma 스타일)
 * 전체 캔버스에 실제 페이지 프리뷰를 프레임으로 표시
 */
export default function RolePageMapPage({ params }: RolePageProps): React.ReactElement {
  const [resolvedParams, setResolvedParams] = useState<{ role: string } | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  // params Promise 해결
  useMemo(() => {
    params.then(setResolvedParams);
  }, [params]);

  const role = resolvedParams?.role as RoleType | undefined;

  // 페이지 맵 가져오기 (role이 유효할 때만)
  const basePageMap = role && VALID_ROLES.includes(role) ? getPageMap(role) : null;

  // 초기 선택: 첫 번째 프레임 노드
  useEffect(() => {
    if (!selectedPageId && basePageMap && basePageMap.nodes.length > 0) {
      const firstFrame = basePageMap.nodes.find((n) => n.type === 'frame');
      if (firstFrame) {
        setSelectedPageId(firstFrame.id);
      }
    }
  }, [basePageMap, selectedPageId]);

  // 사이드바용 페이지 목록 추출
  const pageList = useMemo(() => {
    if (!basePageMap) {
      return [];
    }
    return basePageMap.nodes
      .filter((node) => node.type === 'frame')
      .map((node) => ({
        id: node.id,
        label: (node.data as FrameNodeData).label,
        pageType: (node.data as FrameNodeData).pageType,
      }));
  }, [basePageMap]);

  // 로딩 상태
  if (!role) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  // 유효하지 않은 역할
  if (!VALID_ROLES.includes(role) || !basePageMap) {
    notFound();
  }

  const roleLabel = ROLE_LABELS[role];

  // 노드에 프리뷰 데이터 주입
  const pageMapWithPreviews = injectPreviewData(basePageMap, role);

  // 프레임 노드만 카운트 (component-card 제외)
  const pageCount = basePageMap.nodes.filter((node) => node.type === 'frame').length;

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
        <span className="text-sm text-gray-500">({pageCount}개 페이지)</span>
      </div>

      {/* 메인 콘텐츠: 사이드바 + 캔버스 */}
      <div className="flex-1 min-h-0 flex">
        {/* 사이드바 */}
        <PageMapSidebar
          pages={pageList}
          selectedPageId={selectedPageId}
          onPageSelect={setSelectedPageId}
        />

        {/* 캔버스 */}
        <div className="flex-1 min-h-0">
          <FrameMapCanvas
            config={pageMapWithPreviews}
            selectedNodeId={selectedPageId}
          />
        </div>
      </div>
    </div>
  );
}
