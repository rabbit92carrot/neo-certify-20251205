'use client';

/**
 * 검색 및 필터 섹션
 * 제품 검색창과 별칭/상태 필터 UI
 */

import React, { memo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { SearchAndFilterSectionProps, AliasFilter, ActiveFilter } from './types';

function SearchAndFilterSectionComponent({
  searchTerm,
  onSearchChange,
  aliasFilter,
  onAliasFilterChange,
  activeFilter,
  onActiveFilterChange,
  productCount,
}: SearchAndFilterSectionProps): React.ReactElement {
  return (
    <div className="space-y-4">
      {/* 검색창 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="제품명, 모델명, 별칭으로 검색..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap items-center gap-4">
        {/* 별칭 필터 */}
        <Tabs
          value={aliasFilter}
          onValueChange={(v) => onAliasFilterChange(v as AliasFilter)}
        >
          <TabsList>
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="with_alias">별칭 있음</TabsTrigger>
            <TabsTrigger value="without_alias">별칭 없음</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 상태 필터 */}
        <Tabs
          value={activeFilter}
          onValueChange={(v) => onActiveFilterChange(v as ActiveFilter)}
        >
          <TabsList>
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="active">활성</TabsTrigger>
            <TabsTrigger value="inactive">비활성</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 제품 수 표시 */}
        <span className="text-sm text-muted-foreground ml-auto">
          {productCount}개 제품
        </span>
      </div>
    </div>
  );
}

export const SearchAndFilterSection = memo(SearchAndFilterSectionComponent);
