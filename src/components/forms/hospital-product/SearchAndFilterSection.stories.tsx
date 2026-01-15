'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * SearchAndFilterSection은 제품 검색창과 별칭/상태 필터 UI를 제공합니다.
 */

type AliasFilter = 'all' | 'with_alias' | 'without_alias';
type ActiveFilter = 'all' | 'active' | 'inactive';

interface MockSearchAndFilterSectionProps {
  initialSearchTerm?: string;
  initialAliasFilter?: AliasFilter;
  initialActiveFilter?: ActiveFilter;
  productCount?: number;
}

function MockSearchAndFilterSection({
  initialSearchTerm = '',
  initialAliasFilter = 'all',
  initialActiveFilter = 'all',
  productCount = 15,
}: MockSearchAndFilterSectionProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [aliasFilter, setAliasFilter] = useState<AliasFilter>(initialAliasFilter);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>(initialActiveFilter);

  return (
    <div className="space-y-4">
      {/* 검색창 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="제품명, 모델명, 별칭으로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap items-center gap-4">
        {/* 별칭 필터 */}
        <Tabs
          value={aliasFilter}
          onValueChange={(v) => setAliasFilter(v as AliasFilter)}
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
          onValueChange={(v) => setActiveFilter(v as ActiveFilter)}
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

const meta = {
  title: 'Forms/HospitalProduct/SearchAndFilterSection',
  component: MockSearchAndFilterSection,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MockSearchAndFilterSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    productCount: 15,
  },
};

export const WithSearchTerm: Story = {
  args: {
    initialSearchTerm: 'PDO Thread',
    productCount: 5,
  },
};

export const WithAliasFilter: Story = {
  args: {
    initialAliasFilter: 'with_alias',
    productCount: 8,
  },
};

export const WithActiveFilter: Story = {
  args: {
    initialActiveFilter: 'inactive',
    productCount: 3,
  },
};

export const AllFiltersApplied: Story = {
  args: {
    initialSearchTerm: 'Type A',
    initialAliasFilter: 'with_alias',
    initialActiveFilter: 'active',
    productCount: 2,
  },
};

export const NoProducts: Story = {
  args: {
    initialSearchTerm: '존재하지 않는 제품',
    productCount: 0,
  },
};
