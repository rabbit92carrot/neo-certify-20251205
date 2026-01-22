'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Maximize2, Minimize2 } from 'lucide-react';
import type { PageNodeData } from './types';

const CHROMATIC_BASE_URL = 'https://69688e87a244b9e8bdf234dc-wnerlmjfwy.chromatic.com/';

interface PreviewPanelProps {
  selectedNode: PageNodeData | null;
  PreviewComponent: React.ComponentType<unknown> | null;
  mockData: Record<string, unknown> | null;
}

/**
 * 프리뷰 패널 컴포넌트
 * 선택된 페이지의 실제 컴포넌트를 mock 데이터와 함께 렌더링
 */
export function PreviewPanel({
  selectedNode,
  PreviewComponent,
  mockData,
}: PreviewPanelProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 컨테이너 크기에 맞게 스케일 계산
  useEffect(() => {
    if (!containerRef.current || !PreviewComponent) {return;}

    const updateScale = (): void => {
      const container = containerRef.current;
      if (!container) {return;}

      const containerWidth = container.clientWidth - 32; // padding 고려
      const originalWidth = 1200; // 원본 너비 (일반적인 데스크톱 뷰)

      const newScale = Math.min(1, containerWidth / originalWidth);
      setScale(newScale);
    };

    updateScale();
    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [PreviewComponent]);

  if (!selectedNode) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 border-l">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium mb-2">페이지를 선택하세요</p>
          <p className="text-sm">캔버스에서 노드를 클릭하면 프리뷰가 표시됩니다</p>
        </div>
      </div>
    );
  }

  const storybookUrl = selectedNode.storybookPath
    ? `${CHROMATIC_BASE_URL}?path=/story/${selectedNode.storybookPath}`
    : null;

  return (
    <div className={`h-full flex flex-col bg-white border-l ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* 헤더 */}
      <div className="flex-shrink-0 p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">{selectedNode.label}</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-3">{selectedNode.route}</p>

        {/* 사용 컴포넌트 */}
        <div className="flex flex-wrap gap-1 mb-3">
          {selectedNode.components.map((comp) => (
            <Badge key={comp} variant="secondary" className="text-xs">
              {comp}
            </Badge>
          ))}
        </div>

        {/* Storybook 링크 */}
        {storybookUrl && (
          <Link href={storybookUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="w-full">
              <ExternalLink className="h-3 w-3 mr-2" />
              Storybook에서 보기
            </Button>
          </Link>
        )}
      </div>

      {/* 프리뷰 영역 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 bg-gray-100"
      >
        {PreviewComponent && mockData ? (
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: `${100 / scale}%`,
            }}
          >
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <PreviewComponent {...mockData} />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <p>이 페이지의 프리뷰가 아직 준비되지 않았습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
