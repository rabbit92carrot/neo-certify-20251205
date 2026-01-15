import type { Meta, StoryObj } from '@storybook/react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from './sheet';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';

const meta = {
  title: 'UI/Overlays/Sheet',
  component: Sheet,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Right: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">오른쪽 시트 열기</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>시트 제목</SheetTitle>
          <SheetDescription>
            시트에 대한 설명이 여기에 표시됩니다.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <p>시트 내용입니다.</p>
        </div>
      </SheetContent>
    </Sheet>
  ),
};

export const Left: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">왼쪽 시트 열기</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>네비게이션</SheetTitle>
        </SheetHeader>
        <div className="py-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            대시보드
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            제품
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            재고
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            이력
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  ),
};

export const Bottom: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">아래 시트 열기</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>필터</SheetTitle>
          <SheetDescription>
            검색 조건을 설정합니다.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>시작일</Label>
            <Input type="date" />
          </div>
          <div className="space-y-2">
            <Label>종료일</Label>
            <Input type="date" />
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">취소</Button>
          </SheetClose>
          <Button>적용</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const WithForm: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>새 제품 등록</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>새 제품 등록</SheetTitle>
          <SheetDescription>
            새로운 제품 정보를 입력하세요.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">제품명</Label>
            <Input id="name" placeholder="제품명을 입력하세요" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">모델명</Label>
            <Input id="model" placeholder="모델명을 입력하세요" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="udi">UDI-DI</Label>
            <Input id="udi" placeholder="UDI-DI를 입력하세요" />
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">취소</Button>
          </SheetClose>
          <Button>등록</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const MobileNav: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          ☰
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[250px]">
        <SheetHeader>
          <SheetTitle>메뉴</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col space-y-1 py-4">
          <Button variant="ghost" className="justify-start">
            🏠 대시보드
          </Button>
          <Button variant="ghost" className="justify-start">
            📦 제품 관리
          </Button>
          <Button variant="ghost" className="justify-start">
            🏭 생산
          </Button>
          <Button variant="ghost" className="justify-start">
            📤 출고
          </Button>
          <Button variant="ghost" className="justify-start">
            📊 재고
          </Button>
          <Button variant="ghost" className="justify-start">
            📜 이력
          </Button>
        </nav>
      </SheetContent>
    </Sheet>
  ),
};
