'use client';

import { memo, useState, useMemo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import type { ComponentShowcaseData } from './types';
import { VariantTabs } from './showcase/VariantTabs';
import { PreviewContainer } from './showcase/PreviewContainer';
import { PropsTable } from './showcase/PropsTable';

/**
 * 쇼케이스 노드 크기 상수 (가로 레이아웃용)
 */
const SHOWCASE_WIDTH = 800;
const SHOWCASE_HEIGHT = 600;

/**
 * 카테고리별 배지 색상
 */
const CATEGORY_COLORS: Record<string, string> = {
  ui: 'bg-blue-100 text-blue-700',
  shared: 'bg-green-100 text-green-700',
  forms: 'bg-purple-100 text-purple-700',
  tables: 'bg-orange-100 text-orange-700',
  layout: 'bg-gray-100 text-gray-700',
};

/**
 * 컴포넌트 쇼케이스 노드
 * Storybook 스타일로 컴포넌트의 variants와 props를 표시
 */
function ComponentShowcaseNodeComponent({
  data,
}: NodeProps): React.ReactElement {
  const { showcase } = data as ComponentShowcaseData;
  const { name, category, description, storybookPath, Component, variants, props } = showcase;

  // 선택된 variant 상태
  const [selectedVariantId, setSelectedVariantId] = useState(
    variants[0]?.id ?? 'default'
  );

  // Props 테이블 펼침 상태
  const [showProps, setShowProps] = useState(false);

  // 현재 선택된 variant
  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === selectedVariantId) ?? variants[0],
    [variants, selectedVariantId]
  );

  // Storybook URL
  const storybookUrl = storybookPath
    ? `https://69688e87a244b9e8bdf234dc-wnerlmjfwy.chromatic.com/?path=/story/${storybookPath}`
    : null;

  return (
    <div
      className="component-showcase bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden flex flex-col"
      style={{ width: SHOWCASE_WIDTH, height: SHOWCASE_HEIGHT }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">{name}</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[category] ?? CATEGORY_COLORS.ui}`}
          >
            {category}
          </span>
        </div>
        {storybookUrl && (
          <a
            href={storybookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-blue-500 transition-colors"
            onClick={(e) => e.stopPropagation()}
            title="Storybook에서 보기"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      {/* Description */}
      <div className="px-4 py-2 text-sm text-gray-600 border-b border-gray-100">
        {description}
      </div>

      {/* Variant Tabs */}
      <VariantTabs
        variants={variants}
        selectedVariantId={selectedVariantId}
        onSelect={setSelectedVariantId}
      />

      {/* Preview Container */}
      <PreviewContainer
        Component={Component}
        props={selectedVariant?.props ?? {}}
        variantDescription={selectedVariant?.description}
      />

      {/* Props Table Toggle */}
      <button
        type="button"
        className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-100 hover:bg-gray-100 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setShowProps(!showProps);
        }}
      >
        <span className="text-sm font-medium text-gray-700">
          Props ({props.length})
        </span>
        {showProps ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {/* Props Table */}
      {showProps && <PropsTable props={props} />}
    </div>
  );
}

export const ComponentShowcaseNode = memo(ComponentShowcaseNodeComponent);
