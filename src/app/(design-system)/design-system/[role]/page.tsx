'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FrameMapCanvas } from '@/components/design-system/PageMapCanvas';
import { PageMapSidebar } from '@/components/design-system/PageMapSidebar';
import { DetailPanel } from '@/components/design-system/DetailPanel';
import {
  type FrameMapConfig,
  type RoleType,
  type FrameNodeData,
  type ComponentShowcaseData,
  type DetailPanelData,
  ROLE_LABELS,
} from '@/components/design-system/types';
import { getPreviewComponent } from '@/components/design-system/previews';
import { getPageMap } from '@/config/design-system/page-maps';
import { getMockData } from '@/config/design-system/mock-data';
import { getPageComponents } from '@/config/design-system/component-catalogs';

const VALID_ROLES: RoleType[] = ['manufacturer', 'distributor', 'hospital', 'admin'];

interface RolePageProps {
  params: Promise<{ role: string }>;
}

/**
 * 컴포넌트 쇼케이스 노드 크기 상수 (가로 레이아웃)
 */
const SHOWCASE_WIDTH = 800;
const SHOWCASE_GAP = 40;
const SHOWCASE_X = 1280;

/**
 * 프레임 노드 데이터에 PreviewComponent와 mockData 주입
 * component-card 노드를 component-showcase 노드로 변환 (카탈로그에 설정이 있는 경우)
 */
function injectPreviewData(pageMap: FrameMapConfig, role: RoleType): FrameMapConfig {
  // 프레임 노드 ID를 기준으로 행 인덱스 매핑 생성
  const frameRowMap = new Map<string, number>();
  let rowIndex = 0;
  pageMap.nodes.forEach((node) => {
    if (node.type === 'frame') {
      frameRowMap.set(node.id, rowIndex);
      rowIndex++;
    }
  });

  const newNodes: FrameMapConfig['nodes'] = [];

  pageMap.nodes.forEach((node) => {
    // frame 노드 처리
    if (node.type === 'frame') {
      const frameData = node.data as FrameNodeData;
      const pageId = frameData.route.split('/').pop() ?? '';
      const PreviewComponent = getPreviewComponent(role, frameData);
      const mockData = getMockData(role, pageId);

      // 해당 페이지의 컴포넌트 쇼케이스 설정 가져오기
      const showcaseConfigs = getPageComponents(role, pageId);

      // 프레임 노드 업데이트
      newNodes.push({
        ...node,
        data: {
          ...frameData,
          PreviewComponent: PreviewComponent ?? undefined,
          mockData: mockData ?? undefined,
        },
      });

      // 쇼케이스 노드 생성 (설정이 있는 경우) - 가로 정렬
      if (showcaseConfigs.length > 0) {
        const currentRow = frameRowMap.get(node.id) ?? 0;
        showcaseConfigs.forEach((showcase, idx) => {
          newNodes.push({
            id: `${node.id}-showcase-${idx}`,
            type: 'component-showcase',
            position: {
              x: SHOWCASE_X + idx * (SHOWCASE_WIDTH + SHOWCASE_GAP),
              y: currentRow * 1000,
            },
            data: {
              showcase,
              selectedVariantId: showcase.variants[0]?.id,
              showProps: false,
            } as ComponentShowcaseData,
          });
        });
      }
      return;
    }

    // component-card 노드는 이제 frame 처리 시 showcase로 생성되므로 스킵
    if (node.type === 'component-card') {
      return;
    }

    // 다른 노드 타입은 그대로 반환
    newNodes.push(node);
  });

  return {
    ...pageMap,
    nodes: newNodes,
  };
}

/**
 * 역할별 페이지 맵 페이지 (Figma 스타일)
 * 전체 캔버스에 실제 페이지 프리뷰를 프레임으로 표시
 */
export default function RolePageMapPage({ params }: RolePageProps): React.ReactElement {
  const [resolvedParams, setResolvedParams] = useState<{ role: string } | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [detailPanelData, setDetailPanelData] = useState<DetailPanelData | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);

  // params Promise 해결
  useEffect(() => {
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

  // 노드 클릭 핸들러 - 프레임 클릭 시 상세 패널 열기
  const handleNodeClick = useCallback(
    (nodeId: string, nodeType: string) => {
      if (nodeType === 'frame' && basePageMap) {
        const frameNode = basePageMap.nodes.find((n) => n.id === nodeId && n.type === 'frame');
        if (frameNode) {
          const frameData = frameNode.data as FrameNodeData;
          setDetailPanelData({
            pageId: nodeId,
            label: frameData.label,
            route: frameData.route,
            pageType: frameData.pageType,
            components: frameData.components,
          });
          setIsDetailPanelOpen(true);
        }
      }
    },
    [basePageMap]
  );

  // 상세 패널 닫기
  const handleCloseDetailPanel = useCallback(() => {
    setIsDetailPanelOpen(false);
  }, []);

  // 노드에 프리뷰 데이터 주입 (handleComponentClick에서 사용하기 위해 미리 계산)
  const pageMapWithPreviews = useMemo(() => {
    if (!role || !VALID_ROLES.includes(role) || !basePageMap) {
      return null;
    }
    return injectPreviewData(basePageMap, role);
  }, [basePageMap, role]);

  // 컴포넌트 ID로 해당 showcase 노드 ID 찾기
  const findShowcaseNodeId = useCallback(
    (componentId: string): string | null => {
      if (!pageMapWithPreviews) {
        return null;
      }

      const showcaseNode = pageMapWithPreviews.nodes.find(
        (node) =>
          node.type === 'component-showcase' &&
          (node.data as ComponentShowcaseData).showcase.id === componentId
      );

      return showcaseNode?.id ?? null;
    },
    [pageMapWithPreviews]
  );

  // 상세패널에서 컴포넌트 클릭 시 해당 showcase로 포커싱
  const handleComponentClick = useCallback(
    (componentId: string) => {
      const showcaseNodeId = findShowcaseNodeId(componentId);
      if (showcaseNodeId) {
        setSelectedPageId(showcaseNodeId);
        // NavigationHandler가 자동으로 fitView 실행
      }
    },
    [findShowcaseNodeId]
  );

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
          {pageMapWithPreviews && (
            <FrameMapCanvas
              config={pageMapWithPreviews}
              selectedNodeId={selectedPageId}
              onNodeClick={handleNodeClick}
            />
          )}
        </div>
      </div>

      {/* 상세 패널 */}
      <DetailPanel
        isOpen={isDetailPanelOpen}
        onClose={handleCloseDetailPanel}
        data={detailPanelData}
        onComponentClick={handleComponentClick}
      />
    </div>
  );
}
