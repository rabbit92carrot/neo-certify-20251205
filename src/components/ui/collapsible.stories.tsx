'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './collapsible';
import { Button } from './button';
import { ChevronsUpDown } from 'lucide-react';

const meta = {
  title: 'UI/Data Display/Collapsible',
  component: Collapsible,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[350px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
        <div className="flex items-center justify-between space-x-4 px-4">
          <h4 className="text-sm font-semibold">제품 상세</h4>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 p-0">
              <ChevronsUpDown className="h-4 w-4" />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <div className="rounded-md border px-4 py-3 font-mono text-sm">
          기본 정보
        </div>
        <CollapsibleContent className="space-y-2">
          <div className="rounded-md border px-4 py-3 font-mono text-sm">
            상세 정보 1
          </div>
          <div className="rounded-md border px-4 py-3 font-mono text-sm">
            상세 정보 2
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  },
};

export const DefaultOpen: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
        <div className="flex items-center justify-between space-x-4 px-4">
          <h4 className="text-sm font-semibold">기본으로 열림</h4>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 p-0">
              <ChevronsUpDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
        </div>
        <div className="rounded-md border px-4 py-3 text-sm">
          항상 보이는 내용
        </div>
        <CollapsibleContent className="space-y-2">
          <div className="rounded-md border px-4 py-3 text-sm">
            접힌 내용 1
          </div>
          <div className="rounded-md border px-4 py-3 text-sm">
            접힌 내용 2
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  },
};

export const InventoryDetail: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg">
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="font-medium">PDO Thread Type A</p>
            <p className="text-sm text-muted-foreground">총 150개</p>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              <ChevronsUpDown className="h-4 w-4" />
              <span className="ml-2">{isOpen ? '접기' : '펼치기'}</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="border-t px-4 py-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span>LOT-2024-001</span>
              <span>100개</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>LOT-2024-002</span>
              <span>50개</span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  },
};

export const FilterSection: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            고급 필터
            <ChevronsUpDown className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-4 p-4 border rounded-lg">
          <div className="space-y-2">
            <label className="text-sm font-medium">날짜 범위</label>
            <div className="flex gap-2">
              <input type="date" className="flex-1 border rounded px-2 py-1 text-sm" />
              <span className="text-muted-foreground">~</span>
              <input type="date" className="flex-1 border rounded px-2 py-1 text-sm" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">이벤트 유형</label>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">생산</Button>
              <Button variant="outline" size="sm">출고</Button>
              <Button variant="outline" size="sm">시술</Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  },
};
