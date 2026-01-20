'use client';

import { memo } from 'react';
import type { ComponentVariant } from '../types';

interface VariantTabsProps {
  variants: ComponentVariant[];
  selectedVariantId: string;
  onSelect: (id: string) => void;
}

/**
 * Variant 선택 탭
 * 컴포넌트의 다양한 상태를 전환할 수 있는 탭 UI
 */
function VariantTabsComponent({
  variants,
  selectedVariantId,
  onSelect,
}: VariantTabsProps): React.ReactElement {
  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100 overflow-x-auto">
      {variants.map((variant) => {
        const isSelected = variant.id === selectedVariantId;
        return (
          <button
            key={variant.id}
            type="button"
            className={`
              px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap
              ${
                isSelected
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }
            `}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(variant.id);
            }}
            title={variant.description}
          >
            {variant.name}
          </button>
        );
      })}
    </div>
  );
}

export const VariantTabs = memo(VariantTabsComponent);
