'use client';

import { memo, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface PreviewContainerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: React.ComponentType<any>;
  props: Record<string, unknown>;
  variantDescription?: string;
}

/**
 * 컴포넌트 미리보기 컨테이너
 * 실제 컴포넌트를 렌더링하는 격리된 영역
 */
function PreviewContainerComponent({
  Component,
  props,
  variantDescription,
}: PreviewContainerProps): React.ReactElement {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Variant Description (if any) */}
      {variantDescription && (
        <div className="px-4 py-1.5 text-xs text-gray-500 bg-gray-50 border-b border-gray-100">
          {variantDescription}
        </div>
      )}

      {/* Preview Area */}
      <div className="flex-1 p-6 overflow-auto bg-white min-h-[300px]">
        <div
          className="h-full flex items-center justify-center"
          style={{ pointerEvents: 'none' }}
        >
          <Suspense
            fallback={
              <div className="flex items-center justify-center text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            }
          >
            <div className="max-w-full">
              <Component {...props} />
            </div>
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export const PreviewContainer = memo(PreviewContainerComponent);
