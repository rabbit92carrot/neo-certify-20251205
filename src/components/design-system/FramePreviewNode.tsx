'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { LayoutDashboard, FormInput, Table, Settings, List } from 'lucide-react';
import type { FrameNodeData } from './types';

/**
 * 페이지 타입별 아이콘
 */
function getPageTypeIcon(
  pageType: FrameNodeData['pageType'],
  className?: string
): React.ReactNode {
  const iconClass = className ?? 'h-4 w-4';
  switch (pageType) {
    case 'dashboard':
      return <LayoutDashboard className={iconClass} />;
    case 'form':
      return <FormInput className={iconClass} />;
    case 'table':
      return <Table className={iconClass} />;
    case 'settings':
      return <Settings className={iconClass} />;
    case 'list':
      return <List className={iconClass} />;
    default:
      return <LayoutDashboard className={iconClass} />;
  }
}

/**
 * 페이지 타입별 테두리 색상
 */
function getPageTypeBorderColor(pageType: FrameNodeData['pageType']): string {
  switch (pageType) {
    case 'dashboard':
      return 'border-blue-300';
    case 'form':
      return 'border-green-300';
    case 'table':
      return 'border-purple-300';
    case 'settings':
      return 'border-orange-300';
    case 'list':
      return 'border-gray-300';
    default:
      return 'border-gray-300';
  }
}

/**
 * 프레임 프리뷰 노드 컴포넌트
 * Figma 스타일로 실제 페이지를 축소하여 캔버스에 표시
 */
function FramePreviewNodeComponent({ data }: NodeProps): React.ReactElement {
  const nodeData = data as FrameNodeData;
  const { label, route, pageType, PreviewComponent, mockData } = nodeData;

  // View 컴포넌트가 있는지 확인
  const hasPreview = PreviewComponent && mockData;
  const borderColor = getPageTypeBorderColor(pageType);

  return (
    <div
      className={`
        frame-node rounded-lg overflow-hidden bg-white shadow-lg
        border-2 ${borderColor}
      `}
    >
      {/* 상단 타겟 핸들 */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-400 !w-3 !h-3"
      />

      {/* 상단 라벨 바 */}
      <div className="bg-gray-100 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
        <span className="text-gray-600">{getPageTypeIcon(pageType)}</span>
        <span className="font-medium text-sm text-gray-900">{label}</span>
        <span className="text-xs text-gray-500 ml-auto truncate max-w-[120px]">
          {route}
        </span>
      </div>

      {/* 프리뷰 컨테이너 (1200x800 표시 - 100% 스케일) */}
      <div
        className="frame-content relative bg-white"
        style={{ width: 1200, height: 800, overflow: 'hidden' }}
      >
        {hasPreview ? (
          // 실제 페이지 렌더링 (100% 스케일)
          <div
            style={{
              width: 1200,
              height: 800,
              pointerEvents: 'none', // 인터랙션 비활성화
              userSelect: 'none',
            }}
          >
            <PreviewComponent {...mockData} />
          </div>
        ) : (
          // 빈 프레임 (View 컴포넌트 미구현)
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-400">
              <div className="mx-auto mb-2">
                {getPageTypeIcon(pageType, 'h-8 w-8 mx-auto')}
              </div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs mt-1">Preview 준비 중</p>
            </div>
          </div>
        )}
      </div>

      {/* 하단 소스 핸들 */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-400 !w-3 !h-3"
      />
    </div>
  );
}

export const FramePreviewNode = memo(FramePreviewNodeComponent);
