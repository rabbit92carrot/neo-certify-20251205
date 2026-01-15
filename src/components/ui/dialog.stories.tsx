import type { Meta, StoryObj } from '@storybook/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';

const meta = {
  title: 'UI/Overlays/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">다이얼로그 열기</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>다이얼로그 제목</DialogTitle>
          <DialogDescription>
            다이얼로그에 대한 설명이 여기에 표시됩니다.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>다이얼로그 내용입니다.</p>
        </div>
        <DialogFooter>
          <Button variant="outline">취소</Button>
          <Button>확인</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const WithForm: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>제품 추가</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 제품 등록</DialogTitle>
          <DialogDescription>
            새로운 제품 정보를 입력하세요.
          </DialogDescription>
        </DialogHeader>
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
        <DialogFooter>
          <Button variant="outline">취소</Button>
          <Button>등록</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const WithoutCloseButton: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">닫기 버튼 없음</Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>중요 알림</DialogTitle>
          <DialogDescription>
            이 작업은 취소할 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">취소</Button>
          <Button variant="destructive">삭제</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const ProductDetail: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">제품 상세</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>PDO Thread Type A</DialogTitle>
          <DialogDescription>PDO-A-100</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">UDI-DI</dt>
              <dd>1234567890123</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">상태</dt>
              <dd className="text-green-600">활성</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">등록일</dt>
              <dd>2024-01-01</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">총 생산량</dt>
              <dd>5,000개</dd>
            </div>
          </dl>
        </div>
        <DialogFooter>
          <Button variant="outline">닫기</Button>
          <Button>수정</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
