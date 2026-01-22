'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Box } from 'lucide-react';
import type { ComponentCardData } from './types';

/**
 * 컴포넌트 카드 노드
 * 페이지에서 사용되는 컴포넌트를 작은 카드로 표시
 */
function ComponentCardComponent({ data }: NodeProps): React.ReactElement {
  const { componentName, storybookPath } = data as ComponentCardData;

  return (
    <div
      className="component-card bg-white border border-gray-200 rounded-md px-3 py-2
                 shadow-sm hover:shadow-md transition-shadow cursor-default"
      style={{ width: 160, height: 50 }}
    >
      <div className="flex items-center gap-2 h-full">
        <Box className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <span className="text-sm font-medium text-gray-700 truncate flex-1">
          {componentName}
        </span>
        {storybookPath && (
          <a
            href={`https://69688e87a244b9e8bdf234dc-wnerlmjfwy.chromatic.com/?path=/story/${storybookPath}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            →
          </a>
        )}
      </div>
    </div>
  );
}

export const ComponentCard = memo(ComponentCardComponent);
