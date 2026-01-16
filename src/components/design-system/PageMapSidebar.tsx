'use client';

import { LayoutDashboard, FormInput, Table, Settings, List } from 'lucide-react';
import { cn } from '@/lib/utils/ui';
import type { FrameNodeData } from './types';

interface PageInfo {
  id: string;
  label: string;
  pageType: FrameNodeData['pageType'];
}

interface PageMapSidebarProps {
  pages: PageInfo[];
  selectedPageId: string | null;
  onPageSelect: (pageId: string) => void;
}

/**
 * 페이지 타입별 아이콘
 */
function getPageTypeIcon(pageType: FrameNodeData['pageType']): React.ReactNode {
  const iconClass = 'h-4 w-4';
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
 * 페이지 맵 사이드바 네비게이션
 * 페이지 목록을 표시하고 클릭 시 해당 페이지로 캔버스를 이동
 */
export function PageMapSidebar({
  pages,
  selectedPageId,
  onPageSelect,
}: PageMapSidebarProps): React.ReactElement {
  return (
    <div className="w-60 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-sm text-gray-700">페이지 목록</h3>
        <p className="text-xs text-gray-500 mt-1">{pages.length}개 페이지</p>
      </div>

      {/* 페이지 리스트 */}
      <nav className="flex-1 overflow-y-auto p-2">
        {pages.map((page) => {
          const isSelected = selectedPageId === page.id;

          return (
            <button
              key={page.id}
              onClick={() => onPageSelect(page.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                'hover:bg-gray-100',
                isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              )}
            >
              <span className={isSelected ? 'text-blue-600' : 'text-gray-400'}>
                {getPageTypeIcon(page.pageType)}
              </span>
              <span className="truncate">{page.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 푸터 - 조작 가이드 */}
      <div className="p-3 border-t border-gray-200 text-xs text-gray-500">
        <div className="space-y-1">
          <p>• 페이지 클릭: 해당 위치로 이동</p>
          <p>• 마우스 휠: 줌</p>
          <p>• 드래그: 캔버스 이동</p>
        </div>
      </div>
    </div>
  );
}
