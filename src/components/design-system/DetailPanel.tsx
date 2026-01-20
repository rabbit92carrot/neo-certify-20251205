'use client';

import { memo } from 'react';
import { X, ExternalLink, Layers, Route, Box, Focus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { DetailPanelData } from './types';

interface DetailPanelProps {
  /** 패널 열림 상태 */
  isOpen: boolean;
  /** 닫기 핸들러 */
  onClose: () => void;
  /** 표시할 데이터 */
  data: DetailPanelData | null;
  /** 컴포넌트 클릭 핸들러 (해당 showcase로 이동) */
  onComponentClick?: (componentId: string) => void;
}

/**
 * 페이지 타입별 배지 스타일
 */
const PAGE_TYPE_STYLES: Record<string, { label: string; className: string }> = {
  dashboard: { label: '대시보드', className: 'bg-blue-100 text-blue-700' },
  form: { label: '폼', className: 'bg-purple-100 text-purple-700' },
  table: { label: '테이블', className: 'bg-orange-100 text-orange-700' },
  settings: { label: '설정', className: 'bg-gray-100 text-gray-700' },
  list: { label: '목록', className: 'bg-green-100 text-green-700' },
};

/**
 * 상세 패널 컴포넌트
 * 프레임 클릭 시 우측에서 펼쳐지는 패널
 * 페이지 정보, 사용 컴포넌트 목록, 상태 정보 표시
 */
function DetailPanelComponent({
  isOpen,
  onClose,
  data,
  onComponentClick,
}: DetailPanelProps): React.ReactElement | null {
  if (!isOpen || !data) {
    return null;
  }

  const pageTypeStyle = PAGE_TYPE_STYLES[data.pageType] ?? { label: '기타', className: 'bg-gray-100 text-gray-700' };

  return (
    <div className="fixed right-0 top-0 h-full w-[360px] bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-gray-500" />
            <span className="font-semibold text-gray-900">{data.label}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Page Info */}
          <section>
            <h3 className="text-sm font-medium text-gray-500 mb-3">페이지 정보</h3>
            <div className="space-y-3">
              {/* Page Type */}
              <div className="flex items-center gap-2">
                <Box className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">타입:</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${pageTypeStyle.className}`}>
                  {pageTypeStyle.label}
                </span>
              </div>

              {/* Route */}
              <div className="flex items-start gap-2">
                <Route className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <span className="text-sm text-gray-600">라우트:</span>
                  <code className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">
                    {data.route}
                  </code>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Components */}
          <section>
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              사용 컴포넌트 ({data.components.length})
            </h3>
            <div className="space-y-2">
              {data.components.length > 0 ? (
                data.components.map((component) => {
                  const componentId = component.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '');
                  return (
                    <div
                      key={component}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
                    >
                      {/* 컴포넌트 이름 + Showcase 포커싱 버튼 */}
                      <button
                        type="button"
                        className="flex-1 flex items-center justify-between hover:bg-gray-100 rounded px-2 py-1 -mx-2 -my-1 transition-colors text-left"
                        onClick={() => onComponentClick?.(componentId)}
                        title="Showcase로 이동"
                      >
                        <span className="text-sm font-medium text-gray-700">{component}</span>
                        <Focus className="h-3.5 w-3.5 text-blue-500" />
                      </button>

                      {/* Storybook 링크 버튼 (별도) */}
                      <a
                        href={`https://69688e87a244b9e8bdf234dc-wnerlmjfwy.chromatic.com/?path=/docs/components-${componentId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                        title="Storybook에서 보기"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-gray-400 hover:text-blue-500" />
                      </a>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">
                  등록된 컴포넌트가 없습니다
                </p>
              )}
            </div>
          </section>

          {/* States (if any) */}
          {data.states && data.states.length > 0 && (
            <>
              <Separator />
              <section>
                <h3 className="text-sm font-medium text-gray-500 mb-3">
                  페이지 상태 ({data.states.length})
                </h3>
                <div className="space-y-2">
                  {data.states.map((state) => (
                    <div
                      key={state.id}
                      className="px-3 py-2 bg-blue-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {state.name}
                        </Badge>
                      </div>
                      {state.description && (
                        <p className="text-xs text-gray-600 mt-1">{state.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 bg-gray-50">
        <Button variant="outline" size="sm" className="w-full" onClick={onClose}>
          닫기
        </Button>
      </div>
    </div>
  );
}

export const DetailPanel = memo(DetailPanelComponent);
