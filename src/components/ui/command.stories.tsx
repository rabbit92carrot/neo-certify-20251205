'use client';

import type { Meta, StoryObj } from '@storybook/react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './command';
import { Button } from './button';
import { useState } from 'react';
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  User,
  Search,
} from 'lucide-react';

const meta = {
  title: 'UI/Selection/Command',
  component: Command,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md w-[350px]">
      <CommandInput placeholder="검색..." />
      <CommandList>
        <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
        <CommandGroup heading="제안">
          <CommandItem>
            <Calendar className="mr-2 h-4 w-4" />
            <span>캘린더</span>
          </CommandItem>
          <CommandItem>
            <Calculator className="mr-2 h-4 w-4" />
            <span>계산기</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="설정">
          <CommandItem>
            <User className="mr-2 h-4 w-4" />
            <span>프로필</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>설정</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const Dialog: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>
          <Search className="mr-2 h-4 w-4" />
          명령 팔레트 열기
        </Button>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="명령 검색..." />
          <CommandList>
            <CommandEmpty>결과 없음</CommandEmpty>
            <CommandGroup heading="빠른 이동">
              <CommandItem>
                <span>대시보드로 이동</span>
                <CommandShortcut>⌘D</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <span>제품 목록</span>
                <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <span>재고 현황</span>
                <CommandShortcut>⌘I</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="액션">
              <CommandItem>
                <span>새 제품 등록</span>
              </CommandItem>
              <CommandItem>
                <span>출고 등록</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </>
    );
  },
};

export const ProductSearch: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md w-[400px]">
      <CommandInput placeholder="제품 검색..." />
      <CommandList>
        <CommandEmpty>해당 제품을 찾을 수 없습니다.</CommandEmpty>
        <CommandGroup heading="제품">
          <CommandItem>
            <div className="flex flex-col">
              <span className="font-medium">PDO Thread Type A</span>
              <span className="text-xs text-muted-foreground">
                PDO-A-100 | 재고: 150개
              </span>
            </div>
          </CommandItem>
          <CommandItem>
            <div className="flex flex-col">
              <span className="font-medium">PDO Thread Type B</span>
              <span className="text-xs text-muted-foreground">
                PDO-B-200 | 재고: 80개
              </span>
            </div>
          </CommandItem>
          <CommandItem>
            <div className="flex flex-col">
              <span className="font-medium">PDO Thread Premium</span>
              <span className="text-xs text-muted-foreground">
                PDO-P-500 | 재고: 45개
              </span>
            </div>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const OrganizationSearch: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md w-[350px]">
      <CommandInput placeholder="조직 검색..." />
      <CommandList>
        <CommandEmpty>해당 조직을 찾을 수 없습니다.</CommandEmpty>
        <CommandGroup heading="유통사">
          <CommandItem>
            <div className="flex items-center justify-between w-full">
              <span>메디컬 유통</span>
              <span className="text-xs text-muted-foreground">유통사</span>
            </div>
          </CommandItem>
          <CommandItem>
            <div className="flex items-center justify-between w-full">
              <span>헬스케어 유통</span>
              <span className="text-xs text-muted-foreground">유통사</span>
            </div>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="병원">
          <CommandItem>
            <div className="flex items-center justify-between w-full">
              <span>서울미래의원</span>
              <span className="text-xs text-muted-foreground">병원</span>
            </div>
          </CommandItem>
          <CommandItem>
            <div className="flex items-center justify-between w-full">
              <span>강남클리닉</span>
              <span className="text-xs text-muted-foreground">병원</span>
            </div>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const WithBilling: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md w-[350px]">
      <CommandInput placeholder="검색..." />
      <CommandList>
        <CommandEmpty>결과 없음</CommandEmpty>
        <CommandGroup heading="계정">
          <CommandItem>
            <User className="mr-2 h-4 w-4" />
            <span>프로필</span>
          </CommandItem>
          <CommandItem>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>결제</span>
          </CommandItem>
          <CommandItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>설정</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};
