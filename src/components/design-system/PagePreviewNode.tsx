'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { LayoutDashboard, FormInput, Table, Settings, List } from 'lucide-react';
import type { PageNodeData } from './types';

/**
 * 페이지 타입별 아이콘
 */
function getPageTypeIcon(pageType: PageNodeData['pageType']): React.ReactNode {
  switch (pageType) {
    case 'dashboard':
      return <LayoutDashboard className="h-4 w-4" />;
    case 'form':
      return <FormInput className="h-4 w-4" />;
    case 'table':
      return <Table className="h-4 w-4" />;
    case 'settings':
      return <Settings className="h-4 w-4" />;
    case 'list':
      return <List className="h-4 w-4" />;
    default:
      return <LayoutDashboard className="h-4 w-4" />;
  }
}

/**
 * 페이지 타입별 색상
 */
function getPageTypeColor(pageType: PageNodeData['pageType']): { bg: string; border: string; text: string } {
  switch (pageType) {
    case 'dashboard':
      return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' };
    case 'form':
      return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' };
    case 'table':
      return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' };
    case 'settings':
      return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' };
    case 'list':
      return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' };
    default:
      return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' };
  }
}

/**
 * 페이지 프리뷰 노드 컴포넌트
 * React Flow 캔버스에서 각 페이지를 카드 형태로 표시
 */
function PagePreviewNodeComponent({ data, selected }: NodeProps): React.ReactElement {
  const nodeData = data as PageNodeData;
  const colors = getPageTypeColor(nodeData.pageType);

  return (
    <div
      className={`
        min-w-[160px] px-4 py-3 rounded-lg border-2 shadow-sm
        ${colors.bg} ${colors.border}
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        transition-all duration-200 hover:shadow-md cursor-pointer
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-400 !w-2 !h-2"
      />

      <div className="flex items-center gap-2 mb-1">
        <span className={colors.text}>{getPageTypeIcon(nodeData.pageType)}</span>
        <span className="font-medium text-sm text-gray-900">{nodeData.label}</span>
      </div>

      <div className="text-xs text-gray-500 truncate max-w-[140px]">
        {nodeData.route}
      </div>

      {nodeData.components.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {nodeData.components.slice(0, 3).map((comp: string) => (
            <span
              key={comp}
              className="text-xs px-1.5 py-0.5 bg-white rounded border border-gray-200 text-gray-600"
            >
              {comp}
            </span>
          ))}
          {nodeData.components.length > 3 && (
            <span className="text-xs text-gray-400">+{nodeData.components.length - 3}</span>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-400 !w-2 !h-2"
      />
    </div>
  );
}

export const PagePreviewNode = memo(PagePreviewNodeComponent);
